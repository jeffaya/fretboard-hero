const {defineConfig,devices}=require('@playwright/test');

module.exports=defineConfig({
  testDir:'.',testMatch:'*.spec.cjs',fullyParallel:true,
  forbidOnly:!!process.env.CI,retries:0,workers:process.env.CI?2:undefined,
  timeout:60000,expect:{timeout:7000},
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',serviceWorkers:'block',locale:'en-US',
    trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:false},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}},testIgnore:'**/billing.spec.cjs'},
    {name:'desktop-firefox',use:{...devices['Desktop Firefox'],viewport:{width:1440,height:900}},testIgnore:'**/billing.spec.cjs'},
    {name:'android-chromium',use:{...devices['Pixel 5']}},
    {name:'iphone-webkit',use:{...devices['iPhone 13']}},
    {name:'ipad-webkit',use:{...devices['iPad Pro 11']},testIgnore:'**/billing.spec.cjs'}
  ]
});
