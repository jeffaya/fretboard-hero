(() => {
  'use strict';
  const timeout=(promise,ms)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('The store is not responding. Please try again.')),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
  });
  let native=false,plugin,platform,storeName='the store',unlocked=false,busy=false,price='',message='',listeners=[],refreshQueued=false;
  const notify=()=>listeners.forEach(fn=>fn({unlocked,busy,price,message}));
  const update=result=>{
    if(typeof result?.unlocked!=='boolean')throw new Error('Could not check your purchase.');
    if(result.unlocked!==unlocked){unlocked=result.unlocked;location.reload();return}
    message=result.status==='pending'?`Payment pending. Full access will unlock after ${storeName} confirms it.`:result.status==='cancelled'?'Purchase cancelled. You can keep exploring.':result.unlocked?'Your full access is restored.':`No completed purchase found for this app and ${storeName} account.`;
  };
  async function run(method,quiet=false){
    if(!plugin)return;
    if(busy){if(quiet)refreshQueued=true;return}
    busy=true;message=method==='purchase'?`Opening ${storeName}…`:'Checking purchases…';notify();
    try{
      // A user may spend several minutes inside the store's purchase or account sheet.
      const request=plugin[quiet&&platform==='ios'?'refresh':method]();
      update(await (method==='purchase'||(method==='restore'&&!quiet&&platform==='ios')?request:timeout(request,45000)));
    }catch(error){
      message=error?.message||`${storeName} is unavailable. Please try again.`;
      // An outage is not a revocation. Keep the last verified ownership;
      // only a successful native check may change access.
    }finally{busy=false;if(quiet)message='';notify();if(refreshQueued){refreshQueued=false;run('restore',true)}}
  }
  async function refreshPrice(quiet=false){
    if(!plugin)return;
    try{const result=await timeout(plugin.price(),15000);price=result.price||'';if(!price)throw new Error('Price unavailable');if(!busy)message=''}catch(error){price='';if(!busy&&!quiet)message=error?.message||`Connect to ${storeName} to see the price.`}
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
    const buy=document.createElement('button'),restore=document.createElement('button'),status=document.createElement('p'),scope=document.createElement('p');
    buy.type=restore.type='button';buy.className='ui-primary modal-action';restore.className='ui-secondary modal-action';
    buy.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="14" height="11" rx="2"/><path d="M9 10V6a4 4 0 0 1 8 0M10 15v2"/></g></svg>';
    restore.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M7 18a5 5 0 0 1 10 0"/><circle cx="12" cy="10" r="3"/></g></svg>';
    const buyLabel=document.createElement('span'),restoreLabel=document.createElement('span');restoreLabel.textContent='Restore purchases';buy.append(buyLabel);restore.append(restoreLabel);
    status.className='billing-status';status.setAttribute('role','status');scope.className='billing-scope';scope.textContent='Guitar, bass & ukulele. All notes, keys and modes. One payment, no subscription. Valid in this app.';
    host.append(buy,restore,scope,status);
    listeners.push(state=>{buyLabel.textContent=state.price?`Unlock full access — ${state.price}`:'Check price';buy.disabled=restore.disabled=state.busy||!plugin;status.textContent=state.message});
    buy.addEventListener('click',()=>price?run('purchase'):refreshPrice());restore.addEventListener('click',()=>run('restore'));notify();
  }
  function attach(){
    if(!native)return;
    // Home owns the footer link; purchase controls and feedback stay in the dialog.
    if(!plugin)return;
    try{Promise.resolve(plugin.addListener('purchasesChanged',()=>run('restore',true))).catch(()=>{})}catch{}
    window.Capacitor.Plugins?.App?.addListener('appStateChange',state=>{if(state.isActive)run('restore',true)});
    run('restore',true);
    if(!unlocked)refreshPrice(true);
    setInterval(()=>{if(document.visibilityState==='visible')run('restore',true)},15*60*1000);
  }
  window.FretboardBilling={initialize,attach,mountPaywall,refreshPrice,get native(){return native}};
})();
