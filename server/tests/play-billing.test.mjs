import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handlePlayBilling, PACKAGES } from '../play-billing.mjs';
const env={PLAY_SERVICE_ACCOUNT_EMAIL:'test@example.com',PLAY_SERVICE_ACCOUNT_PRIVATE_KEY:'test-only-placeholder'};
const input={packageName:'com.guitar.fretboardhero',productId:'full_access',purchaseToken:'valid.test-token'};
const request=(body=input)=>new Request('https://fretboard-hero.com/api/billing/google/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const response=(body,status=200)=>Response.json(body,{status});
const purchased={purchaseState:0,consumptionState:0,acknowledgementState:1};
const deps=fetcher=>({fetcher,getAccessToken:async()=>'test-access-token'});
test('Each allowed package grants one non-consumable entitlement, independent of selected instrument',async()=>{
 for(const packageName of PACKAGES){let calls=0;const r=await handlePlayBilling(request({...input,packageName}),env,deps(async(url,options)=>{calls++;assert.ok(url.includes('/applications/'+packageName+'/'));assert.ok(url.includes('/products/full_access/tokens/valid.test-token'));assert.equal(options.headers.Authorization,'Bearer test-access-token');return response(purchased)}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{unlocked:true,status:'purchased'});assert.equal(calls,1);assert.equal(r.headers.get('Cache-Control'),'no-store')}
});
test('First purchase is acknowledged and never consumed',async()=>{
 const urls=[];const r=await handlePlayBilling(request(),env,deps(async(url,options)=>{urls.push(url);if(url.endsWith(':acknowledge')){assert.equal(options.method,'POST');return new Response(null,{status:204})}return response({...purchased,acknowledgementState:0})}));assert.equal((await r.json()).unlocked,true);assert.equal(urls.length,2);assert.ok(urls[1].endsWith(':acknowledge'));
});
test('Pending, refunded, consumed and invalid purchases never unlock or get acknowledged',async()=>{
 for(const [body,status] of [[{...purchased,purchaseState:2},'pending'],[{...purchased,purchaseState:1},'not_owned'],[{...purchased,consumptionState:1},'not_owned'],[{...purchased,productId:'another'},'not_owned'],[{},'not_owned']]){let calls=0;const r=await handlePlayBilling(request(),env,deps(async()=>{calls++;return response(body)}));assert.deepEqual(await r.json(),{unlocked:false,status});assert.equal(calls,1)}
 for(const status of [400,404,410]){const r=await handlePlayBilling(request(),env,deps(async()=>response({},status)));assert.equal((await r.json()).unlocked,false)}
});
test('Concurrent acknowledgement succeeds only after rechecking active ownership',async()=>{
 for(const [latest,unlocked] of [[purchased,true],[{...purchased,purchaseState:1},false]]){let n=0;const r=await handlePlayBilling(request(),env,deps(async()=>++n===1?response({...purchased,acknowledgementState:0}):n===2?response({},409):response(latest)));assert.equal((await r.json()).unlocked,unlocked)}
});
test('Google outage or acknowledgement failure never grants access or exposes token/errors',async()=>{
 for(const status of [401,403,429,500]){const r=await handlePlayBilling(request(),env,deps(async()=>response({secret:input.purchaseToken},status)));assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'verification_unavailable'})}
 const r=await handlePlayBilling(request(),env,deps(async url=>url.endsWith(':acknowledge')?response({},500):response({...purchased,acknowledgementState:0})));assert.equal(r.status,503);
});
test('Validate package, product, request size and method before calling Google',async()=>{
 const d=deps(async()=>assert.fail('Unexpected Google request'));
 for(const body of [null,{}, {...input,packageName:'attacker.app'}, {...input,productId:'anything'}, {...input,purchaseToken:'a/b'}, {...input,purchaseToken:'x'.repeat(5000)}]){const r=await handlePlayBilling(request(body),env,d);assert.ok([400,413].includes(r.status))}
 assert.equal((await handlePlayBilling(new Request('https://example.com'),env,d)).status,405);
 const browser=request();browser.headers.set('Origin','https://evil.example');assert.equal((await handlePlayBilling(browser,env,d)).status,403);
 assert.equal((await handlePlayBilling(request(),{},d)).status,503);
 assert.equal((await handlePlayBilling(request(),{...env,PLAY_BILLING_LIMITER:{limit:async()=>({success:false})}},d)).status,429);
});
