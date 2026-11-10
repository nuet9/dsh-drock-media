import {z} from 'zod';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {waitForMedia} from './wait.js';
import {renderMedia,mediaImageMarkdown} from './render.js';
import {progressJobs} from './progress.js';
import {videoResponse} from './video-route.js';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {Media,spec,parameters} from './media.js';
export const inject=['storageDomain','connection','tools','credentials','attachments','fs','systemPrompt','timer','workingDirectory','agents'];
export async function apply(ctx){
 const domain=await ctx.storageDomain.open(spec(z));ctx.effect(()=>()=>domain.close());
 const address=k=>'drock-media/'+k;
 async function credential(kind){
  const r=await ctx.credentials.readRecord(address(kind));if(r?.kind==='api-key'&&r.key?.trim())return {value:r.key.trim(),source:'插件独立凭据'};
  const env=await ctx.credentials.resolve('DROCK_'+kind.toUpperCase()+'_API_KEY');if(env?.value?.trim())return {value:env.value.trim(),source:env.source};
  if(kind==='image'){
   try{const text=(await readFile(join(homedir(),'.dsh/integrations/drock-image-api-key.txt'),'utf8')).trim();if(text)return {value:text,source:'已配置的独立生图密钥文件'};}catch(e){if(e.code!=='ENOENT')throw e;}
   const old=await ctx.credentials.resolve('TYNUET9_5_API_KEY');if(old?.value?.trim())return {value:old.value.trim(),source:old.source};
  }
  if(kind==='mj'){const image=await credential('image');if(image)return {...image,source:'复用生图：'+image.source};}
 }
 const media=new Media(domain,{
  fetch:(...a)=>fetch(...a),credential:async k=>(await credential(k))?.value,
  credentialInfo:async k=>{const c=await credential(k);return {configured:!!c,source:c?.source||'未配置'};},
  setCredential:(k,key)=>ctx.credentials.modifyRecord(address(k),async()=>({kind:'api-key',key})),
  removeCredential:k=>ctx.credentials.deleteRecord(address(k)),
  readImage:async(p,signal)=>Buffer.from(await ctx.fs.readBytes(await ctx.fs.resolve(p,{signal}),signal,20*1024*1024)),
  async saveFile(data,type,name,sessionId,outputDirectory){
   const image=['png','jpg','webp'].includes(type);const ref=image?await ctx.attachments.saveImage({data,mediaType:'image/'+(type==='jpg'?'jpeg':type),name}):await ctx.attachments.saveFile({data,name});
   const attachmentPath=image?ctx.attachments.imageHostPath(ref):ctx.attachments.fileHostPath(ref);if(!attachmentPath)throw Error('保存成功但无法获取本机结果路径');
   const result={path:attachmentPath,bytes:ref.bytes,...(image?{imageRef:ref}:{fileRef:ref})};
   try{const agent=ctx.agents.get(sessionId);const cwd=outputDirectory??(agent?await ctx.workingDirectory.ensure(agent):undefined);if(!cwd)throw Error('所属会话未加载，保留附件等待恢复');const folder=join(cwd,'media-outputs',name.replace(/\.[^.]+$/,''));await mkdir(folder,{recursive:true});const path=join(folder,name);await writeFile(path,data);result.path=path;result.bytes=data.length;}catch(e){result.deliveryWarning='工作区副本保存失败，附件原件可用：'+String(e.message||e).slice(0,300);}
   return result;
  }
 });
 // One-time migration: attach legacy jobs to their recorded originating Turn.
 for(const agent of ctx.agents.list()){const old=[...media.jobs.entries()].map(([,j])=>j).filter(j=>j.sessionId===agent.id&&!Number.isInteger(j.turn));if(!old.length)continue;const turns=agent.session.snapshotEvents().filter(e=>e.type==='turn/start');for(const job of old){const time=Date.parse(job.createdAt);const start=turns.filter(e=>e.time<=time).at(-1);if(start){job.turn=start.data.turn;await media.jobs.put(job.requestId,job);}}}
 const disposers=[];let closing;const dispose=()=>closing??=(async()=>{for(const d of disposers.reverse())await d();await media.close();await domain.close();})();ctx.effect(()=>dispose);
 try{
  disposers.push(ctx.connection.fetch.register({path:'/api/drock-media/video',methods:['GET','HEAD'],requestBody:'buffered',async fetch(request){
   const rejection=ctx.connection.requestRejection({headers:request.headers});if(rejection)return new Response('Unauthorized',{status:rejection});
   const url=new URL(request.url),job=media.jobs.get(url.searchParams.get('requestId'));const index=Number(url.searchParams.get('index')??0);const file=job?.files?.[index];
   if(!job||job.kind!=='video'||!Number.isInteger(index)||index<0||!file?.path)return new Response('Video not found',{status:404});
   return videoResponse(request,file.path);
  }}));
  disposers.push(ctx.connection.fetch.register({path:'/api/drock-media',methods:['POST'],requestBody:'buffered',async fetch(request){
   const rejection=ctx.connection.requestRejection({headers:request.headers});if(rejection)return new Response('Unauthorized',{status:rejection});
   if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response('Expected JSON',{status:415});let envelope;try{envelope=await request.json();}catch{return new Response('Invalid JSON',{status:400});}
   if(envelope?.type!=='client-request'||typeof envelope.rpcId!=='string'||envelope.method!=='drock-media')return new Response('Invalid request',{status:400});
   let result;try{const a=envelope.payload;if(a?.action==='progress')return Response.json({type:'server-response',rpcId:envelope.rpcId,result:{ok:true,value:progressJobs(media,a.sessionId)}});if(!['get','save','credential','credential-remove','check','refresh'].includes(a?.action))throw Error('生成请从对话模型调用');result={ok:true,value:await media.execute(a,{signal:request.signal})};}catch(e){result={ok:false,error:{code:'DROCK_MEDIA_ERROR',message:String(e.message||e),details:{}}};}
   return Response.json({type:'server-response',rpcId:envelope.rpcId,result});
  }}));
  disposers.push(ctx.tools.register({name:'drock_media',description:'Generate images, Midjourney images and videos through the Drock company API using sidebar settings. Supports text generation, reference images, Seedance audiovisual references and task polling. generate waits up to 50s and returns a task record; wait continues an existing task without model polling round trips. Completed includes named local files and image previews, ready for immediate inline delivery. get discovers models/defaults; check verifies credentials without generating.',parameters,timeoutMs:300000,output:{schema:{type:'object',additionalProperties:true},render:renderMedia},async execute(a,exec){if(!exec.agent)throw Error('Session required');const context={sessionId:exec.agent.id,turn:ctx.agents.turnBoundaryOf(exec.agent.session).lastTurn,signal:exec.signal,outputDirectory:await ctx.workingDirectory.ensure(exec.agent,exec.signal)};let job=await media.execute(a.action==='wait'?{...a,action:'status'}:a,context);if(a.action==='generate'||a.action==='wait')job=await waitForMedia(job,()=>media.execute({action:'status',requestId:job.requestId},context),{signal:exec.signal});
   if(job?.status==='completed'){const stored=media.jobs.get(job.requestId);if(stored&&stored.sessionId===exec.agent.id){for(let i=0;i<stored.files.length;i++){const f=stored.files[i];if((!f.imageRef||f.deliveryWarning)&&stored.kind!=='video'){try{const data=Buffer.from(await ctx.fs.readBytes(await ctx.fs.resolve(f.path,{signal:exec.signal}),exec.signal,64*1024*1024));const type=data[0]===255?'jpg':data[0]===137?'png':'webp';stored.files[i]={index:f.index,...await media.s.saveFile(data,type,stored.requestId+'-'+(i+1)+'.'+type,stored.sessionId,context.outputDirectory)};}catch(e){f.deliveryWarning=String(e.message||e);}}}await media.jobs.put(stored.requestId,stored);job=media.publicJob(stored);}}if(job?.status==='completed'){job.previewMarkdown='';job.delivery='Media is displayed once by the plugin below its conversation turn. Reply briefly with a folder link; do not embed another image or video.';}return job;}}));
  disposers.push(ctx.systemPrompt.section({name:'drock-media',order:84,text:'Company image/video generation is available through drock_media using the sidebar 生图 / 生视频 settings. Keep the ordinary conversational model selected. When the user requests tx/image2.6/company images, MJ, Seedance or Hailuo, use this tool. User intent to generate authorizes the requested generation; obey explicit quantities. For tasks still running, query status until completed or report the exact pending state; submission is not completion. A background poller saves eventual results while Harness runs; after a restart query status to resume. generate waits up to 50 seconds internally; if still pending call wait on the SAME requestId directly, without shell sleeps or repeated get/check calls. On completion the plugin displays the image/video beneath its originating conversation turn. Reply briefly with a folder link only. Do not embed images/videos or present a second preview; the user explicitly prefers a single plugin preview. Inline Windows image destinations MUST be C:/... (no leading slash); /C:/... returns HTTP404 in the image API. Folder links still use /C:/.../. Never prepend a slash to previewMarkdown. Do not run read_image, copy/rename shell commands, or present just to prepare a normal image delivery: image previews and named files are already supplied. Inspect the image only if needed for a user-requested quality review. If submission outcome is unknown, inspect the original task instead of issuing a new paid request. Use image-api.mjs only when this plugin tool is unavailable.'}));
  let ticking=false;disposers.push(ctx.timer.interval(()=>{if(ticking)return;ticking=true;media.tick().catch(()=>{}).finally(()=>{ticking=false;});},15000));
 }catch(e){await dispose();throw e;}
}
