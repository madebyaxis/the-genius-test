const DASHBOARD={
  endpoint:'https://qkiqlpmaaijnpaatjzsm.supabase.co/functions/v1/genius-admin-analytics',
  refreshMs:60000,
  sessionKey:'genius_admin_token'
};
const QUESTIONS=[...(window.Q1||[]),...(window.Q2||[])];
const PLAYER_IMG={
  '장동민':'assets/players/jangdongmin.webp','홍진호':'assets/players/hongjinho.webp',
  '이상민':'assets/players/leesangmin.webp','오현민':'assets/players/ohhyunmin.webp',
  '김경란':'assets/players/kimkyungran.webp','김경훈':'assets/players/kimkyunghoon.webp',
  '임요환':'assets/players/limyohwan.webp','성규':'assets/players/seonggyu.webp',
  '유정현':'assets/players/yoojunghyun.webp','최연승':'assets/players/choiyeonseung.webp',
  '김구라':'assets/players/kimgura.webp','최정문':'assets/players/choijungmoon.webp'
};
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString('ko-KR');
const pct=n=>`${Number(n||0).toFixed(1)}%`;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setStatus(msg,type=''){const el=$('status');el.textContent=msg;el.className='status '+type}
async function fetchAnalytics(){
  const token=sessionStorage.getItem(DASHBOARD.sessionKey)||'';
  const res=await fetch(DASHBOARD.endpoint,{
    method:'GET',
    headers:{'x-admin-token':token},
    cache:'no-store'
  });
  if(res.status===401)throw new Error('UNAUTHORIZED');
  if(!res.ok)throw new Error(`HTTP ${res.status}`);
  return res.json();
}
function renderKpis(s){
  const items=[
    ['누적 완료',fmt(s.total_tests),'전체 완료 테스트'],
    ['최근 7일',fmt(s.tests_7d),'완료 테스트'],
    ['최근 30일',fmt(s.tests_30d),'완료 테스트'],
    ['평균 소요시간',`${Number(s.avg_duration_sec||0).toFixed(1)}초`,'결과 도달까지'],
    ['추가질문 발생률',pct(s.adaptive_rate),'결과가 애매했던 비율'],
    ['결과 공유율',pct(s.share_rate),'공유 또는 링크 복사'],
    ['평균 결과 만족도',s.avg_rating?Number(s.avg_rating).toFixed(2)+'/5':'—','1~5점 자기평가'],
    ['만족도 응답률',pct(s.rating_rate),'결과 평가 참여율']
  ];
  $('kpis').innerHTML=items.map(x=>`<article class="kpi"><div class="kpi-label">${x[0]}</div><div class="kpi-value">${x[1]}</div><div class="kpi-note">${x[2]}</div></article>`).join('');
}
function renderTrend(rows){
  const el=$('dailyChart');
  if(!rows?.length){el.innerHTML='<div class="empty">표시할 데이터가 없습니다.</div>';return}
  const W=900,H=230,padX=34,padY=24,max=Math.max(1,...rows.map(r=>Number(r.count)));
  const pts=rows.map((r,i)=>{
    const x=padX+(W-padX*2)*(i/Math.max(1,rows.length-1));
    const y=H-padY-(H-padY*2)*(Number(r.count)/max);
    return {x,y,count:Number(r.count),day:r.day};
  });
  const grid=[0,.25,.5,.75,1].map(v=>{const y=H-padY-(H-padY*2)*v;return `<line class="grid-line" x1="${padX}" y1="${y}" x2="${W-padX}" y2="${y}"/><text class="axis-text" x="2" y="${y+4}">${Math.round(max*v)}</text>`}).join('');
  const dots=pts.filter((_,i)=>i%5===0||i===pts.length-1).map(p=>`<circle class="trend-dot" cx="${p.x}" cy="${p.y}" r="3.5"><title>${p.day}: ${p.count}건</title></circle>`).join('');
  const start=rows[0]?.day||'',end=rows.at(-1)?.day||'';
  el.innerHTML=`<svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 30일 테스트 완료 추이">${grid}<polyline class="trend-line" points="${pts.map(p=>p.x+','+p.y).join(' ')}"/>${dots}<text class="axis-text" x="${padX}" y="${H-2}">${start}</text><text class="axis-text" text-anchor="end" x="${W-padX}" y="${H-2}">${end}</text></svg>`;
}
function renderBars(id,rows,withRating=false){
  const el=$(id);
  if(!rows?.length){el.innerHTML='<div class="empty">아직 표본이 없습니다.</div>';return}
  const max=Math.max(1,...rows.map(r=>Number(r.count)));
  el.innerHTML=rows.map(r=>{
    const img=PLAYER_IMG[r.player]?`<img src="${PLAYER_IMG[r.player]}" alt="">`:'';
    const rating=withRating&&Number(r.avg_rating)>0?` · ★ ${Number(r.avg_rating).toFixed(1)}`:'';
    return `<div class="bar-row"><div class="bar-person">${img}<span class="bar-name">${esc(r.player)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,100*Number(r.count)/max)}%"></div></div><div class="bar-value"><b>${fmt(r.count)}</b> · ${pct(r.pct)}${rating}</div></div>`;
  }).join('');
}
function renderQuestions(rows){
  const el=$('questionDistribution'),map=new Map();
  (rows||[]).forEach(r=>map.set(`${r.question}:${r.answer}`,r));
  el.innerHTML=QUESTIONS.map((q,qi)=>{
    const opts=q.a.map((o,oi)=>{
      const r=map.get(`${qi+1}:${oi}`)||{count:0,pct:0};
      return `<div class="option-row"><span class="option-letter">${String.fromCharCode(65+oi)}</span><div class="option-copy"><div class="option-text" title="${esc(o.t)}">${esc(o.t)}</div><div class="option-track"><div class="option-fill" style="width:${Number(r.pct)||0}%"></div></div></div><span class="option-val">${pct(r.pct)}<br>${fmt(r.count)}명</span></div>`;
    }).join('');
    return `<article class="question-card"><div class="question-title"><span class="q-num">Q${qi+1}</span>${esc(q.q)}</div>${opts}</article>`;
  }).join('');
}
function renderPairs(rows){
  const el=$('collisionPairs');
  if(!rows?.length){el.innerHTML='<div class="empty">아직 경합 데이터가 없습니다.</div>';return}
  el.innerHTML=`<table class="pair-table">${rows.map((r,i)=>`<tr><td>${i+1}. ${esc(r.pair)}</td><td>${fmt(r.count)}회</td></tr>`).join('')}</table>`;
}
function renderVersions(rows){
  const el=$('versionDistribution');
  if(!rows?.length){el.innerHTML='<div class="empty">아직 버전 데이터가 없습니다.</div>';return}
  el.innerHTML=rows.map(r=>`<div class="version-row"><span>${esc(r.version)}</span><b>${fmt(r.count)}건</b></div>`).join('');
}
function signal(status,title,value,desc){return `<article class="signal ${status}"><div class="signal-title">${title}</div><div class="signal-value">${value}</div><div class="signal-desc">${desc}</div></article>`}
function renderSignals(data){
  const s=data.summary,total=Number(s.total_tests||0),results=data.result_distribution||[],qs=data.question_distribution||[];
  if(total<30){
    $('modelSignals').innerHTML=signal('warn','표본 크기',`${fmt(total)}건`,'30건 전에는 방향만 확인하고 모델 가중치는 조정하지 않는 편이 안전합니다.');
    return;
  }
  const maxResult=results.reduce((m,r)=>Number(r.pct)>Number(m?.pct||0)?r:m,null);
  const maxQ=qs.reduce((m,r)=>Number(r.pct)>Number(m?.pct||0)?r:m,null);
  const items=[];
  items.push(signal(Number(maxResult?.pct||0)>30?'warn':'good','결과 집중도',maxResult?`${esc(maxResult.player)} ${pct(maxResult.pct)}`:'—',Number(maxResult?.pct||0)>30?'한 캐릭터 결과가 30%를 넘었습니다.':'현재 결과 분포의 과도한 집중 신호는 없습니다.'));
  items.push(signal(Number(maxQ?.pct||0)>70?'warn':'good','문항 쏠림',maxQ?`Q${maxQ.question} · ${pct(maxQ.pct)}`:'—',Number(maxQ?.pct||0)>70?'한 선택지가 70%를 넘었습니다. 문항 변별력을 점검하세요.':'응답 선택지의 극단적 쏠림 신호는 없습니다.'));
  items.push(signal(Number(s.adaptive_rate||0)>60?'warn':'good','추가질문 비율',pct(s.adaptive_rate),Number(s.adaptive_rate||0)>60?'기본 12문항의 구분력이 낮을 가능성을 점검하세요.':'현재 추가 판별 질문 발생률은 관리 범위입니다.'));
  const rating=Number(s.avg_rating||0);
  items.push(signal(rating&&rating<3.2?'bad':rating?'good':'warn','결과 만족도',rating?rating.toFixed(2)+'/5':'표본 없음',rating&&rating<3.2?'캐릭터 벡터·문항 가중치를 우선 점검하세요.':rating?'현재 만족도에 뚜렷한 경고 신호는 없습니다.':'만족도 응답이 쌓이면 품질 판단을 시작합니다.'));
  $('modelSignals').innerHTML=items.join('');
}
function render(data){
  renderKpis(data.summary||{});
  renderTrend(data.daily_completions||[]);
  renderBars('resultDistribution',data.result_distribution||[],true);
  renderBars('allyDistribution',data.ally_distribution||[],false);
  renderSignals(data);
  renderQuestions(data.question_distribution||[]);
  renderPairs(data.collision_pairs||[]);
  renderVersions(data.version_distribution||[]);
  $('updatedAt').textContent='갱신 '+new Date(data.generated_at||Date.now()).toLocaleString('ko-KR');
  if(Number(data.summary?.total_tests||0)===0)setStatus('아직 저장된 완료 결과가 없습니다. 테스트가 완료되면 자동으로 반영됩니다.','ok');
  else setStatus(`정상 연결 · 익명 완료 결과 ${fmt(data.summary.total_tests)}건 집계 중`,'ok');
}
function showLogin(message=''){
  $('loginGate').hidden=false;
  $('dashboardContent').hidden=true;
  $('refreshBtn').hidden=true;
  $('logoutBtn').hidden=true;
  $('updatedAt').textContent='로그인 필요';
  $('loginError').textContent=message;
}
function showDashboard(){
  $('loginGate').hidden=true;
  $('dashboardContent').hidden=false;
  $('refreshBtn').hidden=false;
  $('logoutBtn').hidden=false;
}
async function load(){
  $('refreshBtn').disabled=true;
  try{
    const data=await fetchAnalytics();
    showDashboard();
    render(data);
  }catch(err){
    console.error(err);
    if(String(err.message)==='UNAUTHORIZED'){
      sessionStorage.removeItem(DASHBOARD.sessionKey);
      showLogin('관리자 토큰이 올바르지 않습니다.');
    }else{
      if(!$('dashboardContent').hidden)setStatus('집계 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.','error');
      else showLogin('집계 API에 연결하지 못했습니다.');
    }
  }finally{$('refreshBtn').disabled=false}
}
async function login(){
  const token=$('adminToken').value.trim();
  if(!token){$('loginError').textContent='관리자 토큰을 입력하세요.';return}
  sessionStorage.setItem(DASHBOARD.sessionKey,token);
  $('loginError').textContent='확인 중…';
  await load();
  if(!$('dashboardContent').hidden)$('adminToken').value='';
}
function logout(){
  sessionStorage.removeItem(DASHBOARD.sessionKey);
  showLogin('');
}
$('loginBtn').addEventListener('click',login);
$('adminToken').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('refreshBtn').addEventListener('click',load);
$('logoutBtn').addEventListener('click',logout);
if(sessionStorage.getItem(DASHBOARD.sessionKey)) load(); else showLogin('');
setInterval(()=>{if(sessionStorage.getItem(DASHBOARD.sessionKey))load()},DASHBOARD.refreshMs);
