'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const API='https://api.github.com/repos/vipsraval/RI_PRV_NWS_LTR';
 const SAVED_TOKEN_KEY='raval-intelligent.read-token', IDLE_MS=60*60*1000;
 let lastActivity=0;
 function savedToken(){try{return localStorage.getItem(SAVED_TOKEN_KEY)||'';}catch{return '';}}
 function forgetToken(){try{localStorage.removeItem(SAVED_TOKEN_KEY);}catch{} $('remember-token').checked=false;$('forget-token').hidden=true;}
 function restoreToken(){const saved=savedToken();$('token').value=saved;$('remember-token').checked=!!saved;$('forget-token').hidden=!saved;}
 const sections={news:'AI News',engineering:'AI Engineering',aws:'AWS',interview:'Interview Prep'};
 const descriptions={news:'New launches, emerging ideas and research. Each story carries its source date.',engineering:'Essential AI concepts for senior developers. A lasting reference, expanded on request.',aws:'30 service guides: what they do, where to use them and what to watch for.',interview:'Java full-stack fundamentals, practical examples and questions to answer with confidence.'};
 let token='',state=null,controller=null,generation=0,idleTimer=null,archiveDate='';
 const node=(tag,value='',className='')=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;};
 const link=(label,href,cls='')=>{const el=node('a',label,cls);el.href=href;return el;};
 const short=(s,n=20000)=>typeof s==='string'&&s.length<=n;
 function updateToday(){const today=new Intl.DateTimeFormat('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'America/Chicago'}).format(new Date());$('login-date').textContent=today;if(state)$('heading-date').textContent=today;}
 function status(message){$('login-status').textContent=message;$('reader-status').textContent=message;}
 function busy(on){$('open').disabled=on;$('open').textContent=on?'Opening…':'Open reading room →';$('refresh').disabled=on;}
 function lock(message='Reader locked. Enter your token to continue.'){
   generation++;controller?.abort();controller=null;token='';state=null;archiveDate='';clearTimeout(idleTimer);
   $('token').value='';$('token').type='password';$('show-token').textContent='Show';$('show-token').setAttribute('aria-pressed','false');
   $('reader').hidden=true;$('signin').hidden=false;for(const id of ['content','tabs','footer-brand','heading-date','edition-info'])$(id).replaceChildren();
   $('search').value='';document.title='Raval Intelligent';busy(false);restoreToken();status(message);
 }
 function checkIdle(){if(token&&Date.now()-lastActivity>=IDLE_MS){lock('Locked after 60 minutes without activity.');return true;}return false;}
 function touch(){if(checkIdle())return;clearTimeout(idleTimer);if(token){lastActivity=Date.now();idleTimer=setTimeout(checkIdle,IDLE_MS);}}
 async function api(path,signal){
   const r=await fetch(API+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store',credentials:'omit',redirect:'error',signal});
   if(r.status===401)forgetToken();
   if(!r.ok)throw new Error(r.status===401?'Token expired or invalid. Check your read-only token.':r.status===404?'Repository or file unavailable. Select RI_PRV_NWS_LTR and Contents: Read-only.':r.status===403||r.status===429?'GitHub denied access or its request limit was reached. Check permissions or try later.':'GitHub is unavailable. Please try again.');
   const raw=await r.text();if(raw.length>2000000)throw new Error('The content file is too large.');return JSON.parse(raw);
 }
 async function file(path,sha,signal){
   const d=await api('/contents/'+path+'?ref='+encodeURIComponent(sha),signal);
   if(d.type!=='file'||d.encoding!=='base64'||!short(d.content,2000000))throw new Error('Unsupported content file.');
   return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(d.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));
 }
 function validArticles(data){
   if(data?.schemaVersion!==2||!Array.isArray(data.articles)||data.articles.length>500)throw new Error('Unsupported article collection.');
   const ids=new Set();for(const a of data.articles){
     if(!a||!short(a.id,150)||!/^[a-z0-9-]+$/.test(a.id)||ids.has(a.id)||!Object.hasOwn(sections,a.section)||!short(a.title,300)||!short(a.summary,2000)||!short(a.tag,200)||!short(a.date,40)||!Array.isArray(a.blocks)||a.blocks.length>40||!a.blocks.every(b=>b&&short(b.heading,200)&&short(b.text)&&(!b.code||short(b.code)))||!Array.isArray(a.sources)||a.sources.length>10||!a.sources.every(s=>s&&short(s.title,200)&&short(s.url,2000)))throw new Error('An article has an invalid format.');ids.add(a.id);
   }
   return data;
 }
 function validate(portal,library,news,index){
   if(portal?.schemaVersion!==2||!short(portal.title,100)||!short(portal.footer,100)||!short(portal.newsNotice,500)||!short(portal.libraryNotice,500))throw new Error('Unsupported reader configuration.');
   validArticles(library);validArticles(news);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(news.date)||library.articles.some(a=>a.section==='news')||news.articles.some(a=>a.section!=='news'))throw new Error('Invalid section or edition date.');
   if(index?.schemaVersion!==2||!Array.isArray(index.editions)||index.editions.length>2000||!index.editions.every(e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&e.path==='news/archive/'+e.date+'.json'&&short(e.label,200)))throw new Error('Invalid news archive index.');
   const ids=new Set([...library.articles,...news.articles].map(a=>a.id));if(ids.size!==library.articles.length+news.articles.length)throw new Error('Duplicate article IDs.');
 }
 const all=()=>state?[...state.news.articles,...state.library.articles]:[];
 const articleURL=a=>'#article/'+a.id;
 function card(a,lead=false){const el=node('article','','headline'+(lead?' lead':''));el.append(node('div',a.tag,'kicker'));const title=node(lead?'h2':'h3');title.append(link(a.title,articleURL(a)));el.append(title,node('p',a.summary),node('p',a.date+' · Read article →','meta'));return el;}
 function heading(title,href,label){const el=node('div','','section-heading');el.append(node('h1',title));if(href)el.append(link(label||'View all →',href));return el;}
 function group(title,key,limit=4,cls=''){const wrap=node('div');const h=node('div','', 'tile-heading '+cls);h.append(node('span',title),link('View all →','#section/'+key));wrap.append(h);for(const a of all().filter(a=>a.section===key).slice(0,limit))wrap.append(card(a));return wrap;}
 function home(){
   const out=$('content');out.append(heading('Today’s reading room','#section/news','Explore AI news →'));
   const featured=state.library.articles.filter(a=>a.featured===true);if(featured.length){const shelf=node('section','','featured-library');shelf.append(node('h2','Static learning library'));for(const a of featured)shelf.append(card(a));out.append(shelf);}
   const cols=node('div','','home-columns'),left=node('section','','home-column'),middle=node('section','','home-column'),right=node('aside','','home-column');
   const news=state.news.articles;for(let i=0;i<news.length;i++)left.append(card(news[i],i===0));if(!news.length)left.append(node('p','No news stories in this edition.'));
   left.append(node('p',state.portal.newsNotice,'edition-note'));
   middle.append(group('AI Engineering','engineering',4));right.append(group('AWS Learning','aws',3,'accent-orange'),group('Interview Desk','interview',3,'accent-purple'));
   cols.append(left,middle,right);out.append(cols,node('p',state.portal.libraryNotice,'edition-note'));
 }
 function section(key){const out=$('content');out.append(heading(sections[key]));out.append(node('p',descriptions[key],'section-intro'));const grid=node('div','','article-grid');all().filter(a=>a.section===key).forEach(a=>grid.append(card(a)));out.append(grid);}
 function article(id){
   const a=all().find(a=>a.id===id),out=$('content');if(!a){out.append(node('p','This article is not in the current collection. Open its news edition from Archive, or return Home.','empty'),link('Back to home','#home'));return;}
   const wrap=node('article','','article-view');wrap.append(link('← Back to '+sections[a.section],'#section/'+a.section,'breadcrumb'),node('div',a.tag,'kicker'),node('h1',a.title),node('p',a.summary,'standfirst'),node('p',(a.section==='news'?'Source date: ':'Library reviewed: ')+a.date+' · '+Math.max(1,Math.ceil(a.blocks.reduce((n,b)=>n+b.text.split(/\s+/).length,0)/180))+' min read','article-meta'));
   const body=node('div','','article-body');for(const b of a.blocks){body.append(node('h2',b.heading),node('p',b.text));if(b.code)body.append(node('pre',b.code));}wrap.append(body);
   const refs=node('div','','references');for(const s of a.sources){try{const u=new URL(s.url);if(u.protocol==='https:'&&!u.username&&!u.password){const l=link(s.title+' ↗',u.href);l.target='_blank';l.rel='noopener noreferrer';refs.append(l);}}catch{}}
   if(refs.childNodes.length)wrap.append(refs);
   const siblings=all().filter(x=>x.section===a.section),i=siblings.findIndex(x=>x.id===a.id),bottom=node('div','','article-bottom');bottom.append(link('← '+sections[a.section],'#section/'+a.section));if(siblings[i+1])bottom.append(link('Next article →',articleURL(siblings[i+1])));wrap.append(bottom);out.append(wrap);document.title=a.title+' | Raval Intelligent';
 }
 function route(focus=false){
   if(!state)return;const out=$('content');out.replaceChildren();document.title='Raval Intelligent';const hash=location.hash||'#home';
   for(const a of $('tabs').children)a.removeAttribute('aria-current');
   const query=$('search').value.trim().toLowerCase();
   if(query){out.append(heading('Search results'));const matches=all().filter(a=>(a.title+' '+a.summary+' '+a.tag).toLowerCase().includes(query));out.append(node('p',matches.length+' matching articles','section-intro'));const grid=node('div','','article-grid');matches.forEach(a=>grid.append(card(a)));out.append(grid);if(!matches.length)out.append(node('p','No matches. Try a service name or another concept.','empty'));}
   else if(hash.startsWith('#article/'))article(hash.slice(9));
   else if(hash==='#archive'){out.append(heading('AI news archive'),node('p','Only news changes with the edition. Your learning library stays available.','section-intro'));for(const e of state.index.editions){const b=node('button',e.label+' →','text-button archive-link');b.addEventListener('click',()=>load(e.path,e.date));out.append(b);}const latest=node('button','Open latest AI news →','text-button archive-link');latest.addEventListener('click',()=>load());out.append(latest);}
   else if(hash.startsWith('#section/')&&Object.hasOwn(sections,hash.slice(9)))section(hash.slice(9));else home();
   const active=hash.startsWith('#article/')?'#section/'+(all().find(a=>a.id===hash.slice(9))?.section||'news'):hash;
   for(const a of $('tabs').children)if(a.getAttribute('href')===active||(!location.hash&&a.getAttribute('href')==='#home'))a.setAttribute('aria-current','page');
   if(focus){out.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}
 }
 async function load(path='news/latest.json',date=''){
   const ticket=++generation;controller?.abort();controller=new AbortController();const current=controller;busy(true);status('Loading your private reading room…');const timeout=setTimeout(()=>current.abort(),30000);
   try{
     const repo=await api('',current.signal);if(repo.private!==true)throw new Error('Privacy check failed: the content repository must be private.');
     const commit=await api('/commits/'+encodeURIComponent(repo.default_branch),current.signal);if(!/^[a-f0-9]{40}$/.test(commit.sha))throw new Error('Cannot verify content revision.');
     const [portal,library,news,index]=await Promise.all(['portal.json','library/catalog.json',path,'news/index.json'].map(p=>file(p,commit.sha,current.signal)));validate(portal,library,news,index);if(ticket!==generation)return;
     state={portal,library,news,index};archiveDate=date;$('publication-title').textContent=portal.title;$('footer-brand').textContent=portal.footer;
     const d=new Date(news.date+'T12:00:00Z');if(Number.isNaN(d.getTime()))throw new Error('Invalid edition date.');updateToday();
     $('edition-info').textContent=(date?'Archive · ':'Latest edition · ')+news.date+' · '+library.articles.length+' library articles';
     $('tabs').replaceChildren(link('Home','#home'),...Object.entries(sections).map(([k,v])=>link(v,'#section/'+k)),link('Archive','#archive'));
     $('signin').hidden=true;$('reader').hidden=false;$('token').value='';$('token').type='password';$('show-token').textContent='Show';$('show-token').setAttribute('aria-pressed','false');status('');lastActivity=Date.now();touch();
     if($('remember-token').checked){try{localStorage.setItem(SAVED_TOKEN_KEY,token);$('forget-token').hidden=false;}catch{status('Opened, but this browser could not save the token.');}}
     if(location.hash==='#archive'){location.hash='#section/news';}route(true);
   }catch(err){if(ticket===generation)lock(err.name==='AbortError'?'Connection timed out. Please try again.':err instanceof SyntaxError?'A content file has invalid JSON.':err instanceof TypeError?'Could not connect or read content. Check the network and try again.':err.message);}
   finally{clearTimeout(timeout);if(ticket===generation)busy(false);}
 }
 $('login-form').addEventListener('submit',e=>{e.preventDefault();token=$('token').value.trim();$('token').value='';if(!token){status('Paste your read-only token first.');return;}load();});
 $('remember-token').addEventListener('change',()=>{if(!$('remember-token').checked)forgetToken();});
 $('forget-token').addEventListener('click',()=>{forgetToken();$('token').value='';status('Saved token removed from this browser.');});
 $('show-token').addEventListener('click',()=>{const show=$('token').type==='password';$('token').type=show?'text':'password';$('show-token').textContent=show?'Hide':'Show';$('show-token').setAttribute('aria-pressed',String(show));});
 $('lock').addEventListener('click',()=>lock());$('refresh').addEventListener('click',()=>load(archiveDate?'news/archive/'+archiveDate+'.json':'news/latest.json',archiveDate));
 $('search').addEventListener('input',()=>route());window.addEventListener('hashchange',()=>{if(state){$('search').value='';route(true);}});
 for(const ev of ['pointerdown','keydown','scroll'])document.addEventListener(ev,touch,{passive:true});
 window.addEventListener('pagehide',()=>lock());window.addEventListener('pageshow',e=>{if(e.persisted)lock();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkIdle();updateToday();}});
 updateToday();setInterval(updateToday,30000);
 restoreToken();busy(false);status('Ready. Your content loads directly from your private repository.');
})();
