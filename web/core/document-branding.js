(() => {
  'use strict';
  const products=new Map();let revision=0;
  async function apply(instrument,assetBase='./'){
    const current=++revision,entry=window.FretboardInstrumentSelection.catalog[instrument];
    if(!entry)throw new Error('Unknown document instrument');
    document.documentElement.dataset.instrument=instrument;
    if(!products.has(instrument))products.set(instrument,new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=assetBase+entry.product.replace(/^\.\//,'');
      script.onload=resolve;script.onerror=()=>reject(new Error('Product branding unavailable'));document.head.appendChild(script);
    }).catch(error=>{products.delete(instrument);throw error}));
    await products.get(instrument);
    const product=window.FRETBOARD_PRODUCTS[entry.productKey];
    if(current===revision){
      document.querySelector('.brand svg')?.setAttribute('viewBox',product.assets.heroLogoViewport);
      document.querySelector('.brand')?.setAttribute('aria-label',product.branding?.name||product.name);
      const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=assetBase+'assets/instruments/'+entry.productKey+'/favicon.ico';
    }
    return product;
  }
  window.FretboardDocumentBranding=Object.freeze({apply});
})();
