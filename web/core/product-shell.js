(() => {
  'use strict';
  const q=(sel)=>document.querySelector(sel);
  const setAttr=(sel,attr,value)=>{const el=q(sel);if(el&&value!=null)el.setAttribute(attr,String(value));};
  const setMeta=(selector,value)=>setAttr(selector,'content',value);
  const setText=(sel,value)=>{const el=q(sel);if(el&&value!=null)el.textContent=String(value)};
  const setAria=(sel,value)=>setAttr(sel,'aria-label',value);

  function apply(product,instrument){
    if(!product) throw new Error('ProductShell requires an active product');
    const branding=product.branding||{};
    const seo=product.seo||{};
    const pwa=product.pwa||{};
    const iconKey=(product.id||'').replace(/-fretboard-hero$/,'')||'guitar';
    const iconBase=`assets/instruments/${iconKey}/`;
    const assets={
      faviconIco:`${iconBase}favicon.ico`,
      favicon16:`${iconBase}favicon-16.png`,
      favicon32:`${iconBase}favicon-32.png`,
      favicon48:`${iconBase}favicon-48.png`,
      icon192:`${iconBase}icon-192.png`,
      icon512:`${iconBase}icon-512.png`,
      appleTouchIcon:`${iconBase}apple-touch-icon.png`,
      maskable512:`${iconBase}icon-maskable-512.png`,
      ...(product.assets||{})
    };
    const home=product.home||{};
    const name=branding.name||product.name||'Fretboard Hero';
    const url=seo.canonical||product.url||location.href;
    const ogImage=new URL(assets.ogImage||'assets/instruments/guitar/og.jpg','https://fretboard-hero.com/').href;

    document.title=seo.title||name;
    setMeta('meta[name="application-name"]',name);
    setMeta('meta[name="apple-mobile-web-app-title"]',pwa.shortName||name);
    setMeta('meta[name="description"]',seo.description||'Interactive fretboard trainer.');
    setMeta('meta[name="keywords"]',(seo.keywords||[]).join(', '));
    setAttr('link[rel="canonical"]','href',url);
    setMeta('meta[property="og:title"]',seo.ogTitle||seo.title||name);
    setMeta('meta[property="og:description"]',seo.ogDescription||seo.description||'Interactive fretboard trainer.');
    setMeta('meta[property="og:site_name"]',seo.siteName||name);
    setMeta('meta[property="og:url"]',url);
    setMeta('meta[property="og:image"]',ogImage);
    setMeta('meta[property="og:image:alt"]',seo.ogImageAlt||`${name} fretboard trainer`);
    setMeta('meta[name="twitter:title"]',seo.twitterTitle||seo.ogTitle||seo.title||name);
    setMeta('meta[name="twitter:description"]',seo.twitterDescription||seo.ogDescription||seo.description||'Interactive fretboard trainer.');
    setMeta('meta[name="twitter:image"]',ogImage);

    const structured=q('#productStructuredData');
    if(structured){
      structured.textContent=JSON.stringify({
        '@context':'https://schema.org','@type':['VideoGame','WebApplication'],name,url,image:ogImage,
        description:seo.structuredDescription||seo.description||'Interactive fretboard trainer.',
        applicationCategory:'EducationalApplication',gamePlatform:['Web Browser','Mobile Web','Tablet'],operatingSystem:'Any',
        isAccessibleForFree:true,inLanguage:'en',keywords:(seo.keywords||[]).join(', '),
        genre:['Music','Education'],featureList:seo.featureList||[],
        author:{'@type':'Person',name:'Jean-François Seignemorte'},
        publisher:{'@type':'Person',name:'Jean-François Seignemorte'}
      });
    }

    setAttr('#home .hero-logo svg','viewBox',assets.heroLogoViewport);
    setAria('#home .hero-logo svg',name);
    setAria('#home',`${name} home`);
    setText('.tagline',`MASTER THE ${(branding.instrumentName||instrument?.label||'INSTRUMENT').toUpperCase()} NECK`);
    setText('#home .practice-card small',ModeRegistry.list(instrument).map(m=>m.label.charAt(0)+m.label.slice(1).toLowerCase()).join(' · '));
    setText('#home .map-card small','Explore the neck');
    setText('#home .circle-card small','Visualize & practice');
    setText('#home .quiz-card small','Test your knowledge');

    const instrumentLabel=(instrument?.label||branding.instrumentName||'instrument').toLowerCase();
    setAria('#practiceFretboard',`Interactive ${instrumentLabel} fretboard`);
    setAria('#mapFretboard',`All ${instrumentLabel} notes on the fretboard`);
    setAria('#quizFretboard',`Quiz ${instrumentLabel} fretboard`);

    const iconMap={
      'link[rel="icon"][sizes="16x16 32x32 48x48"]':assets.faviconIco,
      'link[rel="shortcut icon"]':assets.faviconIco,
      'link[rel="icon"][type="image/svg+xml"]':assets.faviconSvg,
      'link[rel="icon"][sizes="16x16"]':assets.favicon16,
      'link[rel="icon"][sizes="32x32"]':assets.favicon32,
      'link[rel="icon"][sizes="48x48"]':assets.favicon48,
      'link[rel="icon"][sizes="192x192"]':assets.icon192,
      'link[rel="icon"][sizes="512x512"]':assets.icon512,
      'link[rel="apple-touch-icon"][sizes="120x120"]':`${iconBase}apple-touch-icon-120.png`,
      'link[rel="apple-touch-icon"][sizes="152x152"]':`${iconBase}apple-touch-icon-152.png`,
      'link[rel="apple-touch-icon"][sizes="167x167"]':`${iconBase}apple-touch-icon-167.png`,
      'link[rel="apple-touch-icon"][sizes="180x180"]':`${iconBase}apple-touch-icon-180.png`
    };
    Object.entries(iconMap).forEach(([sel,href])=>{if(href)setAttr(sel,'href',href)});

    const manifest={
      name:pwa.name||name,short_name:pwa.shortName||'Fretboard Hero',description:pwa.description||seo.description||'Interactive fretboard trainer.',
      id:'./',start_url:'./',scope:'./',display:'standalone',orientation:'any',background_color:pwa.backgroundColor||'#05070b',theme_color:pwa.themeColor||'#05070b',
      categories:pwa.categories||['education','music','games'],icons:[
        {src:assets.icon192||'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
        {src:assets.icon512||'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
        {src:assets.maskable512||'icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
      ]
    };
    let manifestLink=q('link[rel="manifest"]');
    if(!manifestLink){manifestLink=document.createElement('link');manifestLink.rel='manifest';document.head.appendChild(manifestLink)}
    manifestLink.href=pwa.manifest||'manifest.webmanifest';
    document.documentElement.dataset.productReady='true';
    window.FRETBOARD_ACTIVE_BRANDING=Object.freeze({name,url,ogImage,manifest});
  }
  window.ProductShell=Object.freeze({apply});
})();
