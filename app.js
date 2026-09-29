const M={...CORE,questions:[...Q1,...Q2],adaptive:ADAPTIVE}; const T=M.traits,C=M.characters,Q=M.questions,A=M.adaptive,G=M.generic_adaptive,B=M.calibration_bias;
const names=Object.keys(C), nT=T.length;
const means=T.map((_,j)=>names.reduce((s,n)=>s+C[n][1][j],0)/names.length);
const sds=T.map((_,j)=>Math.sqrt(names.reduce((s,n)=>s+(C[n][1][j]-means[j])**2,0)/names.length)||1);
const CZ=names.map(n=>C[n][1].map((x,j)=>(x-means[j])/sds[j]));
const CZN=CZ.map(v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)});
let idx=0,e=Array(nT).fill(0),extra=[],extraMode=null,extraKey=null,baseAnswers=[],adaptiveAnswers=[],TEST_STARTED_AT=null,RATING_SENT=false;
const PLAYER_IMG={
  '장동민':'assets/players/jangdongmin.webp',
  '홍진호':'assets/players/hongjinho.webp',
  '이상민':'assets/players/leesangmin.webp',
  '오현민':'assets/players/ohhyunmin.webp',
  '김경란':'assets/players/kimkyungran.webp',
  '김경훈':'assets/players/kimkyunghoon.webp',
  '임요환':'assets/players/limyohwan.webp',
  '성규':'assets/players/seonggyu.webp',
  '유정현':'assets/players/yoojunghyun.webp',
  '최연승':'assets/players/choiyeonseung.webp',
  '김구라':'assets/players/kimgura.webp',
  '최정문':'assets/players/choijungmoon.webp'
};
function playerPhoto(name,cls=''){return `<img class="player-photo ${cls}" src="${PLAYER_IMG[name]}" alt="${name} AI 스타일 이미지" loading="eager" decoding="async">`}
function centeredOptions(q){const rows=q.a.map(o=>T.map(t=>o.w[t]||0)); const mean=T.map((_,j)=>rows.reduce((s,r)=>s+r[j],0)/rows.length);return rows.map(r=>{let v=r.map((x,j)=>x-mean[j]);const m=Math.hypot(...v)||1;return v.map(x=>x/m)})}
function addVector(v,mult=1){v.forEach((x,j)=>e[j]+=mult*x)}
function unit(v){const m=Math.hypot(...v)||1;return v.map(x=>x/m)}
function dot(a,b){return a.reduce((s,x,j)=>s+x*b[j],0)}
function scores(){const u=unit(e);return names.map((n,k)=>[n,dot(u,CZN[k])+(B[n]||0)]).sort((a,b)=>b[1]-a[1])}
function keyFor(a,b){return A[a+'|'+b]?a+'|'+b:(A[b+'|'+a]?b+'|'+a:null)}
function clearAdaptive(){extra=[];extraMode=null;extraKey=null;adaptiveAnswers=[]}
function rebuildEvidence(){
  e=Array(nT).fill(0);
  baseAnswers.forEach((answer,i)=>{
    if(Number.isInteger(answer)&&Q[i]) addVector(centeredOptions(Q[i])[answer],1);
  });
  adaptiveAnswers.forEach((entry,i)=>{
    const answer=typeof entry==='number'?entry:entry?.answer;
    if(Number.isInteger(answer)&&extra[i]) addVector(centeredOptions(extra[i])[answer],2);
  });
}
function prepareAdaptive(){
  rebuildEvidence();
  const s=scores(),gap=s[0][1]-s[1][1];
  if(gap>=.09)return false;
  const key=keyFor(s[0][0],s[1][0]);
  if(key){extra=A[key];extraMode='manual';extraKey=key;return true}
  const ia=names.indexOf(s[0][0]),ib=names.indexOf(s[1][0]);
  const dif=T.map((t,j)=>[j,Math.abs(CZ[ia][j]-CZ[ib][j])]).sort((a,b)=>b[1]-a[1]).slice(0,2);
  extra=dif.map(([j])=>G[T[j]]);extraMode='generic';extraKey=dif.map(x=>x[0]);return true
}
function start(){app.innerHTML=`<div class="card hero-card"><div class="hero-content"><div class="small">THE GENIUS CHARACTER TEST · v2.4</div><h1>나는 더 지니어스에서 누구일까?</h1><p class="muted">12개의 게임 상황에서 당신이라면 어떻게 플레이할지 선택하세요. 결과가 비슷할 때만 판별 질문 2개가 추가됩니다.</p><div class="notice small">결과는 지능·인성 평가가 아니라 방송 속 의사결정 패턴과의 유사도를 비교합니다.</div><button class="primary hero-start" onclick="beginTest()">테스트 시작</button><div class="small hero-note">AI로 제작한 팬 테스트 비주얼을 사용합니다.</div><div class="small privacy-note">테스트 개선을 위해 개인을 식별하지 않는 익명 응답 통계를 저장합니다.</div></div></div>`}
function beginTest(){if(!TEST_STARTED_AT)TEST_STARTED_AT=new Date().toISOString();showQ()}
function currentQ(){return idx<Q.length?Q[idx]:extra[idx-Q.length]}
function currentSavedAnswer(){
  if(idx<Q.length)return Number.isInteger(baseAnswers[idx])?baseAnswers[idx]:null;
  const entry=adaptiveAnswers[idx-Q.length];
  const answer=typeof entry==='number'?entry:entry?.answer;
  return Number.isInteger(answer)?answer:null;
}
function goBack(){
  if(idx<=0)return;
  idx--;
  if(idx<Q.length&&extra.length){
    clearAdaptive();
    rebuildEvidence();
  }
  showQ();
}
function showQ(){
  let q=currentQ();
  if(!q){
    if(idx===Q.length&&prepareAdaptive()){showQ();return}
    return result()
  }
  const total=Q.length+extra.length;
  const pct=Math.min(100,(idx+1)/Math.max(Q.length,total)*100);
  const saved=currentSavedAnswer();
  const back=idx>0?`<button class="back-btn" onclick="goBack()">← 이전 질문</button>`:'';
  const editNote=saved!==null?'<div class="small edit-note">이전에 고른 답입니다. 다른 답을 누르면 여기부터 다시 계산합니다.</div>':'';
  app.innerHTML=`<div class="meta small"><span>${idx<Q.length?'기본 분석':'정밀 판별'}</span><span>${idx+1}/${total}</span></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="card question-card-live"><div class="q">${q.q}</div>${q.a.map((o,k)=>`<button class="answer-option ${saved===k?'selected-answer':''}" aria-pressed="${saved===k?'true':'false'}" onclick="pick(${k})">${o.t}${saved===k?'<span class="selected-mark">선택됨</span>':''}</button>`).join('')}${editNote}<div class="question-nav">${back}</div></div>`
}
function pick(k){
  const q=currentQ();
  if(!q)return;
  if(idx<Q.length){
    baseAnswers=baseAnswers.slice(0,idx);
    baseAnswers[idx]=k;
    if(extra.length)clearAdaptive();
  }else{
    const adaptiveIndex=idx-Q.length;
    adaptiveAnswers=adaptiveAnswers.slice(0,adaptiveIndex);
    adaptiveAnswers[adaptiveIndex]={
      mode:extraMode,
      key:Array.isArray(extraKey)?extraKey.join(','):String(extraKey||''),
      question_index:adaptiveIndex,
      answer:k
    };
  }
  rebuildEvidence();
  idx++;
  showQ()
}
function matchDisplay(raw){return Math.max(55,Math.min(97,Math.round(50+55*raw)))}
let CURRENT_SHARE=null;
function canonicalUrl(){return location.origin+location.pathname}
function setShareResult(name,type,score){
  CURRENT_SHARE={name,type,score,url:canonicalUrl()};
}
function shareText(){
  if(!CURRENT_SHARE)return '';
  return `나는 더 지니어스에서 ${CURRENT_SHARE.name} 타입!\n${CURRENT_SHARE.type} · 플레이 스타일 유사도 ${CURRENT_SHARE.score}점\n\n너는 누구일까?\n${CURRENT_SHARE.url}`;
}
function setShareStatus(msg,type='ok'){
  const el=document.getElementById('share-status');
  if(!el)return;
  el.textContent=msg;
  el.className=`share-status small ${type}`;
  el.hidden=false;
  clearTimeout(setShareStatus._t);
  setShareStatus._t=setTimeout(()=>{if(el){el.textContent='';el.hidden=true}},3600);
}
function setShareBusy(busy){
  const btn=document.getElementById('share-primary-btn');
  if(!btn)return;
  btn.disabled=busy;
  btn.textContent=busy?'공유창 여는 중…':'결과 공유하기';
}
function showManualShare(payload){
  let box=document.getElementById('share-fallback-box');
  if(!box){
    box=document.createElement('div');
    box.id='share-fallback-box';
    box.className='share-fallback-box';
    box.innerHTML=`<div class="share-fallback-head"><b>직접 공유하기</b><button type="button" class="share-close" onclick="document.getElementById('share-fallback-box')?.remove()">닫기</button></div><p class="small">아래 내용을 길게 눌러 복사한 뒤 원하는 앱에 붙여넣으세요.</p><textarea id="share-fallback-text" readonly></textarea>`;
    document.body.appendChild(box);
  }
  const ta=document.getElementById('share-fallback-text');
  if(ta){ta.value=payload;ta.focus();ta.select()}
}
async function copyResultLink(opts={}){
  if(!CURRENT_SHARE)return false;
  const payload=shareText();
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(payload);
    }else{
      throw new Error('clipboard-api-unavailable');
    }
    setShareStatus(opts.fallback?'공유창을 열 수 없어 결과와 링크를 복사했습니다. 원하는 앱에 붙여넣으세요.':'결과와 링크를 복사했습니다.','ok');
    analyticsEvent('share_copy',{method:opts.fallback?'share_fallback_clipboard':'clipboard'});
    return true;
  }catch(err){
    const ta=document.createElement('textarea');
    ta.value=payload;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    ta.style.top='0';
    document.body.appendChild(ta);
    ta.focus();ta.select();
    let copied=false;
    try{copied=document.execCommand('copy')}catch(e){}
    ta.remove();
    if(copied){
      setShareStatus(opts.fallback?'공유창을 열 수 없어 결과와 링크를 복사했습니다. 원하는 앱에 붙여넣으세요.':'결과와 링크를 복사했습니다.','ok');
      analyticsEvent('share_copy',{method:'legacy_clipboard'});
      return true;
    }
    setShareStatus('자동 복사가 지원되지 않는 브라우저입니다. 아래 공유 내용을 직접 복사해 주세요.','error');
    showManualShare(payload);
    return false;
  }
}
async function shareCurrentResult(){
  if(!CURRENT_SHARE)return;
  const payload=shareText();
  const data={title:`내 더 지니어스 결과: ${CURRENT_SHARE.name}`,text:payload};
  setShareBusy(true);
  try{
    if(typeof navigator.share==='function'){
      if(typeof navigator.canShare==='function'&&!navigator.canShare(data)){
        await copyResultLink({fallback:true});
        return;
      }
      try{
        await navigator.share(data);
        setShareStatus('공유를 완료했습니다.','ok');
        analyticsEvent('share_native',{method:'web_share'});
        return;
      }catch(err){
        if(err&&err.name==='AbortError'){
          setShareStatus('공유를 취소했습니다.','muted');
          return;
        }
        console.warn('Native share failed',err);
      }
    }
    await copyResultLink({fallback:true});
  }finally{
    setShareBusy(false);
  }
}
function submitSelfRating(rating){
  if(RATING_SENT)return;
  const n=Number(rating);
  if(n<1||n>5)return;
  RATING_SENT=true;
  analyticsEvent('self_rating',{rating:n});
  document.querySelectorAll('.rating-btn').forEach((b,i)=>{
    b.disabled=true;
    if(i+1===n)b.classList.add('selected');
  });
  const el=document.getElementById('rating-status');
  if(el)el.textContent='응답을 저장했습니다.';
}
const TRAIT_TEXT={
  '구조통찰':['판 읽기','규칙과 구조를 먼저 읽는 편','사람과 흐름을 먼저 보는 편'],
  '정밀성':['정확성','끝까지 정확하게 확인하는 편','빠른 판단과 실행을 중시하는 편'],
  '창의성':['새로운 해법','정석 밖의 새로운 길을 찾는 편','검증된 방법을 활용하는 편'],
  '사회게임':['사람 활용','관계와 심리를 적극 활용하는 편','사람보다 게임 자체와 내 판단에 집중하는 편'],
  '거래성향':['협상·거래','정보와 자원을 거래 카드로 쓰는 편','거래보다 직접 활용하는 편'],
  '유연성':['상황 대응','상황이 바뀌면 계획도 빠르게 바꾸는 편','핵심 계획을 유지하며 수정하는 편'],
  '리더십':['주도성','앞에서 방향을 잡고 사람을 움직이는 편','필요한 역할에 집중하고 주도권은 덜 잡는 편'],
  '동맹안정':['동맹 스타일','약속과 동맹을 오래 유지하는 편','상황에 따라 동맹을 바꿀 수 있는 편'],
  '위험선호':['승부수','큰 보상을 위해 위험도 감수하는 편','확실하고 안정적인 선택을 선호하는 편'],
  '대립성':['견제 방식','강한 상대를 먼저 견제하는 편','불필요한 적을 만들지 않는 편'],
  '독립성':['독자 플레이','혼자 판단하고 실행하는 편','믿을 사람과 함께 움직이는 편'],
  '압박안정':['위기 대응','위기일수록 차분하게 정리하는 편','위기일수록 빠르게 결단하는 편']
};
function traitCard(t,v){const x=TRAIT_TEXT[t]||[t,t+'이 강한 편',t+'이 낮은 편'];return `<div class="pill"><div class="small">${x[0]}</div><b>${v>=0?x[1]:x[2]}</b></div>`}
const ALLY_LABEL={
  '구조통찰':'판 구조 분석','정밀성':'정확한 계산','창의성':'새로운 해법',
  '사회게임':'사람 사이 조율','거래성향':'협상과 거래','유연성':'변수 대응',
  '리더십':'방향을 잡는 역할','동맹안정':'안정적인 동맹 유지',
  '위험선호':'승부 타이밍','대립성':'상대 견제','독립성':'독자 실행',
  '압박안정':'위기 상황 대응'
};
function avg(xs){return xs.reduce((s,x)=>s+x,0)/Math.max(1,xs.length)}
function allyScore(baseName,candName){
  const A=C[baseName][1].map(x=>x/100),D=C[candName][1].map(x=>x/100);
  const ix=t=>T.indexOf(t);
  const cohesion=['사회게임','동맹안정','위험선호','대립성','압박안정'];
  const complement=['구조통찰','정밀성','창의성','사회게임','거래성향','유연성','리더십'];
  const close=1-avg(cohesion.map(t=>Math.abs(A[ix(t)]-D[ix(t)])));
  const reliable=avg(['동맹안정','압박안정'].map(t=>D[ix(t)]));
  const fill=Math.min(1,avg(complement.map(t=>Math.max(0,D[ix(t)]-A[ix(t)])*(1-A[ix(t)])))*4);
  const friction=avg(['리더십','대립성','독립성'].map(t=>A[ix(t)]*D[ix(t)]));
  return .38*close+.32*reliable+.24*fill-.06*friction;
}
function bestAlly(baseName,exclude=[]){
  return names.filter(n=>n!==baseName&&!exclude.includes(n))
    .map(n=>[n,allyScore(baseName,n)]).sort((a,b)=>b[1]-a[1])[0][0];
}
function allyReason(baseName,candName){
  const A=C[baseName][1],D=C[candName][1];
  const pool=['구조통찰','정밀성','창의성','사회게임','거래성향','유연성','리더십','동맹안정','압박안정'];
  const ranked=pool.map(t=>[t,(D[T.indexOf(t)]-A[T.indexOf(t)])*.7+D[T.indexOf(t)]*.3])
    .sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>ALLY_LABEL[x[0]]);
  return `플레이 스타일 모델상 ${ranked[0]}과 ${ranked[1]}에서 역할을 나누기 좋은 조합입니다.`;
}
function result(){const s=scores(),top=s[0],similar=s[1],last=s[s.length-1],gap=s[0][1]-s[1][1],u=unit(e);const dominant=T.map((t,j)=>[t,u[j]]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,4);const used=extra.length>0;const ally=bestAlly(top[0],[similar[0],last[0]]);setShareResult(top[0],C[top[0]][0],matchDisplay(top[1]));
  const completedAt=new Date().toISOString(),startedAt=TEST_STARTED_AT||completedAt,params=new URLSearchParams(location.search);
  analyticsSaveRun({
    id:ANALYTICS_RUN_ID,
    schema_version:1,
    test_version:'v2.4',
    started_at:startedAt,
    completed_at:completedAt,
    duration_ms:Math.max(0,Date.now()-new Date(startedAt).getTime()),
    base_answers:baseAnswers,
    adaptive_answers:adaptiveAnswers,
    adaptive_used:used,
    adaptive_key:Array.isArray(extraKey)?extraKey.join(','):(extraKey?String(extraKey):null),
    top1:top[0],top1_score:matchDisplay(top[1]),
    top2:similar[0],top2_score:matchDisplay(similar[1]),
    score_gap:Number(gap.toFixed(5)),
    similar_player:similar[0],
    ally_player:ally,
    opposite_player:last[0],
    dominant_traits:dominant.map(([t,v])=>({trait:t,direction:v>=0?'high':'low',value:Number(v.toFixed(4))})),
    utm_source:params.get('utm_source'),
    utm_medium:params.get('utm_medium'),
    utm_campaign:params.get('utm_campaign')
  });
  app.innerHTML=`
<div class="card">
  <div class="result-top">
    ${playerPhoto(top[0],'player-photo-lg')}
    <div class="result-copy">
      <div class="small">당신과 가장 닮은 플레이어</div>
      <div class="big">${top[0]}</div>
      <div class="result-type">${C[top[0]][0]}</div>
      <p class="result-desc">${C[top[0]][2]}</p>
      <div class="score-label small">플레이 스타일 유사도</div>
      <div class="score">${matchDisplay(top[1])}<span class="small">점</span></div>
    </div>
  </div>
  <h2 class="section-title">내 플레이의 핵심 특징</h2>
  <div class="grid">${dominant.map(([t,v])=>traitCard(t,v)).join('')}</div>
  <div class="share-panel">
    <button id="share-primary-btn" class="primary share-primary" onclick="shareCurrentResult()">결과 공유하기</button>
    <button class="share-secondary" onclick="copyResultLink()">결과 + 링크 복사</button>
    <div id="share-status" class="share-status small" aria-live="polite" hidden></div>
  </div>
</div>
<div class="result-pair-grid">
  <div class="card mini-result-card">
    <div class="small">나와 비슷한 또 다른 플레이어</div>
    <div class="mini-player">
      ${playerPhoto(similar[0],'player-photo-md')}
      <div>
        <div class="mini-name">${similar[0]}</div>
        <div class="result-type mini-type">${C[similar[0]][0]}</div>
        <div class="mini-score">유사도 ${matchDisplay(similar[1])}점</div>
      </div>
    </div>
  </div>
  <div class="card mini-result-card ally-card">
    <div class="small">나와 팀으로 잘 맞을 플레이어</div>
    <div class="mini-player">
      ${playerPhoto(ally,'player-photo-md')}
      <div>
        <div class="mini-name">${ally}</div>
        <div class="result-type mini-type">${C[ally][0]}</div>
      </div>
    </div>
    <p class="ally-reason">${allyReason(top[0],ally)}</p>
  </div>
</div>
<div class="card rating-card">
  <h2>이 결과가 나와 얼마나 비슷한가요?</h2>
  <div class="rating-row" aria-label="결과 만족도">
    ${[1,2,3,4,5].map(n=>`<button class="rating-btn" onclick="submitSelfRating(${n})" aria-label="${n}점">${n}</button>`).join('')}
  </div>
  <div class="rating-scale small"><span>전혀 아님</span><span>매우 비슷함</span></div>
  <div id="rating-status" class="small rating-status" aria-live="polite"></div>
</div>
<div class="card">
  <div class="small">나와 플레이 방식이 가장 다른 사람</div>
  <div class="opposite-row">
    ${playerPhoto(last[0],'player-photo-md')}
    <div>
      <div class="big">${last[0]}</div>
      <div class="result-type">${C[last[0]][0]}</div>
      <p>${C[last[0]][2]}</p>
    </div>
  </div>
</div>
<div class="result-restart">
  <button class="primary" onclick="location.reload()">다시 테스트하기</button>
</div>`}
start();