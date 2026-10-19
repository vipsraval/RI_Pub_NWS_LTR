"use strict";
(() => {
 const $ = id => document.getElementById(id);
 const base = "https://api.github.com/repos/vipsraval/RI_PRV_NWS_LTR";
 let token = "", controller = null, generation = 0, idleTimer;
 const text = (tag, value, cls) => { const n = document.createElement(tag); n.textContent = value; if(cls) n.className = cls; return n; };
 const string = (v, max=20000) => typeof v === "string" && v.length <= max;
 function lock(message="Reader locked. Your session and newspaper have been cleared.") {
   generation++; if(controller) controller.abort(); controller=null; token=""; clearTimeout(idleTimer);
   $("token").value=""; $("stories").replaceChildren(); $("tasks").replaceChildren();
   $("archive").replaceChildren(new Option("Latest edition","latest.json"));
   $("paper").hidden=true; $("signin").hidden=false; $("lock").hidden=true; $("refresh").hidden=true;
   $("open").disabled=false; $("refresh").disabled=false; $("archive").disabled=false;
   $("edition-date").textContent="Your private reading room"; $("edition-label").textContent=""; $("status").textContent=message;
 }
 function touch(){ clearTimeout(idleTimer); if(token) idleTimer=setTimeout(()=>lock("Reader locked after 15 minutes without activity."),15*60*1000); }
 async function api(path,signal) {
   const r=await fetch(base+path,{headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},cache:"no-store",credentials:"omit",redirect:"error",signal});
   if(!r.ok) throw new Error(r.status===401?"Token expired or invalid. Create a new read-only token.":r.status===404?"Private repository or file unavailable. Check repository selection and Contents: Read-only permission.":r.status===403||r.status===429?"GitHub denied access or its request limit was reached. Check permissions, then try later.":"GitHub is temporarily unavailable. Try again later.");
   const raw=await r.text(); if(raw.length>3000000) throw new Error("This edition is too large to open safely."); return JSON.parse(raw);
 }
 async function file(path,ref,signal){
   const data=await api("/contents/"+path+"?ref="+encodeURIComponent(ref),signal);
   if(data.type!=="file"||data.encoding!=="base64"||!string(data.content,3000000)) throw new Error("Unsupported content file.");
   return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob(data.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));
 }
 function validate(e,t,a){
   if(e.schemaVersion!==1||!string(e.date,40)||!string(e.label,200)||!Array.isArray(e.articles)||e.articles.length>100||!e.articles.every(x=>x&&string(x.category,100)&&string(x.title,300)&&string(x.body)&&(!x.source||string(x.source,2000)))) throw new Error("Edition format is not supported.");
   if(t.schemaVersion!==1||!Array.isArray(t.items)||t.items.length>200||!t.items.every(x=>x&&string(x.title,300)&&["todo","doing","done"].includes(x.status))) throw new Error("Tasks format is not supported.");
   if(a.schemaVersion!==1||!Array.isArray(a.editions)||a.editions.length>1000||!a.editions.every(x=>x&&/^archive\/\d{4}-\d{2}-\d{2}\.json$/.test(x.path)&&string(x.label,200))) throw new Error("Archive format is not supported.");
 }
 function render(e,t,a,path){
   $("stories").replaceChildren();
   for(const item of e.articles){const card=text("article","","story");card.append(text("div",item.category,"category"),text("h2",item.title),text("p",item.body));
     if(item.source){try{const u=new URL(item.source);if(u.protocol==="https:"&&!u.username&&!u.password){const link=text("a","Read source ↗","source");link.href=u.href;link.target="_blank";link.rel="noopener noreferrer";card.append(link);}}catch{}}
     $("stories").append(card);
   }
   $("tasks").replaceChildren(text("h2","Your priorities"),text("p","Current task state · Read-only"));
   if(!t.items.length) $("tasks").append(text("p","No priorities added yet."));
   for(const item of t.items){const row=text("div","","task");row.append(text("span",item.title),text("span",{todo:"To do",doing:"In progress",done:"Done"}[item.status]));$("tasks").append(row);}
   $("archive").replaceChildren(new Option("Latest edition","latest.json"));
   for(const edition of a.editions) $("archive").append(new Option(edition.label,edition.path));
   $("archive").value=path; $("edition-date").textContent=e.date; $("edition-label").textContent=e.label;
   $("signin").hidden=true;$("paper").hidden=false;$("lock").hidden=false;$("refresh").hidden=false;
 }
 async function load(path="latest.json"){
   const ticket=++generation; if(controller) controller.abort(); controller=new AbortController(); const currentController=controller; const signal=currentController.signal;
   $("open").disabled=true;$("refresh").disabled=true;$("archive").disabled=true;$("lock").hidden=false;
   $("status").textContent="Opening your private edition…";
   const timeout=setTimeout(()=>currentController.abort(),30000);
   try{
     const repo=await api("",signal); if(repo.private!==true) throw new Error("Privacy check failed: the content repository must remain private.");
     const commit=await api("/commits/"+encodeURIComponent(repo.default_branch),signal);
     if(!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error("Could not verify the edition revision.");
     const [e,t,a]=await Promise.all([file(path,commit.sha,signal),file("tasks.json",commit.sha,signal),file("archive/index.json",commit.sha,signal)]);
     validate(e,t,a);if(ticket!==generation)return;render(e,t,a,path);touch();$("status").textContent="Private edition loaded directly from GitHub. Nothing is saved by this reader.";
   }catch(error){if(ticket===generation)lock(error.name==="AbortError"?"Connection timed out. Please try again.":error instanceof TypeError?"Could not connect to GitHub. Check your internet connection.":error instanceof SyntaxError?"A content file contains invalid JSON.":error.message);}
   finally{clearTimeout(timeout);if(ticket===generation){$("open").disabled=false;$("refresh").disabled=false;$("archive").disabled=false;}}
 }
 $("login-form").addEventListener("submit",e=>{e.preventDefault();token=$("token").value.trim();$("token").value="";if(!token)return;load();});
 $("lock").addEventListener("click",()=>lock());$("refresh").addEventListener("click",()=>load($("archive").value));$("archive").addEventListener("change",()=>load($("archive").value));
 for(const event of ["pointerdown","keydown","scroll"]) document.addEventListener(event,touch,{passive:true});
 window.addEventListener("pagehide",()=>lock());window.addEventListener("pageshow",e=>{if(e.persisted)lock();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&token)lock("Reader locked while away. Unlock to continue reading.");});
})();
