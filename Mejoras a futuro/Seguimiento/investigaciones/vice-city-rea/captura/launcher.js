/* Vice City launcher: handwritten delivery, storage, and UI code.
 * IDBFS integration is adapted from Alexey Olendor's MIT-licensed reVCDOS.
 * See THIRD_PARTY_NOTICES.md for pinned upstream sources. */
(() => {
'use strict';
const release = JSON.parse(document.getElementById('release-metadata').textContent);
const openingAudio = JSON.parse(document.getElementById('opening-audio').textContent);
const streamedAudio = JSON.parse(document.getElementById('streamed-audio').textContent);
const manifest = JSON.parse(document.getElementById('asset-manifest').textContent);
const $ = id => document.getElementById(id);
const BUILD = manifest.build;
const SAVE_ROOT = '/vc-assets/local/userfiles';
const CONFIG_KEY = 'vcsky.revc.ini';
const nativeFetch = window.fetch.bind(window);
const NativeXHR = window.XMLHttpRequest;
const stats = {networkBytes:0, cachedBytes:0, requests:0, fallbacks:0, syncRequests:0, embeddedBytes:0, backgroundPauses:0, optionalAudioFallbacks:0, startedAt:0, readyAt:0};
const formatBytes = n => `${(n / 1048576).toFixed(1)} MiB`;
const state = {started:false, ready:false, runtimeInitialized:false, savesRestored:false, savesRestoreFailed:false, backgroundStopped:false, persistent:false, cacheDisabled:false, gameplaySince:0, lastForegroundAt:0, assetBlocked:false, urls:new Map(), inflight:new Map(), preferred:null, failed:new Map(), stage:'Ready to play', warnings:new Set()};
const degradedAudio=new Map();
const diagnosticEvents=[],assetFailures=new Map(),negativeDownloads=new Map(),pendingRequests=new Map(),retryLogs=new Map();
let requestSequence=0,frameHeartbeat=0,frameCount=0;
function record(type,path,detail=''){diagnosticEvents.push({at:Math.round(performance.now()),type,path,detail:String(detail).slice(0,300)});if(diagnosticEvents.length>128)diagnosticEvents.shift();}
function boundedSet(map,key,value){if(map.size>=128&&!map.has(key))map.delete(map.keys().next().value);map.set(key,value);}
function nativeLog(error,...args){
 const text=args.map(String).join(' '),match=text.match(/retrying to fetch\s+(.+?)\s+\(\d+\)/i);
 if(match){const path=logicalPath(match[1])||'unknown';const count=(retryLogs.get(path)||0)+1;boundedSet(retryLogs,path,count);if(count===1){record('engine-retry',path);console.warn('Game retrying asset:',path);}return;}
 (error?console.error:console.log)(...args);
}
function captureDiagnostics(){return {version:release.version,gameBuild:BUILD,audioRepair:openingAudio.version,launchMode:location.protocol,stage:state.stage,ready:state.ready,cutscene:document.body.dataset.stateCutscene,menu:document.body.dataset.stateMenu,frameHeartbeat,frameCount,stats:{...stats},failures:[...assetFailures.values(),...[...negativeDownloads].filter(([path])=>!assetFailures.has(path)).map(([path,value])=>({path,kind:manifest.assets[path]?'download':'unindexed',message:String(value.error.message||value.error).slice(0,400),retryAfter:value.until}))].slice(0,128),degradedAudio:[...degradedAudio.values()],pendingCount:pendingRequests.size,pending:[...pendingRequests.values()].slice(0,128),retries:[...retryLogs].map(([path,count])=>({path,count})),events:[...diagnosticEvents],audioContexts:typeof AL==='undefined'?[]:Object.values(AL.contexts).slice(0,8).map(c=>({state:c.audioCtx?.state,time:c.audioCtx?.currentTime,playingSources:Object.values(c.sources||{}).filter(src=>src.state===4114).length}))};}
function recordAssetFailure(path,error,kind='download'){
 const old=assetFailures.get(path),failure={path,kind,message:String(error.message||error).slice(0,400),attempts:(old?.attempts||0)+1,optional:optionalAudio(path)};boundedSet(assetFailures,path,failure);
 if(!old){record('asset-failure',path,failure.message);warn(`${kind==='unindexed'?'No verified file in this build':'Could not download'}: ${path}`);}
 if(!failure.optional&&state.ready&&!state.assetBlocked&&(failure.attempts>=3||/^(anim\/cuts\.img\/|audio\/(?:intro[1-4]\.wav|int_[a-z]\.mp3)$)/.test(path))){
  state.assetBlocked=true;window.Module?.pauseMainLoop?.();
  if(typeof AL!=='undefined')for(const context of Object.values(AL.contexts))context.audioCtx?.suspend?.().catch(()=>{});
  showFailure(new Error(`Game loading stopped: ${path}. ${failure.message} Completed downloads and saved slots are retained. Export saves or reload to retry.`));
 }
}
function retryDownloads(){state.failed.clear();negativeDownloads.clear();}
function say(text, error=false) { $('message').textContent=text; $('message').classList.toggle('error', error); }
function warn(text) {if(state.warnings.has(text)||state.warnings.size>=32)return;state.warnings.add(text);const messages=[...state.warnings];$('warnings').textContent=messages.slice(0,8).join(' ')+(messages.length>8?' Additional unavailable files are listed in the asset coverage report.':'');}
function setting(key, fallback=null) { try { return localStorage.getItem(key) ?? fallback; } catch { warn('Settings storage is unavailable. Export saves before leaving.'); return fallback; } }
function putSetting(key,value) { try { value===null ? localStorage.removeItem(key) : localStorage.setItem(key,value); } catch { warn('Settings could not be stored.'); } }
const settings = {preset:setting('vc-port.preset','saved')};
function progress() {
 $('transfer').textContent=`Downloaded ${formatBytes(stats.networkBytes)} · Reused ${formatBytes(stats.cachedBytes)}${stats.embeddedBytes?` · Bundled ${formatBytes(stats.embeddedBytes)}`:''}${stats.fallbacks ? ` · ${stats.fallbacks} fallbacks` : ''}`;
 $('stage').textContent=state.stage;
}
let updatePending=false;
function scheduleProgress() { if (!updatePending) { updatePending=true; setTimeout(()=>{updatePending=false;progress();},100); } }
async function hash(buffer) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)), b=>b.toString(16).padStart(2,'0')).join(''); }
function aborted(signal) { if (signal?.aborted) throw signal.reason || new DOMException('Aborted','AbortError'); }
function awaitSignal(promise,signal) {
 if (!signal) return promise;
 aborted(signal);
 return new Promise((resolve,reject)=>{
  const stop=()=>reject(signal.reason || new DOMException('Aborted','AbortError'));
  signal.addEventListener('abort',stop,{once:true});
  promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',stop));
 });
}
class Database {
 constructor(name, stores) { this.name=name; this.stores=stores; this.connection=null; }
 open() {
  if (!this.connection) this.connection=new Promise((resolve,reject)=>{
   const req=indexedDB.open(this.name,1);
   req.onupgradeneeded=()=>{ for(const store of this.stores) if(!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store); };
   req.onerror=()=>reject(req.error);
   req.onblocked=()=>reject(new Error('Storage is open in another tab. Close the other game tab and retry.'));
   req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();this.connection=null;};resolve(req.result);};
  }).catch(e=>{this.connection=null;throw e;});
  return this.connection;
 }
 async run(store,mode,action) {
  const db=await this.open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(store,mode);let result;
   try { const req=action(tx.objectStore(store)); if(req) req.onsuccess=()=>result=req.result; } catch(e){tx.abort();reject(e);return;}
   tx.oncomplete=()=>resolve(result); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error || new Error('Storage transaction aborted'));
  });
 }
 get(store,key){return this.run(store,'readonly',s=>s.get(key));}
 put(store,key,value){return this.run(store,'readwrite',s=>s.put(value,key));}
 delete(store,key){return this.run(store,'readwrite',s=>s.delete(key));}
}
const assetsDB=new Database('vc-port-assets-v1',['files']);
class Queue {
 constructor(limit) {this.limit=limit;this.active=0;this.pending=[];}
 run(work,priority=0,tag=null) {return new Promise((resolve,reject)=>{this.pending.push({work,resolve,reject,priority,tag});this.pending.sort((a,b)=>b.priority-a.priority);this.drain();});}
 promote(tag,priority){for(const job of this.pending)if(job.tag===tag)job.priority=Math.max(job.priority,priority);this.pending.sort((a,b)=>b.priority-a.priority);}
 drain() {while(this.active<this.limit && this.pending.length){const job=this.pending.shift();this.active++;Promise.resolve().then(job.work).then(job.resolve,job.reject).finally(()=>{this.active--;this.drain();});}}
}
const transfers=new Queue(4),transferTasks=new Map();
function promotePart(path,priority){
 transfers.promote(path,priority);
 for(const task of transferTasks.values())if(task.path===path&&priority>task.priority){task.priority=priority;task.optional=false;}
}
function foregroundBusy(){return [...transferTasks.values()].some(task=>task.networkActive&&!task.optional&&task.priority>=5);}
function pauseOptionalTransfers(){
 for(const task of transferTasks.values())if(task.optional&&task.networkActive&&!task.controller.signal.aborted){
  stats.backgroundPauses++;record('background-paused',task.path,'Foreground asset needs bandwidth');
  task.controller.abort(new DOMException('Waiting for foreground assets','BackgroundPaused'));
 }
}
function assetKey(path){return `${BUILD}/${path}`;}
function urlFor(host,path,search=''){return `https://${host}/gh/web-ports/vice-city@${BUILD}/${path}${search}`;}
function logicalPath(input) {
 let u;try {u=new URL(input instanceof Request ? input.url : String(input),location.href);}catch{return null;}
 if(u.protocol==='blob:' || u.protocol==='data:') return null;
 const prefix=`/gh/web-ports/vice-city@${BUILD}/`;
 if(manifest.routes.includes(u.hostname) && u.pathname.startsWith(prefix)) return u.pathname.slice(prefix.length);
 if(u.hostname==='cdn.dos.zone' && u.pathname.startsWith('/vcsky/fetched/')) return u.pathname.slice('/vcsky/fetched/'.length);
 if(u.origin===location.origin){const base=new URL('.',location.href).pathname;if(u.pathname.startsWith(base)){const path=u.pathname.slice(base.length);if(manifest.assets[path] || manifest.groups[path] || openingAudio.assets[path])return path;}}
 return null;
}
async function validated(blob,info) {if(!(blob instanceof Blob)||blob.size!==info.bytes)return false;return await hash(await blob.arrayBuffer())===info.sha256;}
const legacyConnections=new Map();let legacyNames;
async function legacyBlob(path) {
 if(!indexedDB.databases)return null;
 legacyNames ||= indexedDB.databases().then(list=>new Set(list.map(db=>db.name)));
 const names=await legacyNames;
 for(const [name,store,key] of [['gameFilesDB','files',path.startsWith('audio/')?path.slice(6):path],['/vc-assets/fetched','FILE_DATA','/vc-assets/fetched/'+path]]){
  if(!names.has(name))continue;
  if(!legacyConnections.has(name))legacyConnections.set(name,new Promise((resolve,reject)=>{const req=indexedDB.open(name);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}));
  const db=await legacyConnections.get(name);if(!db.objectStoreNames.contains(store))continue;
  const entry=await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  if(entry){const blob=entry instanceof Blob?entry:new Blob([entry.contents || entry]);if(await validated(blob,manifest.assets[path]))return blob;}
 }
 return null;
}
async function cachedPart(path) {
 if(state.cacheDisabled)return null;
 const info=manifest.assets[path];
 try{
  const entry=await assetsDB.get('files',assetKey(path));
  if(entry && await validated(entry.blob,info)){stats.cachedBytes+=entry.blob.size;scheduleProgress();return entry.blob;}
  if(entry)await assetsDB.delete('files',assetKey(path));
  const legacy=await legacyBlob(path);if(legacy){stats.cachedBytes+=legacy.size;scheduleProgress();return legacy;}
 }catch(e){state.cacheDisabled=true;state.backgroundStopped=true;warn('Download cache is unavailable; the game can still run online.');}
 return null;
}
async function evictAssets(bytes=32*1048576) {
 const db=await assetsDB.open();
 return new Promise((resolve,reject)=>{let removed=0;const tx=db.transaction('files','readwrite');const request=tx.objectStore('files').openCursor();
 request.onsuccess=()=>{const c=request.result;if(c && removed<bytes){removed+=c.value.bytes || c.value.blob.size;c.delete();c.continue();}};
 tx.oncomplete=()=>resolve(removed);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function cachePart(path,blob,optional) {
 if(state.cacheDisabled || (optional && state.backgroundStopped))return;
 try{
  const usage=await navigator.storage?.estimate?.();
  if(usage?.quota && usage.quota-(usage.usage||0)<blob.size+32*1048576){state.backgroundStopped=true;await evictAssets(blob.size+32*1048576);}
  await assetsDB.put('files',assetKey(path),{blob,bytes:blob.size,hash:manifest.assets[path].sha256});
 }catch(e){state.backgroundStopped=true;state.cacheDisabled=true;warn('Download cache is full or unavailable. Background downloads stopped; saves are kept separately.');}
}
async function downloadPart(path,signal,options={},search='') {
 const info=manifest.assets[path];if(!info)throw new Error(`Unlisted asset: ${path}`);
 if(navigator.onLine===false)throw new Error(`Offline: ${path} has not been cached. Reconnect and retry; completed downloads are kept.`);
 const failures=[];
 const routes=[...(info.routes || manifest.routes)].sort((a,b)=>(a===state.preferred?-1:b===state.preferred?1:0));
 const healthy=routes.filter(h=>(state.failed.get(h)||0)<Date.now());
 const ordered=healthy.length ? [...healthy,...routes.filter(h=>!healthy.includes(h))] : routes;
 for(let i=0;i<ordered.length;i++){
  aborted(signal);const host=ordered[i];const controller=new AbortController();let timer;
  const cancel=()=>controller.abort(signal.reason);signal?.addEventListener('abort',cancel,{once:true});
  const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(new Error(`Transfer stalled on ${host}`)),ms);};
  try{
   arm(10000);stats.requests++;if(i)stats.fallbacks++;
   const response=await nativeFetch(urlFor(host,path,search),{...options,signal:controller.signal,credentials:'omit'});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   if(response.headers.get('content-type')?.includes('text/html'))throw new Error('Unexpected HTML response');
   const buffer=new Uint8Array(info.bytes);let received=0;arm(20000);
   if(response.body){const reader=response.body.getReader();try{while(true){const {done,value}=await reader.read();if(done)break;arm(20000);if(received+value.length>info.bytes)throw new Error('Asset exceeds expected length');buffer.set(value,received);received+=value.length;stats.networkBytes+=value.length;scheduleProgress();}}catch(e){await reader.cancel().catch(()=>{});throw e;}}
   else {const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length!==info.bytes)throw new Error('Asset length mismatch');buffer.set(bytes);received=bytes.length;stats.networkBytes+=bytes.length;}
   if(received!==info.bytes)throw new Error('Truncated asset');
   if(await hash(buffer)!==info.sha256)throw new Error('Asset integrity mismatch');
   state.preferred=host;state.failed.delete(host);return new Blob([buffer],{type:path.endsWith('.wasm')?'application/wasm':'application/octet-stream'});
  }catch(e){aborted(signal);failures.push(`${host}: ${e.message}`);state.failed.set(host,Date.now()+60000);}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
 }
 throw new Error(`Could not load ${path}. ${failures.join('; ')}`);
}
function loadPart(path,{priority=1,optional=false,signal,search='',requestOptions={}}={}) {
 promotePart(path,priority);
 const taskKey=path+JSON.stringify([search,requestOptions]);
 let task=state.inflight.get(taskKey);
 if(!task){
  const transfer={path,priority,optional,networkActive:false,controller:null};transferTasks.set(taskKey,transfer);
  task=transfers.run(async()=>{
   const cached=await cachedPart(path);if(cached)return cached;
   const previous=negativeDownloads.get(path);if(previous&&previous.until>Date.now())throw previous.error;
   while(true){
    await waitForBackground(transfer);
    transfer.controller=new AbortController();transfer.networkActive=true;
    if(!transfer.optional&&transfer.priority>=5){state.lastForegroundAt=performance.now();pauseOptionalTransfers();}
    try{
     const options={priority:transfer.optional?'low':transfer.priority>=5?'high':'auto',...requestOptions};
     const blob=await downloadPart(path,transfer.controller.signal,options,search);
     negativeDownloads.delete(path);await cachePart(path,blob,transfer.optional);return blob;
    }catch(error){
     if(error.name==='BackgroundPaused')continue;
     boundedSet(negativeDownloads,path,{until:Date.now()+60000,error});throw error;
    }finally{transfer.networkActive=false;}
   }
  },priority,path);
  state.inflight.set(taskKey,task);task.finally(()=>{state.inflight.delete(taskKey);transferTasks.delete(taskKey);}).catch(()=>{});
 }
 return awaitSignal(task,signal);
}
const embeddedTasks=new Map();
async function embeddedAudio(path){
 let task=embeddedTasks.get(path);
 if(!task){task=(async()=>{const info=openingAudio.assets[path]||streamedAudio.assets[path];if(openingAudio.gameBuild!==BUILD||streamedAudio.gameBuild!==BUILD)throw new Error('Opening audio build mismatch');const bytes=Uint8Array.from(atob(info.base64),c=>c.charCodeAt(0));const blob=new Blob([bytes],{type:info.mime});if(!await validated(blob,info))throw new Error(`Embedded audio integrity mismatch: ${path}`);stats.embeddedBytes+=blob.size;record('embedded-audio',path,info.generatedSilence?'Verified silent fallback':openingAudio.assets[path]?'Verified intro conversion':'Verified streamed MPEG repair');scheduleProgress();return blob;})();embeddedTasks.set(path,task);task.catch(()=>embeddedTasks.delete(path));}
 return task;
}
function stableGameplay(){return state.ready&&!state.assetBlocked&&document.body.dataset.stateMenu==='0'&&document.body.dataset.stateCutscene==='0'&&!document.hidden;}
async function waitForBackground(options){
 if(options.optional&&(state.backgroundStopped||state.assetBlocked))throw new Error('Optional downloads stopped');
 while(options.optional && (!stableGameplay()||!state.gameplaySince||performance.now()-state.gameplaySince<2000||foregroundBusy()||performance.now()-state.lastForegroundAt<2000)){
  if(state.backgroundStopped||state.assetBlocked)throw new Error('Optional downloads stopped');
  $('radio-status').textContent='Radio caching waits for quiet gameplay; scenery and requested files come first.';
  await new Promise(resolve=>setTimeout(resolve,250));
 }
}
function optionalAudio(path){
 // Incidental arrest voices, ordinary effects, and specific non-dialogue ambience.
 // Mission dialogue, cutscene animations, models and collision data remain required.
 return /^audio\/bust_\d{2}\.wav$/.test(path)||/^audio\/sfx\.raw\/\d+\.mp3$/.test(path)||['audio/city.mp3','audio/hcity.mp3','audio/hwater.mp3','audio/hotel.mp3','audio/mallamb.mp3','audio/ambsil.mp3'].includes(path);
}
async function optionalSoundFallback(path,error){
 if(!optionalAudio(path))throw error;
 if(!degradedAudio.has(path)){stats.optionalAudioFallbacks++;boundedSet(degradedAudio,path,{path,message:String(error.message||error).slice(0,300)});record('optional-audio-skipped',path,error.message);warn(`Sound unavailable: ${path}. Gameplay continues without it; reload to retry.`);}
 // MP3 silence is restricted to failed incidental effects/ambience by both guards.
 if(/^audio\/bust_\d{2}\.wav$/.test(path)||/^audio\/sfx\.raw\/\d+\.mp3$/.test(path)||['audio/city.mp3','audio/hcity.mp3','audio/hwater.mp3','audio/hotel.mp3','audio/mallamb.mp3','audio/ambsil.mp3'].includes(path))return embeddedAudio('audio/water.mp3');
 throw error; // Guarded paths above exhaust the optional-audio whitelist.
}
async function loadFile(path,options={}) {
 try{
  if(openingAudio.assets[path]||streamedAudio.assets[path])return await awaitSignal(embeddedAudio(path),options.signal);
  const parts=manifest.groups[path],info=manifest.assets[path];
  if(!parts){
   if(!info)throw new Error(`Unlisted asset: ${path}`);
   const raw=await loadPart(path,options);

   return raw;
  }
  if(path==='index.data')return new Blob(await Promise.all(parts.map(p=>loadPart(p,options))));
  const blobs=[];for(const p of parts){await waitForBackground(options);blobs.push(await loadPart(p,options));}return new Blob(blobs);
 }catch(error){if(options.signal?.aborted||error.name==='AbortError')throw error;return optionalSoundFallback(path,error);}
}
const urlTasks=new Map(),urlTaskOptions=new Map();
async function fileURL(path,options={}) {
 if(state.urls.has(path))return state.urls.get(path);
 let task=urlTasks.get(path);
 const pendingOptions=urlTaskOptions.get(path);if(pendingOptions&&(options.priority||0)>(pendingOptions.priority||0)){pendingOptions.priority=options.priority;pendingOptions.optional=false;for(const part of manifest.groups[path]||[path])promotePart(part,options.priority);}
 if(!task){const shared={...options};delete shared.signal;urlTaskOptions.set(path,shared);task=loadFile(path,shared).then(blob=>{const url=URL.createObjectURL(blob);state.urls.set(path,url);return url;}).finally(()=>{urlTasks.delete(path);urlTaskOptions.delete(path);});urlTasks.set(path,task);}
 return awaitSignal(task,options.signal);
}
/* Only the pinned engine's fetchXHR boundary uses this bridge. Native XHR
 * remains responsible for successful Blob delivery. Failures never issue an
 * invalid network request: terminal properties are populated before callbacks. */
class AssetXHR {
 constructor(){this.listeners=new EventTarget();this.headers=[];this.finished=false;this.sent=false;this.virtual=null;this.generation=0;this.createNative();}
 createNative(){const xhr=this.xhr=new NativeXHR();
  for(const type of ['load','error','abort','timeout','progress','readystatechange','loadstart','loadend'])xhr.addEventListener(type,e=>{if(this.xhr===xhr&&!this.virtual)this.emit(type,e);});}
 emit(type,event){
  if(['load','error','abort','timeout'].includes(type)){this.finished=true;clearTimeout(this.waitTimer);if(this.requestId){pendingRequests.delete(this.requestId);record('request-'+type,this.path,String(this.status));}}
  // EventTarget continues dispatch when one listener throws, as native XHR does.
  try{this[`on${type}`]?.call(this,event);}catch(error){queueMicrotask(()=>{throw error;});}
  const forwarded=event instanceof ProgressEvent?new ProgressEvent(type,{loaded:event.loaded,total:event.total,lengthComputable:event.lengthComputable}):new Event(type);
  this.listeners.dispatchEvent(forwarded);
 }
 open(method,url,async=true,user,password){
  this.generation++;this.pending?.abort();clearTimeout(this.waitTimer);if(this.requestId)pendingRequests.delete(this.requestId);
  const previous=this.xhr,preferences={responseType:previous.responseType,timeout:previous.timeout,withCredentials:previous.withCredentials};this.createNative();previous.abort();
  this.finished=false;this.sent=false;this.virtual=null;this.cancelled=false;this.recovering=false;this.headers=[];this.mime=null;
  this.method=method;this.url=String(url);this.async=async!==false;this.user=user;this.password=password;this.path=logicalPath(url);this.search=new URL(String(url),location.href).search;
  this.xhr.open(method,url,async,user,password);for(const [key,value] of Object.entries(preferences))if(this.xhr[key]!==value)this.xhr[key]=value;
 }
 setRequestHeader(k,v){this.headers.push([k,v]);this.xhr.setRequestHeader(k,v);}
 overrideMimeType(value){this.mime=value;this.xhr.overrideMimeType(value);}
 getAllResponseHeaders(){return this.virtual?'':this.xhr.getAllResponseHeaders();}
 getResponseHeader(name){return this.virtual?null:this.xhr.getResponseHeader(name);}
 addEventListener(...args){this.listeners.addEventListener(...args);}
 removeEventListener(...args){this.listeners.removeEventListener(...args);}
 finish(kind='error'){
  if(this.finished)return;
  this.finished=true;clearTimeout(this.waitTimer);this.pending?.abort();
  const generation=this.generation;
  this.virtual={readyState:4,status:0,statusText:'',response:null,responseText:'',responseXML:null,responseURL:''};
  this.xhr.abort();if(this.requestId)pendingRequests.delete(this.requestId);
  const dispatch=()=>{for(const type of ['readystatechange',kind,'loadend']){if(generation!==this.generation)return;this.emit(type,type==='readystatechange'?new Event(type):new ProgressEvent(type));}if(kind==='abort')this.virtual.readyState=0;};
  if(this.async){if(kind==='error'&&(assetFailures.get(this.path)?.attempts||0)>1)setTimeout(dispatch,250);else queueMicrotask(dispatch);}else dispatch();
 }
 abort(){this.cancelled=true;if(this.sent&&!this.finished)this.finish('abort');else this.xhr.abort();}
 send(body){
  if(!this.path||this.method.toUpperCase()!=='GET'||this.user||this.password||this.withCredentials||this.headers.some(([name])=>/^(authorization|range)$/i.test(name)))return this.xhr.send(body);
  if(this.sent)throw new DOMException('Request already sent','InvalidStateError');this.sent=true;
  this.requestId=++requestSequence;pendingRequests.set(this.requestId,{path:this.path,startedAt:Math.round(performance.now())});
  if(!manifest.assets[this.path]&&!manifest.groups[this.path]&&!openingAudio.assets[this.path]&&!optionalAudio(this.path)){recordAssetFailure(this.path,new Error('Asset is not indexed; no verified copy is available.'),'unindexed');this.finish();return;}
  if(!this.async){stats.syncRequests++;const ready=state.urls.get(this.path);if(!ready){recordAssetFailure(this.path,new Error('Synchronous asset not prepared'));this.finish();return;}this.sendPrepared(ready,body);return;}
  const generation=this.generation;this.pending=new AbortController();const options={signal:this.pending.signal,priority:10,search:this.search,requestOptions:{headers:this.headers}};
  this.waitTimer=this.timeout?setTimeout(()=>{const error=new Error('Engine request timed out');if(optionalAudio(this.path)){this.recovering=true;this.pending.abort();optionalSoundFallback(this.path,error).then(blob=>{if(generation!==this.generation||this.finished||this.cancelled)return;const url=URL.createObjectURL(blob);state.urls.set(this.path,url);this.sendPrepared(url,body);}).catch(()=>this.finish('timeout'));}else{recordAssetFailure(this.path,error);this.finish('timeout');}},this.timeout):null;
  fileURL(this.path,options).then(url=>{
   if(generation!==this.generation||this.finished||this.cancelled||this.recovering)return;this.sendPrepared(url,body);
  }).catch(error=>{if(generation===this.generation&&!this.finished&&!this.cancelled&&!this.recovering){recordAssetFailure(this.path,error);this.finish();}});
 }
 sendPrepared(url,body){
  const responseType=this.responseType,credentials=this.withCredentials;
  this.xhr.open(this.method,url,this.async,this.user,this.password);
  if(this.xhr.responseType!==responseType)this.xhr.responseType=responseType;this.xhr.withCredentials=credentials;
  if(this.mime)this.xhr.overrideMimeType(this.mime);for(const [k,v] of this.headers)this.xhr.setRequestHeader(k,v);this.xhr.send(body);
 }
}
for(const prop of ['response','responseText','responseXML','responseURL','readyState','status','statusText','upload'])Object.defineProperty(AssetXHR.prototype,prop,{get(){return this.virtual&&prop in this.virtual?this.virtual[prop]:this.xhr[prop];}});
for(const prop of ['responseType','timeout','withCredentials'])Object.defineProperty(AssetXHR.prototype,prop,{get(){return this.xhr[prop];},set(value){this.xhr[prop]=value;}});
async function loadScript(path,transform) {
 let source=await (await loadPart(path,{priority:5})).text();if(transform)source=transform(source);
 const url=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));
 try{await new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.onload=resolve;el.onerror=()=>reject(new Error(`Script failed: ${path}`));document.body.appendChild(el);});}finally{URL.revokeObjectURL(url);}
}
// IDBFS uses the mount path as its database name. Match its existing schema.
let saveConnection;
function openSaveDB() {
 if(!saveConnection)saveConnection=new Promise((resolve,reject)=>{
  const req=indexedDB.open(SAVE_ROOT,21);
  req.onupgradeneeded=()=>{const store=req.result.objectStoreNames.contains('FILE_DATA')?req.transaction.objectStore('FILE_DATA'):req.result.createObjectStore('FILE_DATA');if(!store.indexNames.contains('timestamp'))store.createIndex('timestamp','timestamp',{unique:false});};
  req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();saveConnection=null;};resolve(req.result);};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Close other game tabs before managing saves.'));
 }).catch(e=>{saveConnection=null;throw e;});return saveConnection;
}
function safeSavePath(path) {
 if(typeof path!=='string'||!path.startsWith(SAVE_ROOT+'/'))return false;
 const tail=path.slice(SAVE_ROOT.length+1);return tail.length>0&&tail.length<256&&tail.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!/[\x00-\x1f\\]/.test(p));
}
async function readSaves() {
 const db=await openSaveDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction('FILE_DATA','readonly');const entries=[];const r=tx.objectStore('FILE_DATA').openCursor();
  r.onsuccess=()=>{const c=r.result;if(c){if(safeSavePath(c.key))entries.push({path:c.key,...c.value});c.continue();}};
  tx.oncomplete=()=>resolve(entries);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function replaceSaves(entries) {
 const db=await openSaveDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction('FILE_DATA','readwrite');const store=tx.objectStore('FILE_DATA');
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  try{store.clear();for(const entry of entries){const {path,...data}=entry;store.put(data,path);}}
  catch(error){tx.abort();reject(error);}
 });
}
function base64(bytes) {let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);}
function unbase64(value){if(typeof value!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('Invalid backup encoding');return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
function readMemorySaves(FS,path=SAVE_ROOT){
 const entries=[];for(const name of FS.readdir(path)){if(name==='.'||name==='..')continue;const child=path+'/'+name;const stat=FS.stat(child);const directory=(stat.mode&0xf000)===0x4000;entries.push({path:child,timestamp:stat.mtime,mode:stat.mode,...(directory?{}:{contents:FS.readFile(child)})});if(directory)entries.push(...readMemorySaves(FS,child));}return entries;
}
async function snapshot(persistedOnly=false) {
 const FS=window.Module?.FS;const entries=(!persistedOnly&&FS&&(state.savesRestored||state.savesRestoreFailed))?readMemorySaves(FS):await readSaves();
 return {format:'gta-vc-local-backup',version:1,build:BUILD,createdAt:new Date().toISOString(),config:setting(CONFIG_KEY,''),preset:settings.preset,entries:entries.sort((a,b)=>a.path.localeCompare(b.path)).map(e=>({path:e.path,timestamp:new Date(e.timestamp).toISOString(),mode:e.mode,contents:e.contents?base64(new Uint8Array(e.contents)):null}))};
}
function validateBackup(value) {
 if(!value||value.format!=='gta-vc-local-backup'||value.version!==1||value.build!==BUILD)throw new Error('Unsupported backup format or game build');
 if(typeof value.config!=='string'||value.config.length>65536||!['saved','performance','balanced','original'].includes(value.preset))throw new Error('Invalid backup settings');
 if(!Array.isArray(value.entries)||value.entries.length>256)throw new Error('Invalid backup file list');
 const paths=new Set();let total=0;
 const entries=value.entries.map(e=>{
  if(!e||!safeSavePath(e.path)||paths.has(e.path))throw new Error('Invalid or duplicate save path');paths.add(e.path);
  if(!Number.isInteger(e.mode)||![0x4000,0x8000].includes(e.mode&0xf000)||e.mode<0||e.mode>65535)throw new Error('Invalid save file mode');
  const timestamp=new Date(e.timestamp);if(typeof e.timestamp!=='string'||!Number.isFinite(timestamp.getTime()))throw new Error('Invalid save timestamp');
  const directory=(e.mode&0xf000)===0x4000;
  if(!directory&&e.contents===null)throw new Error('Save file is missing its contents');
  const contents=e.contents===null?undefined:unbase64(e.contents);total+=contents?.byteLength||0;
  if(total>16*1048576||((e.mode&0xf000)===0x4000 && contents))throw new Error('Invalid or oversized save data');
  return {path:e.path,timestamp,mode:e.mode,...(contents?{contents}: {})};
 });
 for(const entry of entries){const parent=entry.path.slice(0,entry.path.lastIndexOf('/'));if(parent!==SAVE_ROOT&&!entries.some(e=>e.path===parent&&(e.mode&0xf000)===0x4000))throw new Error('Save directory is missing from backup');}
 return {entries,config:value.config,preset:value.preset};
}
let saveQueue=Promise.resolve(),saveMount=null,saveInstance=null,flushTimer=null,dirty=false,dirtyEpoch=0;
function saveStatus(text,error=false){$('save-status').textContent=text;$('save-status').classList.toggle('error',error);$('save-status').hidden=false;}
window.syncfs=(instance,mount,populate,callback,original)=>{
 // Streamed files are already versioned and verified in assetsDB. Keep this
 // engine mount in memory instead of restoring its unversioned legacy cache.
 if(mount.mountpoint==='/vc-assets/fetched')return queueMicrotask(()=>callback(null));
 if(mount.mountpoint!==SAVE_ROOT)return original(callback);
 saveMount=mount;saveInstance=instance;
 const epoch=dirtyEpoch;
 const job=async()=>{
  saveStatus(populate?'Restoring local saves…':'Saving…');
  try{
   await new Promise((resolve,reject)=>original(err=>err?reject(err):resolve()));
   if(!populate){if(epoch===dirtyEpoch)dirty=false;saveStatus('Saved locally');}
   else {saveStatus('Local saves ready');state.savesRestored=true;if(state.runtimeInitialized)runtimeReady();}
   callback(null);
  }catch(e){saveStatus(`Save storage failed: ${e.message || e}. Export before leaving.`,true);if(populate){state.savesRestoreFailed=true;warn('Local save storage is unavailable. Export progress before leaving.');if(state.runtimeInitialized)runtimeReady();}callback(e);}
 };
 saveQueue=saveQueue.then(job,job);
};
function markDirty(){dirty=true;dirtyEpoch++;clearTimeout(flushTimer);flushTimer=setTimeout(()=>flushSaves().catch(e=>saveStatus(e.message,true)),500);}
async function flushSaves(){
 if(!saveMount||!dirty)return saveQueue;
 if(window.Module?.FS.syncFSRequests>0){clearTimeout(flushTimer);flushTimer=setTimeout(()=>flushSaves().catch(console.error),100);return saveQueue;}
 return new Promise((resolve,reject)=>saveInstance.syncfs(saveMount,false,err=>err?reject(err):resolve()));
}
function observeSaveWrites(FS) {
 const close=FS.close;FS.close=function(stream){const path=stream?.path;const written=stream?.node?.vcDirty;const result=close.apply(this,arguments);if(written&&safeSavePath(path)){stream.node.vcDirty=false;markDirty();}return result;};
 const write=FS.write;FS.write=function(stream){const result=write.apply(this,arguments);if(result>0&&safeSavePath(stream?.path))stream.node.vcDirty=true;return result;};
 for(const name of ['unlink','rename','rmdir']){const fn=FS[name];FS[name]=function(path,...args){const result=fn.call(this,path,...args);if(safeSavePath(path)||safeSavePath(args[0]))markDirty();return result;};}
}
async function importBackup(data){
 if(state.started)throw new Error('Restart the page before importing saves.');
 const validated=validateBackup(data);await replaceSaves(validated.entries);
 putSetting(CONFIG_KEY,validated.config);settings.preset=validated.preset;putSetting('vc-port.preset',settings.preset);updatePreset();
 saveStatus('Backup restored');say('Save backup restored. Press Play to load it.');
}
async function exportBackup(){
 try{await flushSaves();}catch{warn('Local storage failed. This export uses the game’s in-memory saved slots.');}const data=await snapshot();const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`Vice-City-saves-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const presets={performance:{Width:800,Height:600,DrawDistance:'1.000000',PedDensity:'0.700000',CarDensity:'0.700000',Trails:0},balanced:{Width:1280,Height:720,DrawDistance:'1.200000',PedDensity:'1.000000',CarDensity:'1.000000',Trails:0},original:{Width:800,Height:600,DrawDistance:'1.800000',PedDensity:'1.200000',CarDensity:'1.200000',Trails:1}};
function applyPreset(config,preset){
 if(!presets[preset])return config;
 const sections={Width:'VideoMode',Height:'VideoMode',DrawDistance:'Display',PedDensity:'Display',CarDensity:'Display',Trails:'Graphics'};
 let lines=config.split(/\r?\n/);
 for(const [key,value] of Object.entries(presets[preset])){
  const section=sections[key];let start=lines.findIndex(x=>x.trim()===`[${section}]`);
  if(start<0){lines.push(`[${section}]`,`${key}=${value}`);continue;}
  let end=lines.findIndex((x,i)=>i>start&&/^\[/.test(x.trim()));if(end<0)end=lines.length;
  const match=lines.findIndex((x,i)=>i>start&&i<end&&x.startsWith(`${key}=`));if(match>=0)lines[match]=`${key}=${value}`;else lines.splice(end,0,`${key}=${value}`);
 }return lines.join('\n');
}

const DEFAULT_INI = "\n[VideoMode]\nWidth=800\nHeight=600\nDepth=32\nSubsystem=0\nWindowed=0\n[Controller]\nHeadBob1stPerson=0\nHorizantalMouseSens=0.002500\nInvertMouseVertically=1\nDisableMouseSteering=1\nVibration=0\nMethod=0\nInvertPad=0\nJoystickName=\nPadButtonsInited=0\n[Audio]\nSfxVolume=36\nMusicVolume=37\nMP3BoostVolume=0\nRadio=0\nSpeakerType=0\nProvider=0\nDynamicAcoustics=1\n[Display]\nBrightness=256\nDrawDistance=1.800000\nSubtitles=0\nShowHud=1\nRadarMode=0\nShowLegends=0\nPedDensity=1.200000\nCarDensity=1.200000\nCutsceneBorders=1\nFreeCam=0\n[Graphics]\nAspectRatio=0\nVSync=1\nTrails=1\nFrameLimiter=0\nMultiSampling=0\nIslandLoading=0\nPS2AlphaTest=1\nColourFilter=2\nMotionBlur=0\nVehiclePipeline=0\nNeoRimLight=0\nNeoLightMaps=0\nNeoRoadGloss=0\n[General]\nSkinFile=$$\"\"\nLanguage=0\nDrawVersionText=0\nNoMovies=0\n[CustomPipesValues]\nPostFXIntensity=1.000000\nNeoVehicleShininess=1.000000\nNeoVehicleSpecularity=1.000000\nRimlightMult=1.000000\nLightmapMult=1.000000\nGlossMult=1.000000\n[Rendering]\nBackfaceCulling=1\nNewRenderer=1\n[Draw]\nProperScaling=1\nFixRadar=1\nFixSprites=1\n[Bindings]\nPED_FIREWEAPON=mouse:LEFT,2ndKbd:PAD5\nPED_CYCLE_WEAPON_RIGHT=2ndKbd:PADENTER,mouse:WHLDOWN,kbd:E\nPED_CYCLE_WEAPON_LEFT=kbd:PADDEL,mouse:WHLUP,2ndKbd:Q\nGO_FORWARD=kbd:UP,2ndKbd:W\nGO_BACK=kbd:DOWN,2ndKbd:S\nGO_LEFT=2ndKbd:A,kbd:LEFT\nGO_RIGHT=kbd:RIGHT,2ndKbd:D\nPED_SNIPER_ZOOM_IN=kbd:PGUP,2ndKbd:Z,mouse:WHLUP\nPED_SNIPER_ZOOM_OUT=kbd:PGDN,2ndKbd:X,mouse:WHLDOWN\nVEHICLE_ENTER_EXIT=kbd:ENTER,2ndKbd:F\nCAMERA_CHANGE_VIEW_ALL_SITUATIONS=kbd:HOME,2ndKbd:V\nPED_JUMPING=kbd:RCTRL,2ndKbd:SPC\nPED_SPRINT=2ndKbd:LSHIFT,kbd:RSHIFT\nPED_LOOKBEHIND=2ndKbd:CAPSLK,mouse:MIDDLE,kbd:PADINS\nPED_DUCK=kbd:C\nPED_ANSWER_PHONE=kbd:TAB\nVEHICLE_FIREWEAPON=kbd:PADINS,2ndKbd:LCTRL,mouse:LEFT\nVEHICLE_ACCELERATE=2ndKbd:W\nVEHICLE_BRAKE=2ndKbd:S\nVEHICLE_CHANGE_RADIO_STATION=kbd:INS,2ndKbd:R\nVEHICLE_HORN=2ndKbd:LSHIFT,kbd:RSHIFT\nTOGGLE_SUBMISSIONS=kbd:PLUS,2ndKbd:CAPSLK\nVEHICLE_HANDBRAKE=kbd:RCTRL,2ndKbd:SPC,mouse:RIGHT\nPED_1RST_PERSON_LOOK_LEFT=kbd:PADLEFT\nPED_1RST_PERSON_LOOK_RIGHT=kbd:PADHOME\nVEHICLE_LOOKLEFT=kbd:PADEND,2ndKbd:Q\nVEHICLE_LOOKRIGHT=kbd:PADDOWN,2ndKbd:E\nVEHICLE_LOOKBEHIND=mouse:MIDDLE\nVEHICLE_TURRETLEFT=kbd:PADLEFT\nVEHICLE_TURRETRIGHT=kbd:PAD5\nVEHICLE_TURRETUP=kbd:PADPGUP,2ndKbd:UP\nVEHICLE_TURRETDOWN=kbd:PADRIGHT,2ndKbd:DOWN\nPED_CYCLE_TARGET_LEFT=kbd:[,2ndKbd:PADEND\nPED_CYCLE_TARGET_RIGHT=2ndKbd:],kbd:PADDOWN\nPED_CENTER_CAMERA_BEHIND_PLAYER=kbd:#\nPED_LOCK_TARGET=kbd:DEL,mouse:RIGHT,2ndKbd:PADRIGHT\nNETWORK_TALK=kbd:T\nPED_1RST_PERSON_LOOK_UP=kbd:PADPGUP\nPED_1RST_PERSON_LOOK_DOWN=kbd:PADUP\n_CONTROLLERACTION_36=\nTOGGLE_DPAD=\nSWITCH_DEBUG_CAM_ON=\nTAKE_SCREEN_SHOT=\nSHOW_MOUSE_POINTER_TOGGLE=\nUNKNOWN_ACTION=\n\n";
let radioTask=null;
async function backgroundRadios(){
 if(radioTask)return radioTask;
 radioTask=preloadRadios().finally(()=>{radioTask=null;});return radioTask;
}
async function preloadRadios(){
 const radios=Object.keys(manifest.groups).filter(p=>p!=='index.data');
 let done=0;
 for(const path of radios){
  if(state.backgroundStopped||state.assetBlocked)break;
  try{$('radio-status').textContent=`Caching radio ${done+1}/${radios.length}: ${path.split('/').pop()}`;await fileURL(path,{priority:0,optional:true});done++;}
  catch(e){$('radio-status').textContent='Radio preloading paused. Retry downloads in Settings.';record('radio-paused',path,e.message);return;}
 }
 $('radio-status').textContent=state.assetBlocked?'Radio caching paused while game loading needs recovery.':state.backgroundStopped?'Background downloads paused to protect storage.':`All ${done} radio stations cached`;
}
function runtimeReady(){
 state.runtimeInitialized=true;
 if(!state.savesRestored&&!state.savesRestoreFailed){state.stage='Restoring saved slots…';progress();return;}
 if(state.ready)return;state.ready=true;$('canvas').focus({preventScroll:true});stats.readyAt=performance.now();state.stage='Playing';say(state.savesRestoreFailed?'Save storage is unavailable. Export progress before leaving.':'');progress();
 $('launch-panel').hidden=true;setSettings(false);document.body.classList.add('gameIsStarted');$('canvas').focus({preventScroll:true});
 $('import').disabled=true;$('clear-cache').disabled=true;$('save-status').hidden=false;
 state.gameplaySince=stableGameplay()?performance.now():0;
 backgroundRadios();
}
function configureModule(data,wasm,preset=settings.preset){
 const cachedConfig=setting(CONFIG_KEY,'');let defaults=DEFAULT_INI;if(!cachedConfig&&document.body.dataset.isTouch==='1')defaults=defaults.replace('Method=0','Method=1');
 let config=applyPreset(cachedConfig || defaults,preset);
 const Module={
  preRun:[],postRun:[],canvas:$('canvas'),arguments:[],
  preMainLoop(){frameHeartbeat=Math.round(performance.now());frameCount++;},
  getPreloadedPackage:()=>data,
  locateFile:path=>urlFor(state.preferred||manifest.routes[0],path),
  print:(...args)=>nativeLog(false,...args),printErr:(...args)=>nativeLog(true,...args),log:(...args)=>nativeLog(false,...args),
  mainCalled(){try{Module.FS.writeFile('/vc-assets/local/revc.ini',new TextEncoder().encode(config));}catch(e){console.error('Configuration:',e);}runtimeReady();},
  syncRevcIni(){try{config=Module.FS.readFile('/vc-assets/local/revc.ini',{encoding:'utf8'});putSetting(CONFIG_KEY,config);}catch(e){warn('Game settings could not be saved.');}},
  hotelMission(){},
  setStatus:text=>{if(!state.ready){state.stage=text||'Starting game…';progress();}},
  monitorRunDependencies:count=>{if(!state.ready){state.stage=count?`Preparing runtime (${count} dependencies)…`:'Starting game…';scheduleProgress();}},
  onRuntimeInitialized(){observeSaveWrites(Module.FS);if(window.Fetch)window.Fetch.dbInstance=false;},
  onAbort:reason=>showFailure(new Error(String(reason))),
  instantiateWasm(imports,receive){
   (async()=>{let result;try{result=await WebAssembly.instantiateStreaming(Promise.resolve(new Response(wasm.stream(),{headers:{'Content-Type':'application/wasm'}})),imports);}catch(e){if(!(e instanceof TypeError))throw e;result=await WebAssembly.instantiate(await wasm.arrayBuffer(),imports);}receive(result.instance,result.module);})().catch(showFailure);return {};
  }
 };
 window.Module=Module;
 return Module;
}
function patchRuntime(source){
 const start=source.indexOf('function fetchXHR('),end=source.indexOf('function fetchCacheData',start);
 if(start<0||end<start)throw new Error('Pinned runtime network boundary changed');
 const section=source.slice(start,end),marker='var xhr = new XMLHttpRequest();';
 if(section.split(marker).length!==2)throw new Error('Pinned runtime XHR boundary changed');
 const titleMarker='(document.title = UTF8ToString(title));';if(source.split(titleMarker).length!==2)throw new Error('Pinned runtime title boundary changed');
 let patched=(source.slice(0,start)+section.replace(marker,'var xhr = new window.ViceCity.AssetXHR();')+source.slice(end)).replace(titleMarker,'(document.title = \"GTA: Vice City\");');
 // Only the pinned engine's callbacks are adapted. Native page events and
 // the browser's pointer-lock bookkeeping remain intact.
 for(const [marker,insertion] of [
  ['var focusEventHandlerFunc = (e) => {','\n    if (eventTypeString === "blur" && window.ViceCity.handleRuntimeBlur()) return;'],
  ['var visibilityChangeEventHandlerFunc = (e) => {','\n    if (window.ViceCity.ignoreRuntimeVisibility()) return;']
 ]){
  if(patched.split(marker).length!==2)throw new Error('Pinned runtime focus boundary changed');
  patched=patched.replace(marker,marker+insertion);
 }
 const timeoutMarker='xhr.ontimeout = (e) => {\n    if (!Fetch.xhrs.has(id)) {\n      return;\n    }';
 if(patched.split(timeoutMarker).length!==2)throw new Error('Pinned runtime timeout boundary changed');
 patched=patched.replace(timeoutMarker,timeoutMarker+'\n    saveResponseAndStatus();');
 return patched;
}
let booted=false;
function showFailure(error){console.error(error);state.ready=false;document.body.classList.remove('gameIsStarted');state.stage=state.assetBlocked?'Game paused — missing dependency':'Unable to start';say(error.message||String(error),true);$('launch-panel').hidden=false;$('play').hidden=true;$('retry').hidden=false;$('retry').textContent=booted?'Reload and retry':'Retry loading';$('diagnostics').hidden=false;$('loading').hidden=true;if(!booted){$('import').disabled=false;$('clear-cache').disabled=false;}progress();}
async function play(){
 if(state.started)return;const launchPreset=settings.preset;offerPersistence();setSettings(false);state.started=true;stats.startedAt=performance.now();$('play').disabled=true;$('play').hidden=true;$('loading').hidden=false;$('retry').hidden=true;$('diagnostics').hidden=true;$('import').disabled=true;$('clear-cache').disabled=true;say('');state.stage='Checking cache and downloading core files…';progress();
 // Request while the Play click still supplies browser user activation.
 // Denied/unsupported fullscreen leaves the game filling the page viewport.
 if(!document.fullscreenElement&&document.fullscreenEnabled){try{document.documentElement.requestFullscreen()?.catch(()=>{});}catch{}}
 try{
  if(!window.isSecureContext||!crypto.subtle)throw new Error('This browser denies verified downloads for this local file. In this folder run: python3 -m http.server 8000, then open http://localhost:8000/GTA_Vice_City.html. Export existing saves before switching origins; their database is kept intact.');
  if(!window.WebAssembly)throw new Error('This browser does not support WebAssembly.');
  if(!document.createElement('canvas').getContext('webgl2'))throw new Error('WebGL 2 is unavailable. Enable hardware acceleration or use a supported browser.');
  // Firefox may leave a permission prompt pending. Persistence must not gate play.
  updateStorage();
  await loadStyle();
  const [core,wasm]=await Promise.all([loadFile('index.data',{priority:5}),loadPart('index.wasm',{priority:5})]);
  const data=await core.arrayBuffer();
  state.stage='Preparing opening audio and cutscene files…';progress();
  await Promise.all([...Object.keys(openingAudio.assets),'audio/int_a.mp3','audio/int_b.mp3','audio/int_d.mp3','audio/int_m.mp3','audio/city.mp3','anim/cuts.img/int_b.ifp','anim/cuts.img/int_b.dat'].map(path=>fileURL(path,{priority:5})));
  await loadScript('GamepadEmulator.js');
  configureModule(data,wasm,launchPreset);booted=true;
  setupTouchControls();
  await loadScript('index.js',patchRuntime);
 }catch(e){if(!booted)state.started=false;showFailure(e);$('play').disabled=false;}
}
let styleLoaded=false;
async function loadStyle(){
 if(styleLoaded)return;
 const text=await (await loadPart('style.css',{priority:5})).text();
 const image=await fileURL('wasted.png',{priority:5});
 const el=document.createElement('style');el.id='game-style';el.textContent=text.replaceAll('url(wasted.png)',`url("${image}")`).replaceAll('url("wasted.png")',`url("${image}")`).replaceAll("url('wasted.png')",`url("${image}")`);document.head.insertBefore(el,$('launcher-style'));styleLoaded=true;
}
async function updateStorage(){
 try{
  const estimate=await navigator.storage?.estimate?.(),persistent=await navigator.storage?.persisted?.();
  state.persistent=!!persistent;$('request-persistence').hidden=!!persistent;
  $('storage-status').textContent=persistent?'Persistent storage granted':'Browser-managed storage';
  const quota=estimate?.quota,usage=estimate?.usage||0;
  $('storage-usage').hidden=!(quota>0);
  if(quota>0){const percent=Math.min(100,Math.max(0,usage/quota*100));$('storage-percent').textContent=percent.toFixed(1)+'%';$('storage-amount').textContent=`${formatBytes(usage)} used / ${formatBytes(quota)} quota`;$('storage-meter').value=percent;}
 }catch{$('storage-status').textContent='Storage status unavailable';$('storage-usage').hidden=true;}
 positionSettings();
}
async function action(work){try{await work();}catch(e){say(e.message||String(e),true);}}
$('play').addEventListener('click',play);
$('retry').addEventListener('click',()=>{retryDownloads();if(booted)location.reload();else play();});
$('diagnostics').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(captureDiagnostics(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='Vice-City-diagnostics.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function setSettings(open){
 if(open){releaseInputs();if(document.pointerLockElement)document.exitPointerLock();}
 $('settings-panel').hidden=!open;$('settings').setAttribute('aria-expanded',String(open));
 if(open){positionSettings();$('close-settings').focus();}else $('settings').focus({preventScroll:true});
}
function positionSettings(){
 if($('settings-panel').hidden)return;
 const panel=$('settings-panel'),bounds=panel.getBoundingClientRect(),anchor=$('settings').getBoundingClientRect(),group=$('settings').closest('.launch-actions').getBoundingClientRect();
 let left=(innerWidth-bounds.width)/2,top=anchor.bottom+12;
 if(group.right+16+bounds.width<=innerWidth-16){left=group.right+16;top=anchor.top;}
 else if(group.left-16-bounds.width>=16){left=group.left-16-bounds.width;top=anchor.top;}
 panel.style.left=left+'px';panel.style.top=Math.max(12,Math.min(top,innerHeight-bounds.height-16))+'px';
}
window.addEventListener('resize',positionSettings);
for(const detail of $('settings-panel').querySelectorAll('details'))detail.addEventListener('toggle',positionSettings);
$('settings').addEventListener('click',()=>setSettings($('settings-panel').hidden));
$('close-settings').addEventListener('click',()=>setSettings(false));
document.addEventListener('pointerdown',e=>{if(!$('settings-panel').hidden&&!e.target.closest('#settings-panel, #settings'))setSettings(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('settings-panel').hidden){e.preventDefault();e.stopImmediatePropagation();setSettings(false);}},true);
$('fullscreen').addEventListener('click',()=>action(async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}));
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';});
function updatePreset(){
 for(const button of $('preset').querySelectorAll('[data-preset]'))button.setAttribute('aria-pressed',String(button.dataset.preset===settings.preset));
 $('preset-label').textContent=presets[settings.preset]?settings.preset[0].toUpperCase()+settings.preset.slice(1):'';
}
$('preset').addEventListener('click',e=>{const button=e.target.closest('[data-preset]');if(!button)return;settings.preset=button.dataset.preset;putSetting('vc-port.preset',settings.preset);updatePreset();$('preset-status').hidden=false;positionSettings();});
$('export').addEventListener('click',()=>action(exportBackup));
$('import').addEventListener('click',()=>$('backup-file').click());
$('backup-file').addEventListener('change',()=>action(async()=>{try{const file=$('backup-file').files[0];if(!file)return;if(file.size>24*1048576)throw new Error('Backup is too large');const data=JSON.parse(await file.text());validateBackup(data);if(confirm('Replace local saved slots with this backup? Export your current saves first if you want to keep them.'))await importBackup(data);}finally{$('backup-file').value='';}}));
$('clear-cache').addEventListener('click',()=>action(async()=>{if(state.started)throw new Error('Reload the page before clearing downloads.');await assetsDB.run('files','readwrite',s=>s.clear());retryDownloads();state.cacheDisabled=false;state.backgroundStopped=false;say('Downloaded assets cleared. Saves and settings preserved.');await updateStorage();}));
$('retry-radio').addEventListener('click',()=>{retryDownloads();state.backgroundStopped=false;if(state.ready)backgroundRadios();else $('radio-status').textContent='Radio downloads start after launch.';});
function updateConnectivity(){const online=navigator.onLine;$('connectivity').textContent=online?'Online':'Offline';$('connectivity').classList.toggle('offline',!online);}
window.addEventListener('offline',updateConnectivity);
window.addEventListener('online',()=>{updateConnectivity();retryDownloads();if(state.ready&&!state.cacheDisabled){state.backgroundStopped=false;backgroundRadios();}});
$('release-version').textContent='v'+release.version;
if(release.repositoryURL){$('repository').href=release.repositoryURL;$('repository').hidden=false;}
async function requestPersistence(){
 $('persistence-prompt').hidden=true;if(state.ready)$('canvas').focus({preventScroll:true});putSetting('vc-port.persistence-prompt','seen');
 try{
  if(!navigator.storage?.persist){$('storage-status').textContent='Persistent storage is not supported. Export saves before moving or clearing this site.';return false;}
  const granted=await navigator.storage.persist();state.persistent=!!granted;await updateStorage();
  if(!granted)$('storage-status').textContent+=' · Permission was not granted; export saves to keep a portable copy.';
  return !!granted;
 }catch{$('storage-status').textContent='Storage permission failed. Export saves to keep a portable copy.';return false;}
}
function offerPersistence(){
 if(state.persistent||setting('vc-port.persistence-prompt')==='seen')return;
 $('persistence-prompt').hidden=false;
}
$('allow-persistence').addEventListener('click',requestPersistence);
$('request-persistence').addEventListener('click',requestPersistence);
$('later-persistence').addEventListener('click',()=>{$('persistence-prompt').hidden=true;if(state.ready)$('canvas').focus({preventScroll:true});putSetting('vc-port.persistence-prompt','seen');});
// Release only game inputs. Page focus/visibility listeners still receive events.
const heldKeys=new Map(),heldButtons=new Map();
document.addEventListener('keydown',e=>{if(state.ready&&e.target===$('canvas'))heldKeys.set(e.code,{key:e.key,code:e.code,keyCode:e.keyCode,location:e.location});},true);
document.addEventListener('keyup',e=>heldKeys.delete(e.code),true);
$('canvas').addEventListener('mousedown',e=>heldButtons.set(e.button,{button:e.button,clientX:e.clientX,clientY:e.clientY}));
document.addEventListener('mouseup',e=>heldButtons.delete(e.button),true);
function releaseInputs(){
 const keys=[...heldKeys.values()],buttons=[...heldButtons.values()];heldKeys.clear();heldButtons.clear();
 for(const key of keys){const event=new KeyboardEvent('keyup',{...key,bubbles:true});Object.defineProperty(event,'keyCode',{value:key.keyCode});Object.defineProperty(event,'which',{value:key.keyCode});$('canvas').dispatchEvent(event);}
 for(const button of buttons)$('canvas').dispatchEvent(new MouseEvent('mouseup',{...button,buttons:0,bubbles:true}));
 if(typeof releaseTouchInputs==='function')releaseTouchInputs();
}
function handleRuntimeBlur(){if(!state.ready)return false;releaseInputs();return true;}
function ignoreRuntimeVisibility(){return state.ready;}
window.addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInputs();});
// The pinned SDL runtime can also request mouse lock. Handle rejected promises
// on this canvas even when that older caller does not await the modern API.
const requestCanvasLock=$('canvas').requestPointerLock?.bind($('canvas'));
if(requestCanvasLock)$('canvas').requestPointerLock=function(options){try{const result=requestCanvasLock(options);result?.catch(()=>warn('Mouse lock unavailable. Click the canvas to retry.'));return result;}catch{warn('Mouse lock unavailable. Click the canvas to retry.');return undefined;}};
$('canvas').addEventListener('mousedown',async()=>{if(state.ready && $('settings-panel').hidden && $('persistence-prompt').hidden && !document.pointerLockElement){try{await $('canvas').requestPointerLock();}catch{warn('Mouse lock unavailable. Click the canvas to retry.');}}});
$('canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();warn('Graphics context lost. Export saved slots, then reload.');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSaves().catch(e=>saveStatus(e.message,true));});
window.addEventListener('pagehide',()=>{flushSaves().catch(console.error);});
window.addEventListener('error',e=>{if(state.started&&!state.ready)showFailure(e.error||new Error(e.message));});
const touch=/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&matchMedia('(pointer: coarse)').matches;document.body.dataset.isTouch=touch?'1':'0';
window.ViceCity={AssetXHR,stats,manifest,loadPart,loadFile,downloadPart,logicalPath,applyPreset,validateBackup,importBackup,snapshot,exportBackup,flushSaves,readSaves,replaceSaves,assetsDB,state,patchRuntime,Queue,awaitSignal,hash,release,requestPersistence,offerPersistence,releaseInputs,handleRuntimeBlur,ignoreRuntimeVisibility,captureDiagnostics,retryDownloads,optionalAudio,openingAudio,streamedAudio,embeddedAudio,stableGameplay};
updateStorage();updateConnectivity();updatePreset();progress();
const gameplayObserver=new MutationObserver(()=>{state.gameplaySince=stableGameplay()?(state.gameplaySince||performance.now()):0;});
gameplayObserver.observe(document.body,{attributes:true,attributeFilter:['data-state-menu','data-state-cutscene']});
document.addEventListener('visibilitychange',()=>{state.gameplaySince=stableGameplay()?performance.now():0;});
// Touch setup is appended by the build tool inside this closure.
let releaseTouchInputs = () => {};
function setupTouchControls() {
    const emulator = new GamepadEmulator();
    const gamepad = emulator.AddEmulatedGamepad(null, true);
    releaseTouchInputs = () => {
        for (let i = 0; i < gamepad.buttons.length; i++) emulator.PressButton(gamepad.index, i, 0, false);
        for (let i = 0; i < gamepad.axes.length; i++) emulator.MoveAxis(gamepad.index, i, 0);
    };
    const gamepadEmulatorConfig = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: $('move'),
        lockTargetWhilePressed: true,
        xAxisIndex: 0,
        yAxisIndex: 1,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig]);
    const gamepadEmulatorConfig1 = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: $('look'),
        lockTargetWhilePressed: true,
        xAxisIndex: 2,
        yAxisIndex: 3,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig1]);

    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 9,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.menu'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 3,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.car.getIn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 0,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.run'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 1,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fist'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 5,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.drift'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 2,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.jump'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.mobile'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 11,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.job'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.radio'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.weapon'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 8,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.camera'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 10,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.horn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        buttonIndexes: [1, 7],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireRight'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 6,
        buttonIndexes: [1, 6],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireLeft'),
    }]);
}

})();
