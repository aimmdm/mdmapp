// Uji logika Code.gs memakai tiruan layanan Google (tanpa akun Google).
// Jalankan: node apps-script/test/gas-mock-test.cjs
const fs=require('fs'),vm=require('vm');
// ---- mocks ----
class Range{constructor(sh,r,c,nr,nc){Object.assign(this,{sh,r,c,nr,nc})}
 getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push((this.sh.rows[this.r-1+i]||[])[this.c-1+j]??'');o.push(row)}return o}
 getValue(){return this.getValues()[0][0]}
 setValue(v){return this.setValues([[v]])}
 setValues(vs){vs.forEach((row,i)=>{const R=this.sh.rows[this.r-1+i]=this.sh.rows[this.r-1+i]||[];row.forEach((v,j)=>R[this.c-1+j]=v)})}}
class Sheet{constructor(n){this.n=n;this.rows=[]}getLastRow(){return this.rows.length}appendRow(a){this.rows.push(a.slice())}getRange(r,c,nr=1,nc=1){return new Range(this,r,c,nr,nc)}}
class SS{constructor(){this.sheets={Sheet1:new Sheet('Sheet1')}}getId(){return'SSID'}getUrl(){return'http://ss'}getSheetByName(n){return this.sheets[n]||null}insertSheet(n){return this.sheets[n]=new Sheet(n)}getSheets(){return Object.values(this.sheets)}deleteSheet(s){delete this.sheets[s.n]}}
const ss=new SS(),props={},cache={},mails=[];
const ctx={console,Logger:{log:console.log},Date,Math,JSON,Number,String,
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>props[k]=v})},
 SpreadsheetApp:{create:()=>ss,openById:()=>ss},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]??null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 MailApp:{sendEmail:(...a)=>mails.push(a)},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:t=>({t,setMimeType(){return this}})}};
vm.createContext(ctx); vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','Code.gs'),'utf8'),ctx);
const post=o=>JSON.parse(ctx.doPost({postData:{contents:typeof o==='string'?o:JSON.stringify(o)}}).t);
const get=p=>JSON.parse(ctx.doGet({parameter:p}).t);
let fail=0;const t=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++};
ctx.setup(); t('setup creates sheets',!!ss.sheets.reports&&!!ss.sheets.hits&&!ss.sheets.Sheet1);
props['NOTIFY_EMAIL']='a@b.c';
const O='https://www.mainilmu.pro';
t('report ok',post({a:'report',o:O,u:O+'/x.html',t:'Gabung PDF',k:'Error',m:'Tombol tidak jalan di HP',e:''}).ok===true);
t('report stored + mail',ss.sheets.reports.rows.length===2&&mails.length===1);
t('formula injection neutralised',(post({a:'report',o:O,u:O+'/x.html',t:'=HYPERLINK("x")',k:'Lainnya',m:'+cmd pesan panjang ok',e:''}),ss.sheets.reports.rows[2][1].startsWith("'=")));
t('bad origin rejected',post({a:'report',o:'https://evil.com',m:'halo dunia',u:O+'/x'}).error==='origin');
t('short msg rejected',post({a:'report',o:O,m:'hi'}).error==='short');
t('bad url hit rejected',post({a:'hit',o:O,u:'https://evil.com/a'}).error==='url');
t('hit new',post({a:'hit',o:O,u:O+'/a.html',t:'Tool A'}).ok&&ss.sheets.hits.rows.length===2);
post({a:'hit',o:O,u:O+'/a.html',t:'Tool A'});post({a:'hit',o:O,u:O+'/b.html',t:'Tool B'});
t('hit increments',ss.sheets.hits.rows[1][2]===2&&ss.sheets.hits.rows.length===3);
const top=get({a:'top',n:'5'});t('top sorted',top.ok&&top.items[0].u===O+'/a.html'&&top.items[0].h===2&&top.items.length===2);
post({a:'hit',o:O,u:O+'/b.html',t:'Tool B'});post({a:'hit',o:O,u:O+'/b.html',t:'Tool B'});
t('cache invalidated on hit',get({a:'top'}).items[0].u===O+'/b.html');
t('garbage json handled',post('{not json').error==='bad_request');
t('oversize rejected',post('x'.repeat(5000)).error==='too_large');
t('unknown action',post({a:'zzz',o:O}).error==='action');
t('get default',get({}).version==='1.0.0');
let rl=0;for(let i=0;i<130;i++){if(post({a:'hit',o:O,u:O+'/a.html',t:'A'}).error==='rate')rl++}t('hit rate-limit kicks in',rl>0);
console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);
