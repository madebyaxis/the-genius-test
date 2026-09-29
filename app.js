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
function start(){app.innerHTML=`<div class="card hero-card"><div class="hero-content"><div class="small">THE GENIUS CHARACTER TEST · v2.7</div><h1>나는 더 지니어스에서 누구일까?</h1><p class="muted">12개의 게임 상황에서 당신이라면 어떻게 플레이할지 선택하세요. 결과가 비슷할 때만 판별 질문 2개가 추가됩니다.</p><div class="notice small">결과는 지능·인성 평가가 아니라 방송 속 의사결정 패턴과의 유사도를 비교합니다.</div><button class="primary hero-start" onclick="beginTest()">테스트 시작</button><div class="small hero-note">AI로 제작한 팬 테스트 비주얼을 사용합니다.</div><div class="small privacy-note">테스트 개선을 위해 개인을 식별하지 않는 익명 응답 통계를 저장합니다.</div>${instagramShareHint()}</div></div>`}
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
let CURRENT_SHARE=null,CURRENT_STORY=null;
function canonicalUrl(){return location.origin+location.pathname}
function setShareResult(name,type,score){
  CURRENT_SHARE={name,type,score,url:canonicalUrl()};
}
function setStoryResult(data){CURRENT_STORY=data}

function shareText(includeUrl=true){
  if(!CURRENT_SHARE)return '';
  const base=`나는 더 지니어스에서 ${CURRENT_SHARE.name} 타입!\n${CURRENT_SHARE.type} · 플레이 스타일 유사도 ${CURRENT_SHARE.score}점\n\n너는 누구일까?`;
  return includeUrl?`${base}\n${CURRENT_SHARE.url}`:base;
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
function storyFileName(){
  const safe=(CURRENT_STORY?.name||'result').replace(/[^0-9A-Za-z가-힣_-]+/g,'-');
  return `the-genius-${safe}-story.png`;
}
function loadCanvasImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=src;
  });
}
function canvasRoundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}
function canvasCover(ctx,img,x,y,w,h){
  const s=Math.max(w/img.width,h/img.height);
  const sw=w/s,sh=h/s,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function wrapCanvasText(ctx,text,maxWidth){
  const words=String(text).split(/\s+/),lines=[];let line='';
  for(const word of words){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test;
  }
  if(line)lines.push(line);
  return lines;
}
async function createStoryBlob(){
  if(!CURRENT_STORY)throw new Error('story-result-missing');
  if(document.fonts?.ready)try{await document.fonts.ready}catch(e){}
  const W=1080,H=1920,canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#15120e');bg.addColorStop(.42,'#0b0d10');bg.addColorStop(1,'#121419');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(780,220,20,780,220,620);
  glow.addColorStop(0,'rgba(196,151,83,.22)');glow.addColorStop(1,'rgba(196,151,83,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='rgba(211,177,110,.15)';ctx.lineWidth=2;
  for(let i=0;i<8;i++){
    ctx.beginPath();ctx.moveTo(760+i*42,-40);ctx.lineTo(1080,290+i*72);ctx.stroke();
  }
  ctx.fillStyle='#d6b16e';ctx.font='700 28px system-ui, -apple-system, sans-serif';ctx.letterSpacing='4px';
  ctx.fillText('THE GENIUS · PLAYER MATCH',72,105);
  ctx.fillStyle='#f4efe7';ctx.font='800 48px system-ui, -apple-system, sans-serif';
  ctx.fillText('나는 더 지니어스에서',72,190);

  const portrait=await loadCanvasImage(PLAYER_IMG[CURRENT_STORY.name]);
  const px=72,py=255,pw=420,ph=420;
  ctx.save();canvasRoundRect(ctx,px,py,pw,ph,38);ctx.clip();canvasCover(ctx,portrait,px,py,pw,ph);ctx.restore();
  ctx.strokeStyle='rgba(214,177,110,.62)';ctx.lineWidth=3;canvasRoundRect(ctx,px,py,pw,ph,38);ctx.stroke();

  ctx.fillStyle='#aeb4bd';ctx.font='650 28px system-ui, -apple-system, sans-serif';ctx.fillText('가장 닮은 플레이어',540,300);
  ctx.fillStyle='#ffffff';ctx.font='900 76px system-ui, -apple-system, sans-serif';ctx.fillText(CURRENT_STORY.name,540,392);
  ctx.fillStyle='#e0c99f';ctx.font='750 34px system-ui, -apple-system, sans-serif';
  wrapCanvasText(ctx,CURRENT_STORY.type,450).slice(0,2).forEach((line,i)=>ctx.fillText(line,540,448+i*44));
  ctx.fillStyle='#858c95';ctx.font='650 25px system-ui, -apple-system, sans-serif';ctx.fillText('플레이 스타일 유사도',540,575);
  ctx.fillStyle='#f2e6d1';ctx.font='900 92px system-ui, -apple-system, sans-serif';ctx.fillText(String(CURRENT_STORY.score),540,665);
  ctx.fillStyle='#aeb4bd';ctx.font='700 30px system-ui, -apple-system, sans-serif';ctx.fillText('점',665,665);

  ctx.fillStyle='#f4efe7';ctx.font='800 36px system-ui, -apple-system, sans-serif';ctx.fillText('내 플레이의 핵심 특징',72,765);
  const traits=CURRENT_STORY.traits||[];
  traits.slice(0,4).forEach((t,i)=>{
    const x=72+(i%2)*474,y=810+Math.floor(i/2)*132,w=438,h=104;
    ctx.fillStyle='rgba(255,255,255,.055)';canvasRoundRect(ctx,x,y,w,h,22);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=2;canvasRoundRect(ctx,x,y,w,h,22);ctx.stroke();
    ctx.fillStyle='#aeb4bd';ctx.font='650 22px system-ui, -apple-system, sans-serif';ctx.fillText(t.label,x+24,y+34);
    ctx.fillStyle='#f4efe7';ctx.font='750 27px system-ui, -apple-system, sans-serif';
    const lines=wrapCanvasText(ctx,t.text,w-48).slice(0,2);
    lines.forEach((line,j)=>ctx.fillText(line,x+24,y+70+j*30));
  });

  const cardY=1110,cardW=438,cardH=210;
  [
    {x:72,label:'비슷한 또 다른 플레이어',name:CURRENT_STORY.similar,type:CURRENT_STORY.similarType},
    {x:570,label:'나와 팀으로 잘 맞는 플레이어',name:CURRENT_STORY.ally,type:CURRENT_STORY.allyType}
  ].forEach((d,i)=>{
    ctx.fillStyle=i?'rgba(87,67,37,.22)':'rgba(255,255,255,.045)';canvasRoundRect(ctx,d.x,cardY,cardW,cardH,26);ctx.fill();
    ctx.strokeStyle=i?'rgba(214,177,110,.30)':'rgba(255,255,255,.10)';ctx.lineWidth=2;canvasRoundRect(ctx,d.x,cardY,cardW,cardH,26);ctx.stroke();
    ctx.fillStyle='#9fa6af';ctx.font='650 21px system-ui, -apple-system, sans-serif';ctx.fillText(d.label,d.x+26,cardY+42);
    ctx.fillStyle='#ffffff';ctx.font='850 46px system-ui, -apple-system, sans-serif';ctx.fillText(d.name,d.x+26,cardY+105);
    ctx.fillStyle='#d9c39d';ctx.font='650 23px system-ui, -apple-system, sans-serif';
    wrapCanvasText(ctx,d.type,cardW-52).slice(0,2).forEach((line,j)=>ctx.fillText(line,d.x+26,cardY+148+j*29));
  });

  ctx.fillStyle='rgba(255,255,255,.06)';canvasRoundRect(ctx,72,1380,936,265,28);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=2;canvasRoundRect(ctx,72,1380,936,265,28);ctx.stroke();
  ctx.fillStyle='#d6b16e';ctx.font='800 26px system-ui, -apple-system, sans-serif';ctx.fillText('PLAY STYLE',104,1430);
  ctx.fillStyle='#f4efe7';ctx.font='750 31px system-ui, -apple-system, sans-serif';
  const descLines=wrapCanvasText(ctx,CURRENT_STORY.desc,870).slice(0,4);
  descLines.forEach((line,i)=>ctx.fillText(line,104,1485+i*48));

  ctx.fillStyle='#f4efe7';ctx.font='850 36px system-ui, -apple-system, sans-serif';ctx.fillText('너는 누구일까?',72,1740);
  ctx.fillStyle='#aeb4bd';ctx.font='600 24px system-ui, -apple-system, sans-serif';ctx.fillText('madebyaxis.github.io/the-genius-test/',72,1784);
  ctx.fillStyle='#737a84';ctx.font='550 20px system-ui, -apple-system, sans-serif';ctx.fillText('비공식 팬 테스트 · 플레이 방식의 상대적 유사도',72,1835);
  ctx.textAlign='right';ctx.fillStyle='#d6b16e';ctx.font='750 22px system-ui, -apple-system, sans-serif';ctx.fillText('MADE BY AXIS',1008,1835);ctx.textAlign='left';

  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('png-failed')),'image/png',1));
}
function revokeStoryPreview(){
  const box=document.getElementById('story-preview');
  if(box?.dataset.url)URL.revokeObjectURL(box.dataset.url);
  box?.remove();
}
function showStoryPreview(blob){
  revokeStoryPreview();
  closeShareSheet();
  const url=URL.createObjectURL(blob);
  const overlay=document.createElement('div');
  overlay.id='story-preview';
  overlay.className='story-preview-overlay';
  overlay.dataset.url=url;
  overlay.innerHTML=`
    <div class="story-preview-modal">
      <div class="story-preview-head">
        <div><div class="small">1080 × 1920</div><b>스토리용 결과 카드</b></div>
        <button class="share-close" type="button" onclick="revokeStoryPreview()">닫기</button>
      </div>
      <div class="story-preview-frame"><img src="${url}" alt="더 지니어스 테스트 스토리용 결과 카드"></div>
      <div class="story-preview-actions">
        <button class="primary" type="button" onclick="saveStoryImage()">이미지 저장</button>
        <button type="button" onclick="shareStoryImage(true)">공유 앱 열기</button>
      </div>
      <p class="small story-help">${isInstagramInApp()?'Instagram 앱 안에서는 공유 API가 제한될 수 있습니다. 이미지가 저장되지 않으면 카드를 길게 눌러 저장하거나 우측 상단 메뉴에서 외부 브라우저로 연 뒤 다시 시도하세요.':'Instagram 스토리에서는 이 이미지를 선택한 뒤 링크 스티커에 테스트 주소를 붙이면 됩니다.'}</p>
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)revokeStoryPreview()});
  document.body.appendChild(overlay);
}
async function saveStoryImage(){
  try{
    const blob=await createStoryBlob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=storyFileName();a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    analyticsEvent('share_native',{method:'story_image_save'});
    setShareStatus('스토리 이미지를 저장했습니다.','ok');
  }catch(err){
    console.warn('Story image save failed',err);
    setShareStatus('이미지 저장에 실패했습니다. 미리보기에서 길게 눌러 저장해 주세요.','error');
  }
}
async function shareStoryImage(fromPreview=false){
  if(!CURRENT_STORY)return;
  setShareBusy(true);
  try{
    const blob=await createStoryBlob();
    const file=new File([blob],storyFileName(),{type:'image/png'});
    if(!isInstagramInApp()&&typeof navigator.share==='function'){
      let can=true;
      if(typeof navigator.canShare==='function'){
        try{can=navigator.canShare({files:[file]})}catch(e){can=false}
      }
      if(can){
        try{
          await navigator.share({files:[file],title:`내 더 지니어스 결과: ${CURRENT_STORY.name}`,text:'내 더 지니어스 플레이 스타일 결과'});
          analyticsEvent('share_native',{method:'story_image_share'});
          setShareStatus('스토리 이미지를 공유했습니다.','ok');
          if(fromPreview)revokeStoryPreview();
          return;
        }catch(err){
          if(err?.name==='AbortError')return;
          console.warn('Story file share failed',err);
        }
      }
    }
    showStoryPreview(blob);
    analyticsEvent('share_native',{method:'story_image_preview'});
  }catch(err){
    console.warn('Story image generation failed',err);
    setShareStatus('스토리 이미지를 만들지 못했습니다. 다시 시도해 주세요.','error');
  }finally{
    setShareBusy(false);
  }
}
async function makeStoryImage(){
  await shareStoryImage(false);
}
function isInstagramInApp(){
  return /Instagram/i.test(navigator.userAgent||'');
}
function instagramShareHint(){
  return isInstagramInApp()?'<div class="instagram-browser-note small">Instagram 앱 안에서는 시스템 공유가 제한될 수 있어요. 결과 화면에서는 링크 복사를 우선 지원합니다.</div>':'';
}
function showInstagramBrowserHelp(){
  closeShareSheet();
  let box=document.getElementById('instagram-help-box');
  if(box)box.remove();
  box=document.createElement('div');
  box.id='instagram-help-box';
  box.className='share-fallback-box';
  box.innerHTML=`<div class="share-fallback-head"><b>Instagram 브라우저에서 공유하기</b><button type="button" class="share-close" onclick="document.getElementById('instagram-help-box')?.remove()">닫기</button></div><p class="small">가장 안정적인 방법은 <b>결과 + 링크 복사</b> 후 원하는 앱에 붙여넣는 것입니다. 외부 브라우저가 필요하면 Instagram 우측 상단 메뉴에서 ‘브라우저에서 열기’를 사용하세요.</p>`;
  document.body.appendChild(box);
}
function setShareBusy(busy){
  const btn=document.getElementById('share-primary-btn');
  if(!btn)return;
  btn.disabled=busy;
  btn.textContent=busy?'공유창 여는 중…':'결과 공유하기';
}
function closeShareSheet(){
  document.getElementById('share-sheet')?.remove();
}
function openShareSheet(){
  if(!CURRENT_SHARE)return;
  closeShareSheet();
  const overlay=document.createElement('div');
  overlay.id='share-sheet';
  overlay.className='share-sheet-overlay';
  const instagram=isInstagramInApp();
  const actions=instagram
    ? `<button class="share-choice primary" type="button" onclick="makeStoryImage()">스토리용 이미지 만들기 <span>1080 × 1920 PNG</span></button>
       <button class="share-choice" type="button" onclick="copyResultLink({instagram:true});closeShareSheet()">결과 + 링크 복사</button>
       <button class="share-choice" type="button" onclick="showInstagramBrowserHelp()">외부 브라우저로 여는 방법</button>`
    : `<button class="share-choice primary" type="button" onclick="makeStoryImage()">스토리 이미지 공유 <span>Instagram · 카카오톡 등</span></button>
       <button class="share-choice" type="button" onclick="nativeShareResult()">텍스트 + 링크 공유</button>
       <div class="share-choice-grid">
         <button class="share-choice" type="button" onclick="shareToX()">X에 공유</button>
         <button class="share-choice" type="button" onclick="shareToThreads()">Threads에 공유</button>
       </div>
       <button class="share-choice" type="button" onclick="copyResultLink();closeShareSheet()">결과 + 링크 복사</button>`;
  overlay.innerHTML=`
    <div class="share-sheet" role="dialog" aria-modal="true" aria-label="결과 공유">
      <div class="share-sheet-head">
        <div>
          <div class="small">${instagram?'Instagram 브라우저 공유':'결과 공유'}</div>
          <b>${CURRENT_SHARE.name} · ${CURRENT_SHARE.score}점</b>
        </div>
        <button class="share-close" type="button" onclick="closeShareSheet()">닫기</button>
      </div>
      ${actions}
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeShareSheet()});
  document.body.appendChild(overlay);
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
  const payload=shareText(true);
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
async function nativeShareResult(){
  if(!CURRENT_SHARE)return;
  closeShareSheet();
  setShareBusy(true);
  try{
    if(typeof navigator.share==='function'){
      try{
        await navigator.share({
          title:`내 더 지니어스 결과: ${CURRENT_SHARE.name}`,
          text:shareText(false),
          url:CURRENT_SHARE.url
        });
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
function shareToX(){
  if(!CURRENT_SHARE)return;
  const url='https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText(true));
  closeShareSheet();
  window.open(url,'_blank','noopener,noreferrer');
  analyticsEvent('share_native',{method:'x_intent'});
  setShareStatus('X 공유 화면을 열었습니다.','ok');
}
function shareToThreads(){
  if(!CURRENT_SHARE)return;
  const url='https://www.threads.net/intent/post?text='+encodeURIComponent(shareText(true));
  closeShareSheet();
  window.open(url,'_blank','noopener,noreferrer');
  analyticsEvent('share_native',{method:'threads_intent'});
  setShareStatus('Threads 공유 화면을 열었습니다.','ok');
}
function shareCurrentResult(){
  openShareSheet();
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
  setStoryResult({
    name:top[0],
    type:C[top[0]][0],
    desc:C[top[0]][2],
    score:matchDisplay(top[1]),
    traits:dominant.map(([t,v])=>({label:(TRAIT_TEXT[t]||[t])[0],text:(TRAIT_TEXT[t]||[t,t,t])[v>=0?1:2]})),
    similar:similar[0],
    similarType:C[similar[0]][0],
    ally,
    allyType:C[ally][0]
  });
  const completedAt=new Date().toISOString(),startedAt=TEST_STARTED_AT||completedAt,params=new URLSearchParams(location.search);
  analyticsSaveRun({
    id:ANALYTICS_RUN_ID,
    schema_version:1,
    test_version:'v2.7',
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
    <button class="share-secondary story-direct-btn" onclick="makeStoryImage()">스토리 이미지 만들기</button>
    <button class="share-secondary share-copy-direct" onclick="copyResultLink()">결과 + 링크 복사</button>
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