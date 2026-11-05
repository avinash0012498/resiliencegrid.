const CACHE_NAME = "resiliencegrid-static-v1";
const CORE = ["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./assets/icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
  if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy))}
  return res;
 }).catch(()=>caches.match("./index.html"))));
});