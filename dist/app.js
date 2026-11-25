const cats=['공통교양','일반교양','MSC','전공'],grades=['A+','A','B+','B','C+','C','D+','D','F','P','NP'],key='graduation-check-v1';
const $=id=>document.getElementById(id);let state={totalGoal:null,goals:Object.fromEntries(cats.map(c=>[c,null])),courses:[]},filter='전체',editing=null;
function valid(s){return s&&(s.totalGoal===undefined||s.totalGoal===null||(Number.isFinite(s.totalGoal)&&s.totalGoal>=0&&s.totalGoal<=600))&&s.goals&&cats.every(c=>(c==='일반교양'&&s.goals[c]===undefined)||s.goals[c]===null||(Number.isFinite(s.goals[c])&&s.goals[c]>=0&&s.goals[c]<=300))&&Array.isArray(s.courses)&&s.courses.every(c=>typeof c.id==='string'&&typeof c.name==='string'&&c.name.trim()&&c.name.length<=100&&cats.includes(c.category)&&grades.includes(c.grade)&&Number.isFinite(c.credits)&&c.credits>0&&c.credits<=30)&&s.courses.every(c=>(c.year===undefined||c.year===null||(Number.isInteger(c.year)&&c.year>=1&&c.year<=6))&&(c.semester===undefined||c.semester===null||[1,2].includes(c.semester)))&&new Set(s.courses.map(c=>c.id)).size===s.courses.length}
function normalize(s){return {totalGoal:s.totalGoal??null,goals:Object.fromEntries(cats.map(c=>[c,s.goals[c]??null])),courses:s.courses.map(c=>({...c,year:c.year??null,semester:c.semester??null}))}}
try{const s=JSON.parse(localStorage.getItem(key));if(valid(s))state=normalize(s)}catch{}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',2600)}
function save(){try{localStorage.setItem(key,JSON.stringify(state));$('saved').textContent='이 브라우저에 자동 저장'}catch{$('saved').textContent='저장 실패 · 기록을 내보내세요';toast('저장 공간을 확인하거나 기록을 내보내세요.')}}
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function earned(cat){return state.courses.filter(c=>c.category===cat&&!['F','NP'].includes(c.grade)).reduce((n,c)=>n+c.credits,0)}
function gpa(category=null){
 const points={'A+':4.5,A:4,'B+':3.5,B:3,'C+':2.5,C:2,'D+':1.5,D:1,F:0};
 const rows=state.courses.filter(c=>(category===null||c.category===category)&&Object.hasOwn(points,c.grade));
 const credits=rows.reduce((n,c)=>n+c.credits,0);
 return credits?rows.reduce((n,c)=>n+c.credits*points[c.grade],0)/credits:null
}
function gpaSummary(){
 const area=$('gpaoverview');area.replaceChildren();
 for(const [label,category] of [['전체 평점',null],['전공 평점','전공']]){
  const group=el('div',undefined,'gpaitem'),value=gpa(category),number=el('div',undefined,'gpanumber');
  number.append(el('strong',value===null?'—':value.toFixed(2)),el('span',' / 4.5'));
  group.append(el('h2',label),number);area.append(group)
 }
 area.append(el('p','학점 가중평균 · A+ 4.5, A 4.0, B+ 3.5, B 3.0, C+ 2.5, C 2.0, D+ 1.5, D 1.0, F 0 · P·NP 제외','gpanote'))
}
function totalSummary(){
 const total=cats.reduce((n,cat)=>n+earned(cat),0),goal=state.totalGoal,area=$('totaloverview');area.replaceChildren();
 const text=el('div');text.append(el('h2','총 졸업 학점'),el('p',goal===null?'총 졸업 요구 학점을 설정하세요.':total>=goal?'총 학점 기준 충족':`${goal-total}학점 더 이수해야 합니다.`));
 const number=el('div',undefined,'totalnumbers');number.append(el('span',total),el('small',` / ${goal===null?'—':goal} 학점`));
 const line=el('div',undefined,'goal'),label=el('label','총 필요 학점'),input=el('input');label.htmlFor='totalgoal';label.style.margin='0';Object.assign(input,{id:'totalgoal',type:'number',min:'0',max:'600',step:'0.5',value:goal===null?'':goal,placeholder:'설정'});
 input.onchange=()=>{if(!input.checkValidity()){input.reportValidity();return}state.totalGoal=input.value===''?null:Number(input.value);save();summary()};line.append(label,input);area.append(text,number,line);return {total,goal}
}
function summary(){gpaSummary();const {total,goal:totalGoal}=totalSummary();const area=$('overview');area.replaceChildren();let allSet=true,allDone=true;cats.forEach(cat=>{const goal=state.goals[cat],n=earned(cat),set=goal!==null;allSet&&=set;allDone&&=set&&n>=goal;const box=el('div',undefined,'category'),head=el('div',undefined,'cathead');head.append(categoryBadge(cat),el('span',!set?'기준 미설정':n>=goal?'충족':`${goal-n}학점 남음`,'status'));const num=el('div',undefined,'numbers');num.append(el('span',n),el('small',` / ${set?goal:'—'} 학점`));const bar=el('div',undefined,'bar'),fill=el('div');fill.style.width=(set?(goal===0?100:Math.min(100,n/goal*100)):0)+'%';bar.append(fill);const line=el('div',undefined,'goal'),label=el('label','필요 학점');label.htmlFor='goal-'+cats.indexOf(cat);label.style.margin='0';const input=el('input');Object.assign(input,{id:label.htmlFor,type:'number',min:'0',max:'300',step:'0.5',value:set?goal:'',placeholder:'설정'});input.onchange=()=>{if(!input.checkValidity()){input.reportValidity();return}state.goals[cat]=input.value===''?null:Number(input.value);save();summary()};line.append(label,input);box.append(head,num,bar,line);area.append(box)});$('overall').textContent=(!allSet||totalGoal===null)?'기준 설정 필요':(allDone&&total>=totalGoal)?'전체 학점 기준 충족':'학점 이수 중'}
function categoryLabel(cat){return ({'공통교양':'공교','일반교양':'일교'})[cat]||cat}
function categoryBadge(cat){return el('span',categoryLabel(cat),'categorybadge badge-'+cats.indexOf(cat))}
function courseCard(c){
 const item=el('div',undefined,'course category-'+cats.indexOf(c.category)),name=el('div',c.name,'coursename');name.title=c.name;item.append(name);
 const bottom=el('div',undefined,'coursebottom'),meta=el('div',undefined,'coursemeta');meta.append(categoryBadge(c.category),el('span',c.credits,'coursecredits'),el('span',c.grade,'coursegrade'));bottom.append(meta);
 const actions=el('div',undefined,'actions'),edit=el('button','수정'),del=el('button','삭제');
 edit.setAttribute('aria-label',c.name+' 수정');del.setAttribute('aria-label',c.name+' 삭제');
 edit.onclick=()=>{editing=c.id;['name','category','credits','grade','year','semester'].forEach(k=>$(k).value=c[k]??'');$('formtitle').textContent='과목 수정';$('submit').textContent='변경 저장하기';$('cancel').hidden=false;$('name').focus()};
 del.onclick=()=>{if(!confirm(`‘${c.name}’ 과목을 삭제할까요?`))return;state.courses=state.courses.filter(x=>x.id!==c.id);if(editing===c.id)reset();save();render()};
 actions.append(edit,del);bottom.append(actions);item.append(bottom);return item
}
function groupCredits(rows){return rows.filter(c=>!['F','NP'].includes(c.grade)).reduce((n,c)=>n+c.credits,0)}
function semesterPanel(year,semester,rows){
 const panel=el('section',undefined,'semester'),head=el('div',undefined,'semesterhead');head.append(el('h4',`${semester}학기`),el('span',`${rows.length}과목 · 취득 ${groupCredits(rows)}학점`));panel.append(head);
 if(rows.length)rows.forEach(c=>panel.append(courseCard(c)));else panel.append(el('div',filter==='전체'?'등록한 과목 없음':'해당 분류의 과목 없음','semesterempty'));
 const add=el('button','+ 과목 추가','semesteradd');add.setAttribute('aria-label',`${year}학년 ${semester}학기 과목 추가`);add.onclick=()=>{reset();$('year').value=year;$('semester').value=semester;if(filter!=='전체')$('category').value=filter;$('name').focus()};panel.append(add);return panel
}
function render(){
 summary();$('count').textContent=state.courses.length;$('filters').replaceChildren();
 ['전체',...cats].forEach(cat=>{const b=el('button',categoryLabel(cat),'filter'+(filter===cat?' active':''));b.setAttribute('aria-pressed',filter===cat);b.onclick=()=>{filter=cat;render()};$('filters').append(b)});
 const rows=state.courses.filter(c=>filter==='전체'||c.category===filter),area=$('yeargroups');area.replaceChildren();
 const maxYear=Math.max(4,...state.courses.map(c=>c.year||0));
 for(let year=1;year<=maxYear;year++){
  const group=el('section',undefined,'yearblock'),head=el('div',undefined,'yearheading'),yearRows=rows.filter(c=>c.year===year&&c.semester);
  head.append(el('h3',`${year}학년`),el('span',`취득 ${groupCredits(yearRows)}학점`));const semesters=el('div',undefined,'semesters');
  [1,2].forEach(sem=>semesters.append(semesterPanel(year,sem,rows.filter(c=>c.year===year&&c.semester===sem))));group.append(head,semesters);area.append(group)
 }
 const unassigned=rows.filter(c=>!c.year||!c.semester);
 if(unassigned.length){const section=el('section',undefined,'unassigned');section.append(el('h2','학기 미지정'),el('p','기존 과목의 수강 학년·학기를 수정에서 지정하세요.'));const box=el('div',undefined,'semester');unassigned.forEach(c=>box.append(courseCard(c)));section.append(box);area.append(section)}
}
function reset(keepFields=false){editing=null;if(keepFields===true){$('name').value='';$('name').setCustomValidity('')}else $('courseform').reset();$('formtitle').textContent='과목 추가';$('submit').textContent='과목 추가하기';$('cancel').hidden=true}
grades.forEach(g=>$('grade').append(el('option',g)));$('cancel').onclick=reset;
$('courseform').onsubmit=e=>{e.preventDefault();const name=$('name').value.trim();if(!name){$('name').setCustomValidity('과목명을 입력하세요.');$('name').reportValidity();return}const c={id:editing||crypto.randomUUID(),name,category:$('category').value,credits:Number($('credits').value),year:$('year').value?Number($('year').value):null,semester:$('semester').value?Number($('semester').value):null,grade:$('grade').value};if(editing)state.courses=state.courses.map(x=>x.id===editing?c:x);else state.courses.push(c);save();reset(true);render();toast('과목을 저장했습니다.');$('name').focus()};$('name').oninput=()=>$('name').setCustomValidity('');
$('export').onclick=()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='졸업체크-기록.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2000000)throw Error();const s=JSON.parse(await f.text());if(!valid(s))throw Error();if(state.courses.length&&!confirm('현재 기록을 불러온 기록으로 교체할까요?'))return;state=normalize(s);reset();save();render();toast('기록을 불러왔습니다.')}catch{toast('올바른 졸업 체크 기록 파일을 선택하세요.')}finally{e.target.value=''}};render();
