// Serve the checked-in web assets only. Test configuration and store doubles are
// injected by Playwright routes/init scripts, never shipped to the application.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../../web');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp',
  '.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff',
  '.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(pathname==='/')pathname='/index.html';
    if(pathname==='/privacy'||pathname==='/privacy/')pathname='/privacy.html';
    // Mirror Workers' default directory-index routing for generated guide pages.
    if(pathname.endsWith('/'))pathname+='index.html';
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found')}
}).listen(4173,'127.0.0.1');
