import {setTimeout} from 'node:timers/promises';
const pending=new Set(['queued','pending','running','processing','in_progress','downloading']);
export async function waitForMedia(job,poll,{signal,budgetMs=50000,intervalMs=5000,sleep=setTimeout,now=Date.now}={}){
 const end=now()+budgetMs;while(pending.has(job.status)&&now()<end){await sleep(Math.min(intervalMs,end-now()),undefined,{signal});if(now()>=end)break;job=await poll();}return job;
}
