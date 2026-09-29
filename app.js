const M={...CORE,questions:[...Q1,...Q2],adaptive:ADAPTIVE}; const T=M.traits,C=M.characters,Q=M.questions,A=M.adaptive,G=M.generic_adaptive,B=M.calibration_bias;
const names=Object.keys(C), nT=T.length;
const means=T.map((_,j)=>names.reduce((s,n)=>s+C[n][1][j],0)/names.length);
const sds=T.map((_,j)=>Math.sqrt(names.reduce((s,n)=>s+(C[n][1][j]-means[j])**2,0)/names.length)||1);
const CZ=names.map(n=>C[n][1].map((x,j)=>(x-means[j])/sds[j]));
const CZN=CZ.map(v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)});
let idx=0,e=Array(nT).fill(0),extra=[],extraMode=null,extraKey=null;
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
function prepareAdaptive(){const s=scores(),gap=s[0][1]-s[1][1]; if(gap>=.09) return false;const key=keyFor(s[0][0],s[1][0]);if(key){extra=A[key];extraMode='manual';extraKey=key;return true}const ia=names.indexOf(s[0][0]),ib=names.indexOf(s[1][0]);const dif=T.map((t,j)=>[j,Math.abs(CZ[ia][j]-CZ[ib][j])]).sort((a,b)=>b[1]-a[1]).slice(0,2);extra=dif.map(([j])=>G[T[j]]);extraMode='generic';extraKey=dif.map(x=>x[0]);return true}
function start(){app.innerHTML=`<div class="card hero-card"><div class="hero-content"><div class="small">THE GENIUS CHARACTER TEST · v1.8</div><h1>나는 더 지니어스에서 누구일까?</h1><p class="muted">12개의 게임 상황에서 당신이라면 어떻게 플레이할지 선택하세요. 결과가 비슷할 때만 판별 질문 2개가 추가됩니다.</p><div class="notice small">결과는 지능·인성 평가가 아니라 방송 속 의사결정 패턴과의 유사도를 비교합니다.</div><button class="primary hero-start" onclick="showQ()">테스트 시작</button><div class="small hero-note">AI로 제작한 팬 테스트 비주얼을 사용합니다.</div></div></div>`}
function currentQ(){return idx<Q.length?Q[idx]:extra[idx-Q.length]}
function showQ(){let q=currentQ();if(!q){if(idx===Q.length&&prepareAdaptive()){showQ();return}return result()} const total=Q.length+extra.length;const pct=Math.min(100,(idx+1)/Math.max(Q.length,total)*100);app.innerHTML=`<div class="meta small"><span>${idx<Q.length?'기본 분석':'정밀 판별'}</span><span>${idx+1}/${total}</span></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="card"><div class="q">${q.q}</div>${q.a.map((o,k)=>`<button onclick="pick(${k})">${o.t}</button>`).join('')}</div>`}
function pick(k){let q=currentQ(),v=centeredOptions(q)[k];addVector(v,idx<Q.length?1:2);idx++;showQ()}
function matchDisplay(raw){return Math.max(55,Math.min(97,Math.round(50+55*raw)))}
function confidenceLabel(gap,used){if(gap>=.18)return '결과가 뚜렷한 편';if(gap>=.10)return '비교적 뚜렷한 편';if(used&&gap>=.06)return '비슷한 후보가 있는 편';return '여러 유형이 섞인 편'}
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
function result(){const s=scores(),top=s[0],last=s[s.length-1],gap=s[0][1]-s[1][1],u=unit(e);const dominant=T.map((t,j)=>[t,u[j]]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,4);const used=extra.length>0;app.innerHTML=`
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
  <div class="small muted">이 점수는 실력이나 능력 평가가 아니라, 이 테스트에서 나타난 플레이 방식의 상대적 유사도입니다.</div>
  <div class="result-status">결과 구분: <span class="confidence">${confidenceLabel(gap,used)}</span>${used?' · 추가 판별 질문 반영':''}</div>
  <h2 class="section-title">내 플레이의 핵심 특징</h2>
  <div class="grid">${dominant.map(([t,v])=>traitCard(t,v)).join('')}</div>
</div>
<div class="card">
  <h2>나와 비슷한 플레이어 TOP 4</h2>
  <p class="muted small">점수가 높을수록 이번 답변에서 나타난 플레이 방식이 비슷합니다.</p>
  ${s.slice(0,4).map((x,j)=>`<div class="rank rank-player">${playerPhoto(x[0],'player-photo-sm')}<span class="rank-copy"><b>${j+1}. ${x[0]}</b><br><span class="small">${C[x[0]][0]}</span></span><b class="rank-score">${matchDisplay(x[1])}점</b></div>`).join('')}
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
  <p class="muted small">좋고 나쁨의 의미가 아니라, 이번 답변에서 나타난 의사결정 방식이 가장 반대쪽에 가깝다는 뜻입니다.</p>
</div>
<div class="card">
  <div class="small">테스트 안내</div>
  <p class="muted">비공식 팬 테스트입니다. 결과는 방송에서 관찰된 플레이 패턴을 바탕으로 만든 서비스용 모델이며, tvN이나 출연자의 공식 평가가 아닙니다.</p>
  <p class="muted small">인물 이미지는 실제 사진이 아니라 AI로 제작한 스타일 이미지입니다.</p>
  <button class="primary" onclick="location.reload()">다시 테스트하기</button>
</div>`}
start();