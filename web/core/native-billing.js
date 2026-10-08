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
      // Do not extend offline access when verification fails.
      try{const cached=await timeout(plugin.cachedState(),2000);if(unlocked&&!cached.unlocked){unlocked=false;location.reload()}}catch{}
    }finally{busy=false;if(quiet&&(unlocked||message.startsWith('No completed purchase')))message='';notify();if(refreshQueued){refreshQueued=false;run('restore',true)}}
  }
  async function refreshPrice(){
    if(!plugin)return;
    try{const result=await timeout(plugin.price(),15000);price=result.price||'';if(!price)throw new Error('Price unavailable');if(!busy)message=''}catch(error){price='';if(!busy)message=error?.message||`Connect to ${storeName} to see the price.`}
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
      const cached=await timeout(plugin.cachedState(),2000);unlocked=cached.unlocked===true;
    }catch{message=`${storeName} billing is unavailable. Please update the app.`}
    return unlocked;
  }
  function mountPaywall(host){
    host.classList.add('premium-billing');
    const buy=document.createElement('button'),restore=document.createElement('button'),status=document.createElement('p'),scope=document.createElement('p');
    buy.type=restore.type='button';buy.className='ui-primary premium-store';restore.className='ui-secondary premium-store';restore.textContent='Restore purchases';
    status.className='billing-status';status.setAttribute('role','status');scope.className='billing-scope';scope.textContent='Guitar, bass & ukulele. All notes, keys and modes. One payment, no subscription. Valid in this app.';
    host.append(buy,restore,scope,status);
    listeners.push(state=>{buy.textContent=state.price?`Unlock full access — ${state.price}`:'Check price';buy.disabled=restore.disabled=state.busy||!plugin;status.textContent=state.message});
    buy.addEventListener('click',()=>price?run('purchase'):refreshPrice());restore.addEventListener('click',()=>run('restore'));notify();
  }
  function attach(){
    if(!native)return;
    const row=document.createElement('div');row.className='home-billing';
    const buy=document.createElement('button'),restore=document.createElement('button');buy.type=restore.type='button';buy.className=restore.className='ui-back';buy.textContent='Unlock full access';restore.textContent='Restore purchases';buy.hidden=unlocked;
    const status=document.createElement('p');status.setAttribute('role','status');
    row.append(buy,restore,status);document.querySelector('.home-menu').append(row);
    buy.addEventListener('click',()=>window.FRETBOARD_PREMIUM.open());restore.addEventListener('click',()=>run('restore'));
    listeners.push(state=>{restore.disabled=state.busy||!plugin;status.textContent=state.message});notify();
    if(!plugin)return;
    Promise.resolve(plugin.addListener('purchasesChanged',()=>run('restore',true))).catch(()=>{});
    window.Capacitor.Plugins?.App?.addListener('appStateChange',state=>{if(state.isActive)run('restore',true)});
    run('restore',true);
    setInterval(()=>{if(document.visibilityState==='visible')run('restore',true)},15*60*1000);
  }
  window.FretboardBilling={initialize,attach,mountPaywall,refreshPrice,get native(){return native}};
})();
