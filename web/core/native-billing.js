(() => {
  'use strict';
  const timeout=(promise,ms)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('The store is not responding. Please try again.')),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
  });
  const RETRY_DELAYS=[1000,2000,5000,10000,20000];
  let native=false,plugin,platform,storeName='the store',unlocked=false,busy=false,price='',message='',diagnostic='',listeners=[];
  let activeMethod='',refreshing=false,refreshQueued=false,reloading=false,attached=false,appActive=true;
  let recovering=false,retryIndex=0,retryTimer;
  const visible=()=>appActive&&document.visibilityState!=='hidden';
  function stopRecovery(){clearTimeout(retryTimer);retryTimer=undefined;recovering=false;retryIndex=0}
  const notify=()=>listeners.forEach(fn=>fn({unlocked,busy,price,message,diagnostic}));
  function showError(error,fallback){
    message=error?.message||fallback;
    const code=error?.code;
    diagnostic=typeof code==='string'&&/^PLAY_[A-Z_]+(?:_-?\d+)?$/.test(code)
      ? [code,typeof error.data?.debugMessage==='string'?error.data.debugMessage.slice(0,1000):''].filter(Boolean).join('\n'):'';
  }
  async function storeRequest(method){
    for(let attempt=0;;attempt++){
      try{return await plugin[method]()}
      catch(error){
        // Only retry known transient failures before the payment sheet opens.
        // Never replay a launch, payment callback, cancellation or billing refusal.
        if(platform!=='android'||!/^PLAY_(SETUP|CATALOG)_(-1|2|6|12)$/.test(error?.code)||attempt===2||!visible()||reloading)throw error;
        await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
        if(reloading)return {unlocked};
        if(!visible())throw error;
      }
    }
  }
  const update=(result,quiet=false)=>{
    if(reloading)return;
    if(typeof result?.unlocked!=='boolean')throw new Error('Could not check your purchase.');
    // Refresh the existing immutable access model once, after native verification.
    // Late purchase/restore callbacks must not undo a newly verified unlock.
    if(result.unlocked!==unlocked){unlocked=result.unlocked;reloading=true;stopRecovery();location.reload();return}
    if(quiet)return;
    diagnostic='';
    message=result.status==='pending'?`Payment pending. Full access will unlock after ${storeName} confirms it.`:result.status==='cancelled'?'Purchase cancelled. You can keep exploring.':result.unlocked?'Your full access is restored.':`No completed purchase found for this app and ${storeName} account.`;
  };
  function scheduleRecovery(){
    if(!recovering||reloading||!visible()||retryTimer!==undefined)return;
    if(retryIndex===RETRY_DELAYS.length){stopRecovery();return}
    retryTimer=setTimeout(()=>{retryTimer=undefined;refreshOwnership()},RETRY_DELAYS[retryIndex++]);
  }
  async function refreshOwnership(){
    if(!plugin||reloading||!visible())return;
    // The store may return to the app before purchase() settles (or lose that
    // callback entirely). Reconciliation must never wait behind that promise.
    if(refreshing||(busy&&activeMethod!=='purchase')){refreshQueued=true;return}
    refreshing=true;
    try{update(await timeout(plugin[platform==='ios'?'refresh':'restore'](),45000),true)}
    catch{ /* An outage is not a revocation. Retry without erasing payment feedback. */ }
    finally{
      refreshing=false;
      if(refreshQueued){refreshQueued=false;refreshOwnership()}
      else scheduleRecovery();
    }
  }
  function requestRefresh(recover=false){
    if(recover&&!unlocked&&!recovering){recovering=true;retryIndex=0}
    clearTimeout(retryTimer);retryTimer=undefined;
    refreshOwnership();
  }
  async function run(method){
    if(!plugin||busy||reloading)return;
    busy=true;activeMethod=method;let cancelled=false,purchaseStarted=false;diagnostic='';
    message=method==='purchase'?`Opening ${storeName}…`:'Checking purchases…';notify();
    try{
      // Retry the catalog and continue the same click after a startup failure.
      if(method==='purchase'&&!price){
        const catalog=await timeout(storeRequest('price'),45000);price=catalog.price||'';
        if(!price)throw new Error('Price unavailable');
      }
      if(reloading)return;
      // A user may spend several minutes inside the store's purchase or account sheet.
      purchaseStarted=method==='purchase';
      const request=storeRequest(method);
      const result=await (method==='purchase'||(method==='restore'&&platform==='ios')?request:timeout(request,45000));
      cancelled=result?.status==='cancelled';update(result);
    }catch(error){
      showError(error,`${storeName} is unavailable. Please try again.`);
      if(/^PLAY_(SETUP|CATALOG|PRODUCT|OFFER)_/.test(error?.code))purchaseStarted=false;
      // An outage is not a revocation. Keep the last verified ownership;
      // only a successful native check may change access.
    }finally{
      busy=false;activeMethod='';notify();
      if(cancelled)stopRecovery();
      // Recover transient verification failures and pending payments promptly,
      // instead of waiting for a restart or the fifteen-minute periodic check.
      if(purchaseStarted&&!cancelled&&!unlocked)requestRefresh(true);
      else if(refreshQueued){refreshQueued=false;refreshOwnership()}
    }
  }
  async function refreshPrice(quiet=false){
    if(!plugin)return;
    try{const result=await timeout(plugin.price(),15000);price=result.price||'';if(!price)throw new Error('Price unavailable');if(!busy&&!quiet){message='';diagnostic=''}}catch(error){price='';if(!busy&&!quiet)showError(error,`Connect to ${storeName} to see the price.`)}
    notify();
  }
  async function initialize(config){
    native=config.nativeBilling===true;
    if(!native)return false;
    const capacitor=window.Capacitor;
    platform=capacitor?.getPlatform?.();
    if(!['android','ios'].includes(platform)){message='Purchases are available in the app installed from its store.';return false}
    storeName=platform==='ios'?'the App Store':'Google Play';
    try{
      const name=platform==='ios'?'StoreBilling':'PlayBilling';
      plugin=capacitor.Plugins?.[name]||capacitor.registerPlugin?.(name);
      if(!plugin)throw new Error('Billing plugin missing');
      const cached=await timeout(plugin.cachedState(),10000);unlocked=cached.unlocked===true;
    }catch{message=`${storeName} billing is unavailable. Please update the app.`}
    return unlocked;
  }
  function mountPaywall(host){
    host.classList.add('premium-billing');
    const buy=document.createElement('button'),restore=document.createElement('button'),status=document.createElement('p'),help=document.createElement('p');
    buy.type=restore.type='button';buy.className='ui-primary modal-action';restore.className='ui-secondary modal-action';
    buy.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="14" height="11" rx="2"/><path d="M9 10V6a4 4 0 0 1 8 0M10 15v2"/></g></svg>';
    restore.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M7 18a5 5 0 0 1 10 0"/><circle cx="12" cy="10" r="3"/></g></svg>';
    const buyLabel=document.createElement('span'),restoreLabel=document.createElement('span');buyLabel.textContent='Unlock for life';restoreLabel.textContent='Restore your access';buy.append(buyLabel);restore.append(restoreLabel);
    status.className='billing-status';status.setAttribute('role','status');help.className='billing-restore-help';help.id='premiumRestoreHelp';help.textContent='Already purchased on another phone? Restore your access with the same account, without paying again.';
    restore.setAttribute('aria-describedby',help.id);
    const details=document.createElement('details'),summary=document.createElement('summary'),debug=document.createElement('code');
    details.className='billing-diagnostics';details.hidden=true;summary.textContent='Error details';debug.setAttribute('data-no-i18n','');details.append(summary,debug);
    host.append(buy,restore,help,status,details);
    // Keep the catalog check before payment; the store sheet displays the final price.
    listeners.push(state=>{buy.disabled=restore.disabled=state.busy||!plugin;status.textContent=state.message;debug.textContent=state.diagnostic;details.hidden=!state.diagnostic;if(!state.diagnostic)details.open=false});
    buy.addEventListener('click',()=>run('purchase'));restore.addEventListener('click',()=>run('restore'));notify();
  }
  function attach(){
    if(!native||attached)return;
    // Home owns the footer link; purchase controls and feedback stay in the dialog.
    if(!plugin)return;
    attached=true;
    const listen=(target,event,callback)=>{try{Promise.resolve(target?.addListener(event,callback)).catch(()=>{})}catch{}};
    listen(plugin,'purchasesChanged',()=>requestRefresh(true));
    try{
      const capacitor=window.Capacitor,app=capacitor.Plugins?.App||capacitor.registerPlugin?.('App');
      listen(app,'appStateChange',state=>{appActive=state.isActive;if(appActive)requestRefresh(true)});
    }catch{}
    // WebView visibility/online events also cover a missing lifecycle bridge.
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestRefresh(true)});
    window.addEventListener?.('online',()=>requestRefresh(true));
    requestRefresh();
    if(!unlocked)refreshPrice(true);
    setInterval(()=>requestRefresh(),15*60*1000);
  }
  window.FretboardBilling={initialize,attach,mountPaywall,refreshPrice,get native(){return native}};
})();

