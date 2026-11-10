export function upstreamProgress(j){
 const value=j?.progress??j?.data?.progress;const unit=j?.progress_unit??j?.data?.progress_unit;
 if(typeof value==='string'&&/^\d+(?:\.\d+)?%$/.test(value))return Math.min(100,Math.max(0,parseFloat(value)));
 if(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100)return unit==='fraction'?Math.min(100,value*100):value;
}
export function progressJobs(media,sessionId){
 if(typeof sessionId!=='string'||!sessionId)throw Error('需要会话标识');
 return {jobs:[...media.jobs.entries()].map(([,j])=>j).filter(j=>j.sessionId===sessionId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,60).map(j=>{const v=media.publicJob(j);delete v.outputDirectory;return v;})};
}
