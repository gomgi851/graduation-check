const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('dist/app.js','utf8').split('grades.forEach(g=>')[0];
function context(saved=null){const ctx=vm.createContext({document:{getElementById(){}},localStorage:{getItem(){return JSON.stringify(saved)}}});vm.runInContext(source,ctx);return ctx}
const record={goals:{'공통교양':12,MSC:18,'전공':60},courses:[{id:'old',name:'이전 과목',category:'전공',credits:3,grade:'A+'}]};
test('이전 기록에 수강 정보가 없어도 학점과 과목을 보존',()=>{const ctx=context(record);assert.equal(vm.runInContext('state.courses[0].year',ctx),null);assert.equal(vm.runInContext('state.courses[0].semester',ctx),null);assert.equal(vm.runInContext("earned('전공')",ctx),3)});
test('학년·학기는 저장 후 복원되고 범위를 검증',()=>{const saved=structuredClone(record);saved.courses[0].year=2;saved.courses[0].semester=2;const ctx=context(saved);assert.equal(vm.runInContext('state.courses[0].year',ctx),2);assert.equal(vm.runInContext('state.courses[0].semester',ctx),2);for(const [field,value] of [['year',7],['year',0],['year',1.5],['semester',3]]){ctx.payload=structuredClone(saved);ctx.payload.courses[0][field]=value;assert.equal(vm.runInContext('valid(payload)',ctx),false)}});
test('F·NP 제외, P 포함 및 학기별 취득 학점 합산',()=>{const ctx=context();ctx.payload={...record,courses:['A+','F','P','NP'].map((grade,i)=>({...record.courses[0],id:String(i),grade,year:1,semester:i<2?1:2}))};vm.runInContext('state=normalize(payload)',ctx);assert.equal(vm.runInContext("earned('전공')",ctx),6);assert.equal(vm.runInContext('groupCredits(state.courses.filter(c=>c.semester===1))',ctx),3);assert.equal(vm.runInContext('groupCredits(state.courses.filter(c=>c.semester===2))',ctx),3);assert.equal(vm.runInContext("grades.includes('A0')",ctx),false)});
test('이전 JSON과 새 JSON 모두 유효, 중복 ID는 거부',()=>{const ctx=context();ctx.payload=structuredClone(record);assert.equal(vm.runInContext('valid(payload)',ctx),true);ctx.payload.courses.push({...ctx.payload.courses[0]});assert.equal(vm.runInContext('valid(payload)',ctx),false)});
