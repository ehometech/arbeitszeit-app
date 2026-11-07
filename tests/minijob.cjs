const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
function element(){return {value:'',checked:false,hidden:false,style:{},children:[],classList:{add(){},remove(){}},append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]}};}
const els={};let saved=0,alerts=[];
const ctx=vm.createContext({console,document:{getElementById(id){return els[id]??=element()},createElement:element},employees:[],entries:[],currentMonth:10,currentYear:2026,monthNames:['','','','','','','','','','','November'],editingMaIdx:-1,APP_PIN:'9999',ag:true,isAG(){return ctx.ag},alert(x){alerts.push(x)},saveData(){saved++}});
for(const name of ['renderMAListe','renderMASelect','renderAgFilterSelect','renderFotoMASelect','renderGalFilterSelect','buildUserList'])ctx[name]=()=>{};
ctx.isAzubiMA=()=>false;
const helpers=html.slice(html.indexOf('function isMinijobMA'),html.indexOf('// ============ MONAT ============'));
vm.runInContext(helpers,ctx);
for(const name of ['openNewMA','editMA','closeModal','saveMA']){
 const line=html.split('\n').find(l=>l.startsWith('function '+name+'('));vm.runInContext(line,ctx);
}
assert.equal(ctx.parseHourlyRate('14,50'),1450);
assert.equal(ctx.parseHourlyRate('14.50'),1450);
assert.equal(ctx.parseHourlyRate(''),null);
for(const bad of ['-2','0','Infinity','12,345','1e2','10foo','10000'])assert.ok(Number.isNaN(ctx.parseHourlyRate(bad)),bad);
assert.equal(ctx.isMinijobMA({rolle:'Minijobber'}),true);
assert.equal(ctx.isMinijobMA({rolle:'Minijobber',minijob:false}),false);
assert.equal(ctx.isMinijobMA({rolle:'Elektriker'}),false);
ctx.entries=[{ma:0,dat:'2026-11-01',typ:'arbeit',h:7.5,pause:30},{ma:0,dat:'2026-11-02',typ:'arbeit',h:2.25},{ma:0,dat:'2026-11-03',typ:'krank',h:8},{ma:0,dat:'2026-11-04',typ:'urlaub',h:8},{ma:0,dat:'2026-11-05',typ:'schule',h:8},{ma:1,dat:'2026-11-01',typ:'arbeit',h:20},{ma:0,dat:'2026-10-31',typ:'arbeit',h:10}];
const before=JSON.stringify(ctx.entries);
assert.equal(ctx.getMinijobPay({stundenlohnCent:1450},0,'2026-11').pay,14138);
assert.equal(ctx.getMinijobPay({},0,'2026-11').pay,null);
assert.equal(ctx.getMinijobPay({stundenlohnCent:1450},0,'2027-01').pay,0);
ctx.employees=[{vn:'Mini',nl:'Job',minijob:true,stundenlohnCent:1450},{vn:'Other',nl:'Role'}];
ctx.renderMinijobMonth(-1,'2026-11');assert.equal(els.minijobMonth.style.display,'block');assert.equal(els.minijobMonth.children.length,3);
ctx.renderMinijobMonth(1,'2026-11');assert.equal(els.minijobMonth.style.display,'none');
ctx.ag=false;ctx.renderMinijobMonth(-1,'2026-11');assert.equal(els.minijobMonth.style.display,'none');
ctx.editingMaIdx=0;ctx.saveMA();assert.equal(saved,0);
ctx.ag=true;ctx.employees[0].pin='1234';ctx.employees[0].custom='preserved';ctx.editMA(0);assert.equal(els.maStundenlohn.value,'14,50');
els.maStundenlohn.value='15,25';ctx.saveMA();assert.equal(ctx.employees[0].stundenlohnCent,1525);assert.equal(ctx.employees[0].custom,'preserved');assert.equal(saved,1);
ctx.editMA(0);els.maStundenlohn.value='-1';ctx.saveMA();assert.equal(saved,1);
ctx.openNewMA();assert.equal(els.maStundenlohn.value,'');assert.equal(els.maMinijob.checked,false);
assert.equal(JSON.stringify(ctx.entries),before);
console.log('Passed: script syntax, rates, rounding, month/employee/type filters, empty months, role visibility, employer guard, save/edit/reset, metadata and time-entry preservation.');

