const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "resiliencegrid-demo-v1";
const seed = [
 {id:"RG-2048",type:"People stranded",place:"White Town · Beach Road",depth:"Waist",severity:"Critical",confidence:92,status:"Unverified",time:Date.now()-4*60000,people:4,lat:11.9342,lng:79.8351,notes:"Family reported water entering ground floor.",source:"Community"},
 {id:"RG-2047",type:"Flood water level",place:"Ariyankuppam bridge",depth:"Knee",severity:"Warning",confidence:84,status:"Verified",time:Date.now()-13*60000,people:2,lat:11.907,lng:79.815,notes:"Water rising near approach road.",source:"Community"},
 {id:"RG-2046",type:"Road blocked",place:"Lawspet · Main Road",depth:"Ankle",severity:"Moderate",confidence:71,status:"Dispatched",time:Date.now()-22*60000,people:0,lat:11.956,lng:79.812,notes:"Debris partially blocking lane.",source:"Field team"},
 {id:"RG-2045",type:"Structural damage",place:"Pillaichavady coast",depth:"Chest",severity:"Critical",confidence:88,status:"En Route",time:Date.now()-31*60000,people:3,lat:11.982,lng:79.844,notes:"Demo report: wall damage near shoreline.",source:"Community"},
 {id:"RG-2044",type:"Flood water level",place:"Mudaliarpet",depth:"Knee",severity:"Warning",confidence:76,status:"Resolved",time:Date.now()-58*60000,people:0,lat:11.916,lng:79.823,notes:"Water receding; route checked.",source:"Community"}
];
let state = loadState();
let photoData = null;
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));if(x&&Array.isArray(x.incidents))return x}catch(e){}return {incidents:seed,people:128,units:8,verifiedNotes:[]}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){toast("Storage is full. Try removing a large photo or clearing demo data.")}}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3000)}
function ago(ts){const m=Math.max(0,Math.floor((Date.now()-ts)/60000));return m<1?"now":m<60?`${m}m ago`:`${Math.floor(m/60)}h ago`}
function severity(depth,type){if(type==="People stranded"||type==="Medical assistance"||depth==="Chest")return "Critical";if(depth==="Waist"||type==="Structural damage")return "Warning";if(depth==="Knee"||type==="Road blocked")return "Moderate";return "Moderate"}
function shortPlace(s){return s||"Location not provided"}
function render(){
 const incidents=state.incidents;
 $("#statSOS").textContent=String(incidents.filter(x=>x.severity==="Critical"&&x.status!=="Resolved").length).padStart(2,"0");
 $("#statPeople").textContent=state.people;
 $("#statUnits").textContent=String(state.units).padStart(2,"0");
 $("#statShelter").textContent="72%";
 $("#pendingCount").textContent=incidents.filter(x=>x.status==="Unverified").length;
 $("#dispatchedCount").textContent=incidents.filter(x=>["Dispatched","En Route"].includes(x.status)).length;
 $("#resolvedCount").textContent=incidents.filter(x=>x.status==="Resolved").length;
 renderMarkers();renderPreview();renderTable();renderTasks();populateSelects();
 $("#lastUpdated").textContent="Updated "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function renderMarkers(){
 const host=$("#mapMarkers");host.innerHTML="";
 const coords=[[.24,.26],[.42,.56],[.56,.38],[.36,.76],[.68,.67],[.51,.2],[.18,.55],[.76,.42]];
 state.incidents.slice(0,8).forEach((x,i)=>{const [left,top]=coords[i%coords.length];const b=document.createElement("button");b.className="map-marker "+(x.severity==="Critical"?"critical":x.severity==="Warning"?"warning":x.status==="Resolved"?"safe":"unit");b.style.left=(left*100)+"%";b.style.top=(top*100)+"%";b.title=`${x.id}: ${x.place}`;b.innerHTML="<span><b>"+(x.severity==="Critical"?"!":x.status==="Resolved"?"✓":"•")+"</b></span>";b.addEventListener("click",()=>showIncident(x.id));host.appendChild(b)});
}
function renderPreview(){
 $("#incidentPreview").innerHTML=state.incidents.slice().sort((a,b)=>b.time-a.time).slice(0,4).map(x=>`<div class="incident-item"><i class="severity-bar ${x.severity.toLowerCase()}"></i><div><b>${esc(x.type)} · ${esc(x.id)}</b><small>${esc(x.place)} · ${esc(x.depth)} depth</small></div><time>${ago(x.time)}</time></div>`).join("");
}
function renderTable(){
 const f=$("#statusFilter").value;
 const list=state.incidents.filter(x=>f==="All"||(f==="Verified"?x.status==="Verified":x.status===f)).sort((a,b)=>b.time-a.time);
 $("#incidentTable").innerHTML=list.map(x=>`<tr><td><b>${esc(x.id)}</b><br>${esc(x.type)}</td><td>${esc(x.place)}</td><td><span class="status-pill ${x.severity==="Critical"?"critical":""}">${x.severity}</span></td><td>${x.confidence}%</td><td><span class="status-pill ${x.status==="Verified"?"verified":x.status==="Dispatched"||x.status==="En Route"?"dispatched":""}">${x.status}</span></td><td><button class="row-action" data-open="${x.id}">Review →</button></td></tr>`).join("")||'<tr><td colspan="6">No incidents match this filter.</td></tr>';
 $$("[data-open]").forEach(b=>b.addEventListener("click",()=>showIncident(b.dataset.open)));
}
function renderTasks(){
 const tasks=state.incidents.filter(x=>["Verified","Dispatched","En Route"].includes(x.status));
 $("#rescueTasks").innerHTML=tasks.length?tasks.map(x=>`<div class="task-card"><div><h3>${esc(x.id)} · ${esc(x.place)}</h3><p>${esc(x.type)} · ${x.depth} depth · ${x.status}</p></div><button data-task="${x.id}">${x.status==="Verified"?"Accept task":x.status==="Dispatched"?"Mark en route":"Resolve task"}</button></div>`).join(""):'<p class="muted">No active demo tasks. Verify an incident in the command center to create a task.</p>';
 $$("[data-task]").forEach(b=>b.addEventListener("click",()=>{const x=find(b.dataset.task);if(!x)return;x.status=x.status==="Verified"?"Dispatched":x.status==="Dispatched"?"En Route":"Resolved";save();render();toast(`${x.id} updated: ${x.status}`)}));
}
function populateSelects(){
 const opts=state.incidents.map(x=>`<option value="${x.id}">${x.id} · ${esc(x.place)}</option>`).join("");
 $("#verifyIncident").innerHTML=opts;$("#dispatchIncident").innerHTML=opts;
}
function find(id){return state.incidents.find(x=>x.id===id)}
function showIncident(id){
 const x=find(id);if(!x)return;
 $("#dialogContent").innerHTML=`<div class="dialog-body"><div class="eyebrow">INCIDENT REVIEW · ${x.id}</div><h2>${esc(x.type)} — ${esc(x.severity)}</h2><p><b>Location:</b> ${esc(x.place)}<br><b>Water depth:</b> ${esc(x.depth)}<br><b>People affected:</b> ${x.people}<br><b>Confidence:</b> ${x.confidence}% (demo heuristic)<br><b>Status:</b> ${x.status}<br><b>Received:</b> ${new Date(x.time).toLocaleString()}</p><p>${esc(x.notes||"No additional notes.")}</p><div class="dialog-actions"><button class="button button-primary" id="verifyNow">Mark verified</button><button class="button button-quiet" id="resolveNow">Resolve</button></div></div>`;
 $("#incidentDialog").showModal();
 $("#verifyNow").onclick=()=>{x.status="Verified";save();render();$("#incidentDialog").close();toast(`${id} marked verified locally.`)};
 $("#resolveNow").onclick=()=>{x.status="Resolved";save();render();$("#incidentDialog").close();toast(`${id} marked resolved locally.`)};
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
const views={overview:["Situation overview","A shared operating picture for a safer, more resilient coastline."],citizen:["Citizen portal","Share a local observation or record a demo SOS."],rescue:["Field response","A lightweight task view for mobile response teams."],command:["Command center","Review incidents and coordinate simulated response resources."]};
function navigate(name){
 Object.keys(views).forEach(v=>{$("#"+v+"View").classList.toggle("hidden",v!==name)});
 $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
 $("#pageTitle").textContent=views[name][0];$("#pageSubtitle").textContent=views[name][1];
 $(".main-nav").classList.remove("menu-open");window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("#menuToggle").addEventListener("click",()=>$(".main-nav").classList.toggle("menu-open"));
$("#contrastToggle").addEventListener("click",()=>{document.body.classList.toggle("high-contrast");toast("High contrast "+(document.body.classList.contains("high-contrast")?"enabled":"disabled"))});
$("#lowDataToggle").addEventListener("click",()=>{document.body.classList.toggle("low-data");const on=document.body.classList.contains("low-data");$("#lowDataState").textContent=on?"On":"Off";toast("Low-data view "+(on?"enabled":"disabled"))});
$("#centerMap").addEventListener("click",()=>{renderMarkers();toast("Illustrative coastal map recentered.")});
$("#statusFilter").addEventListener("change",renderTable);
function makeReport({sos=false}={}){
 const type=sos?"Emergency SOS":$("#reportType").value;
 const depth=sos?"Chest":$('input[name="depth"]:checked')?.value||"Ankle";
 const place=$("#landmark").value.trim()||"Puducherry · Location pending";
 const coords=$("#coordinates").value;
 const [lat,lng]=coords.includes(",")?coords.split(",").map(Number):[11.934,79.83];
 const nearby=state.incidents.find(x=>Math.abs(x.lat-lat)<.0005&&Math.abs(x.lng-lng)<.0005&&Date.now()-x.time<10*60000);
 if(nearby){toast("Possible duplicate: a report exists in this approximate 50 m area within 10 minutes.");}
 const x={id:"RG-"+(2050+Math.floor(Math.random()*7000)),type,place,depth,severity:severity(depth,type),confidence:nearby?48:coords?82:62,status:"Unverified",time:Date.now(),people:sos?1:Math.max(0,Number($("#headcount").value)||0),lat,lng,notes:sos?"One-click demo SOS. This is not transmitted to emergency services.":$("#details").value.trim(),source:"Local browser",photo:photoData};
 state.incidents.unshift(x);save();render();return x;
}
$("#sosButton").addEventListener("click",()=>{if(!confirm("Create a DEMO SOS saved only in this browser? This does NOT contact emergency services."))return;const x=makeReport({sos:true});toast(`Demo SOS ${x.id} saved locally. No rescue team was notified.`)});
$("#reportForm").addEventListener("submit",e=>{e.preventDefault();const x=makeReport();e.target.reset();$("#coordinates").value="";$("#photoName").textContent="Image stays on this device in demo mode.";photoData=null;toast(`Report ${x.id} saved on this device. It will queue while offline.`);});
$("#locateButton").addEventListener("click",()=>{if(!navigator.geolocation){toast("Geolocation is not available in this browser.");return}$("#locateButton").textContent="Locating…";navigator.geolocation.getCurrentPosition(p=>{$("#coordinates").value=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;$("#locateButton").textContent="◎ Location captured";toast("Browser location captured for this local report.")},()=>{$("#locateButton").textContent="◎ Use my location";toast("Location permission unavailable. You can still submit without coordinates.")},{enableHighAccuracy:true,timeout:10000})});
$("#photoInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith("image/")){toast("Please choose an image.");return}try{const img=await createImageBitmap(f);const canvas=document.createElement("canvas");const scale=Math.min(1,900/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);photoData=canvas.toDataURL("image/jpeg",.65);$("#photoName").textContent=`Compressed image ready · ${Math.round(photoData.length/1024)} KB (local demo)`}catch(err){toast("Could not process this image.")}});
$("#verifyForm").addEventListener("submit",e=>{e.preventDefault();const x=find($("#verifyIncident").value);if(!x)return;state.verifiedNotes.push({id:x.id,condition:$("#verifyCondition").value,notes:$("#verifyNotes").value,time:Date.now()});if($("#verifyCondition").value==="Conditions match report")x.confidence=Math.min(99,x.confidence+5);save();render();e.target.reset();toast("Field verification saved locally.")});
$("#dispatchForm").addEventListener("submit",e=>{e.preventDefault();const x=find($("#dispatchIncident").value);if(!x)return;x.status="Dispatched";x.assigned=$("#dispatchUnit").value;state.units=Math.max(0,state.units-1);save();render();toast(`${x.assigned} assigned to ${x.id} in this demo.`)});
$("#addSample").addEventListener("click",()=>{const depths=["Knee","Waist","Chest","Ankle"];const d=depths[Math.floor(Math.random()*depths.length)];const x={id:"RG-"+(2050+Math.floor(Math.random()*7000)),type:"Flood water level",place:["Heritage Town","Muthialpet","Ariyankuppam","Lawspet"][Math.floor(Math.random()*4)],depth:d,severity:severity(d,"Flood water level"),confidence:55+Math.floor(Math.random()*40),status:"Unverified",time:Date.now(),people:Math.floor(Math.random()*5),lat:11.93,lng:79.83,notes:"Generated sample event for interface testing.",source:"Simulation"};state.incidents.unshift(x);save();render();toast("Sample incident generated. Clearly marked as simulation data.")});
function updateClock(){$("#clock").textContent=new Date().toLocaleString([], {weekday:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"})}
function connection(){const on=navigator.onLine;$("#connectionText").textContent=on?"ONLINE":"OFFLINE";$(".connection i").style.background=on?"var(--teal)":"var(--amber)";if(!on)toast("Offline: new reports remain stored locally.");else if(connection.wasOffline)toast("Back online. Local demo data is still stored on this device.");connection.wasOffline=!on}
window.addEventListener("online",connection);window.addEventListener("offline",connection);
setInterval(()=>{updateClock();$("#lastUpdated").textContent="Updated "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});},1000);
setInterval(()=>{if(navigator.onLine&&Math.random()>.55){const n=state.incidents.find(x=>x.status==="Unverified");if(n){n.confidence=Math.min(98,n.confidence+1);save();render()}}},18000);
updateClock();connection();render();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
