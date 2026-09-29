const ANALYTICS_CONFIG={
  url:'https://qkiqlpmaaijnpaatjzsm.supabase.co',
  key:'sb_publishable_k96WC0-z5AOkYrHbLuukFg_HOJ9lPfn'
};
const ANALYTICS_RUN_ID=(crypto.randomUUID?crypto.randomUUID():('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})));
let ANALYTICS_SAVE_PROMISE=Promise.resolve(false);
let ANALYTICS_RUN_SAVED=false;
async function analyticsInsert(table,row){
  try{
    const res=await fetch(`${ANALYTICS_CONFIG.url}/rest/v1/${table}`,{
      method:'POST',
      headers:{
        'apikey':ANALYTICS_CONFIG.key,
        'Authorization':`Bearer ${ANALYTICS_CONFIG.key}`,
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify(row),
      keepalive:true
    });
    if(!res.ok) console.warn('Analytics insert failed',table,res.status);
    return res.ok;
  }catch(err){
    console.warn('Analytics unavailable',err);
    return false;
  }
}
function analyticsSaveRun(row){
  if(ANALYTICS_RUN_SAVED)return ANALYTICS_SAVE_PROMISE;
  ANALYTICS_RUN_SAVED=true;
  ANALYTICS_SAVE_PROMISE=analyticsInsert('test_runs',row);
  return ANALYTICS_SAVE_PROMISE;
}
async function analyticsEvent(eventType,eventValue={}){
  const saved=await ANALYTICS_SAVE_PROMISE;
  if(!saved)return false;
  return analyticsInsert('test_events',{
    run_id:ANALYTICS_RUN_ID,
    event_type:eventType,
    event_value:eventValue
  });
}
