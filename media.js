import {createHash} from 'node:crypto';
import {upstreamProgress} from './progress.js';
import {BASE,catalog,defaults,kinds,validateSettings,resolveImageSize} from './catalog.js';
const hash=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
const terminal=new Set(['completed','failed','submission-unknown','submission-failed','polling-paused','expired']);
const items=j=>Array.isArray(j?.data)?j.data:Array.isArray(j?.data?.data)?j.data.data:Array.isArray(j?.result?.data)?j.result.data:[];
const idOf=j=>j.task_id??j.id??j.data?.task_id??j.data?.id;
const stateOf=j=>String(j.status??j.data?.status??'queued').toLowerCase();
export const parameters={type:'object',additionalProperties:false,required:['action'],properties:{
 action:{type:'string',enum:['get','generate','status','wait','check'],description:'get lists defaults/models and own recent tasks. generate submits a paid task. status queries/downloads an existing task. wait polls an existing task for up to 50 seconds without model round trips. check reads /models without generation charges.'},
 kind:{type:'string',enum:kinds,description:'image for GPT Image/Gemini; mj for Midjourney; video for Seedance/Hailuo.'},
 requestId:{type:'string',description:'Unique stable ID, 8–100 letters/digits/_/-. Required for generate. Reuse on retries to prevent duplicate charges.'},
 taskId:{type:'string',description:'For status only: import an existing company API task ID without generating again. Requires kind and requestId.'},
 model:{type:'string',description:'Optional model ID from get catalog; omitted uses saved default.'},
 prompt:{type:'string',description:'Generation instructions. MJ aspect ratio belongs in prompt, e.g. --ar 16:9.'},
 images:{type:'array',items:{type:'string'},description:'Reference image local PNG/JPEG/WebP paths, HTTPS URLs or data URIs. Image: max16. Seedance: max9. Hailuo:max2 first/last.'},
 videos:{type:'array',items:{type:'string'},description:'Seedance only, max3 HTTPS reference video URLs.'},
 audio:{type:'array',items:{type:'string'},description:'Seedance only, max3 HTTPS audio URLs; needs image/video.'},
 mask:{type:'string',description:'GPT Image only: hosted HTTPS mask URL with reference dimensions.'},
 n:{type:'integer',description:'Images 1–4, default1. MJ/video require1; invoke separately for explicitly requested additional outputs.'},
 quality:{type:'string',enum:['auto','low','medium','high'],description:'Image quality, defaults to settings.'},
 size:{type:'string',description:'Image dimensions e.g.1024x1024 or auto. Video resolution 480P/720P/768P/1080P or dimensions e.g.1280x720.'},
 seconds:{type:'integer',description:'Seedance4–15 seconds; Hailuo6/10 (1080p only6). Default from settings, model-specific fallback applied.'},
 ratio:{type:'string',enum:['16:9','9:16','1:1'],description:'Seedance aspect ratio, default16:9.'},
 imageMode:{type:'string',enum:['first_frame','first_last_frame','reference_image'],description:'Seedance reference handling; default first_frame. first_last_frame max2 images and no video/audio.'},
 generateAudio:{type:'boolean',description:'Seedance audio track, defaulttrue.'},
 seed:{type:'integer',description:'Seedance random seed.'}
}};
export function spec(z){return {name:'drock_media',version:1,tables:{settings:{valueSchema:z.record(z.string(),z.unknown())},jobs:{valueSchema:z.record(z.string(),z.unknown())}},global:{schema:z.object({initialized:z.boolean()}),initial:{initialized:true}}};}
export class Media{
 constructor(domain,services){this.domain=domain;this.s=services;this.settings=domain.table('settings');this.jobs=domain.table('jobs');this.active=new Map();this.generating=new Map();this.tail=Promise.resolve();this.controller=new AbortController();}
 config(){return {...defaults,...this.settings.get('defaults')};}
 publicJob(j){if(!j)return undefined;const {fingerprint,response,...v}=j;return v;}
 async recover(job){if(job.status==='submitting'&&!job.taskId&&!job.response&&!this.active.has(job.requestId)){job.status='submission-unknown';job.error='提交后运行中断，无法确认是否已计费；请核对官网任务，未自动重提';await this.jobs.put(job.requestId,job);}return job;}
 async view(sessionId){for(const [,job] of this.jobs.entries())await this.recover(job);return {settings:this.config(),catalog,credentials:Object.fromEntries(await Promise.all(kinds.map(async k=>[k,await this.s.credentialInfo(k)]))),jobs:[...this.jobs.entries()].map(([,j])=>j).filter(j=>!sessionId||j.sessionId===sessionId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30).map(j=>this.publicJob(j))};}
 serialize(fn){const p=this.tail.then(fn);this.tail=p.catch(()=>{});return p;}
 async execute(a,context={}){
  if(!a||typeof a!=='object')throw Error('Invalid request');context.signal?.throwIfAborted();
  if(a.action==='get')return this.view(context.sessionId);
  if(a.action==='save')return this.serialize(async()=>{const old=this.config();if(a.revision!==old.revision)throw Error('设置已被修改，请重新加载后保存 / Settings changed; reload');const next=validateSettings(a.settings);next.revision=old.revision+1;await this.settings.put('defaults',next);return this.view();});
  if(['credential','credential-remove','check'].includes(a.action)){
   if(!kinds.includes(a.kind))throw Error('请选择 image/mj/video');
   if(a.action==='credential'){if(typeof a.key!=='string'||!a.key.trim()||a.key.length>4096||/[\r\n]/.test(a.key))throw Error('密钥为空或格式错误');await this.s.setCredential(a.kind,a.key.trim());return this.view();}
   if(a.action==='credential-remove'){await this.s.removeCredential(a.kind);return this.view();}
   const info=await this.s.credentialInfo(a.kind);if(!info.configured)return {...info,message:'尚未配置密钥'};
   try{const j=await this.api('/models',undefined,a.kind,context.signal);const ids=(j.data||[]).map(v=>v.id).filter(v=>typeof v==='string');const supported=catalog.filter(v=>v.kind===a.kind&&ids.includes(v.id)).map(v=>v.id);return {...info,reachable:true,models:supported,message:'鉴权与模型目录可访问；不代表生成线路已实测'};}catch(e){return {...info,reachable:false,message:e.message};}
  }
  if(a.action==='status'||a.action==='refresh'){
   if(typeof a.requestId!=='string')throw Error('需要 requestId');let j=this.jobs.get(a.requestId);
   if(!j&&a.taskId){if(!kinds.includes(a.kind)||!context.sessionId)throw Error('导入任务需 kind 和会话');this.validId(a.requestId);if(!/^[a-zA-Z0-9_-]{1,200}$/.test(a.taskId))throw Error('Invalid task ID');j={requestId:a.requestId,kind:a.kind,model:a.model||this.config()[a.kind+'Model'],sessionId:context.sessionId,taskId:a.taskId,status:'queued',createdAt:new Date().toISOString(),files:[]};await this.jobs.put(a.requestId,j);}
   if(!j)throw Error('任务不存在');if(context.sessionId&&context.sessionId!==j.sessionId)throw Error('任务属于另一个会话');return this.poll(j,context.signal);
  }
  if(a.action!=='generate')throw Error('Unknown action');if(!context.sessionId)throw Error('生成需从对话调用');this.validId(a.requestId);
  const fingerprint=hash({...a,action:undefined,requestId:undefined}),pending=this.generating.get(a.requestId);if(pending){if(pending.sessionId!==context.sessionId||pending.fingerprint!==fingerprint)throw Error('requestId已用于其他请求，请检查原任务');return this.active.get(a.requestId);}
  const old=this.jobs.get(a.requestId);if(old){await this.recover(old);if(old.sessionId!==context.sessionId||old.fingerprint!==fingerprint)throw Error('requestId已用于其他请求，请检查原任务');return this.publicJob(old);}
  if(this.active.has(a.requestId))return this.active.get(a.requestId);
  const p=this.submit(a,context,fingerprint);this.active.set(a.requestId,p);this.generating.set(a.requestId,{fingerprint,sessionId:context.sessionId});try{return await p;}finally{this.active.delete(a.requestId);this.generating.delete(a.requestId);}
 }
 validId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(id))throw Error('requestId需要8–100位字母/数字/_/-');}
 async api(route,body,kind,signal){
  const key=await this.s.credential(kind);if(!key)throw Error('尚未配置 '+kind+' 密钥，请在侧栏生图/生视频设置中填写');
  const combined=AbortSignal.any([this.controller.signal,...(signal?[signal]:[]),AbortSignal.timeout(body&&kind==='mj'?240000:90000)]);
  const r=await this.s.fetch(BASE+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:combined});
  const text=await r.text();let j;try{j=JSON.parse(text);}catch{throw Error('HTTP '+r.status+'：服务返回非JSON');}
  if(!r.ok||j.error){let message=String(j.error?.message??j.message??'服务请求失败').split(key).join('[redacted]').slice(0,1500);const code=j.error?.code??j.code;const e=Error('HTTP '+r.status+(code?' / '+code:'')+'：'+message);e.http=r.status;e.apiCode=code;throw e;}return j;
 }
 async image(value,signal){
  if(typeof value!=='string')throw Error('Invalid reference');if(/^https:\/\//.test(value))return value;
  if(value.startsWith('data:image/')){if(value.length>28e6||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))throw Error('图片data URI格式错误或超过20MiB');return value;}
  const b=await this.s.readImage(value,signal);const ext=imageType(b);if(!ext)throw Error('参考图须为PNG/JPEG/WebP');return 'data:image/'+(ext==='jpg'?'jpeg':ext)+';base64,'+Buffer.from(b).toString('base64');
 }
 async payload(a,signal){
  const c=this.config(),kind=a.kind??'image';if(!kinds.includes(kind))throw Error('未知生成类型');const model=a.model??c[kind+'Model'];if(!catalog.some(v=>v.kind===kind&&v.id===model))throw Error('模型不属于所选生成类型');
  if(typeof a.prompt!=='string'||!a.prompt.trim()||a.prompt.length>16000)throw Error('提示词需要1–16000字符');const n=a.n??1;if(!Number.isInteger(n)||n<1||n>4||(kind!=='image'&&n!==1))throw Error('普通图1–4张；MJ/视频每次仅提交1个任务');
  for(const key of ['images','videos','audio'])if(a[key]!==undefined&&!Array.isArray(a[key]))throw Error(key+' must be array');
  const images=a.images||[],videos=a.videos||[],audio=a.audio||[];if(images.length>(kind==='image'?16:kind==='mj'?16:model.startsWith('miniMax')?2:9)||videos.length>3||audio.length>3)throw Error('参考素材数量超过模型上限');
  const p={model,prompt:a.prompt.trim()};
  if(kind==='image'){
   if(videos.length||audio.length)throw Error('生图不支持视频/音频参考');p.n=n;p.background=true;p.size=resolveImageSize(a.size??c.imageSize);p.quality=a.quality??c.imageQuality;
   if(!/^(auto|[1-9][0-9]{2,3}x[1-9][0-9]{2,3})$/.test(p.size)||!['auto','low','medium','high'].includes(p.quality))throw Error('图片尺寸/质量不合法');
   if(a.mask){if(!model.startsWith('gpt-image')||!images.length||!/^https:\/\//.test(a.mask))throw Error('遮罩需要GPT Image参考图和HTTPS mask');p.mask_url=a.mask;}
  }else if(kind==='mj'){
   if(a.mask||a.size||a.quality||videos.length||audio.length)throw Error('MJ只支持提示词与参考图；宽高比写入提示词');
  }else{
   if(a.mask||a.quality)throw Error('视频不支持遮罩/图片质量参数');p.n=1;const hailuo=model.startsWith('miniMax');
   let size=a.size??(hailuo&&c.videoSize.toLowerCase()==='720p'?'768p':c.videoSize);let ratio=a.ratio??'16:9';const sizes={'854x480':['480p','16:9'],'480x854':['480p','9:16'],'1280x720':['720p','16:9'],'720x1280':['720p','9:16'],'1920x1080':['1080p','16:9'],'1080x1920':['1080p','9:16']};if(sizes[size]){if(!a.ratio)ratio=sizes[size][1];size=sizes[size][0];}p.resolution=String(size).toLowerCase();
   p.duration=a.seconds??(hailuo&&![6,10].includes(c.videoSeconds)?6:c.videoSeconds);
   if(hailuo){if(!['768p','1080p'].includes(p.resolution)||![6,10].includes(p.duration)||(p.resolution==='1080p'&&p.duration!==6)||videos.length||audio.length||a.ratio||a.imageMode||a.generateAudio!==undefined||a.seed!==undefined)throw Error('海螺支持最多2图；768P 6/10秒，1080P仅6秒；不支持Seedance专用参数');}
   else{
    if(!['480p','720p','1080p'].includes(p.resolution)||!Number.isInteger(p.duration)||p.duration<4||p.duration>15)throw Error('Seedance支持480/720/1080P、4–15秒');if(!['16:9','9:16','1:1'].includes(ratio))throw Error('Invalid ratio');p.ratio=ratio;p.image_mode=a.imageMode??'first_frame';
    if(!['first_frame','first_last_frame','reference_image'].includes(p.image_mode))throw Error('Invalid image mode');if(p.image_mode==='first_last_frame'&&(images.length>2||videos.length||audio.length))throw Error('首尾帧模式最多2图且不能含音视频');if(audio.length&&!images.length&&!videos.length)throw Error('音频需配合图片/视频参考');p.generate_audio=a.generateAudio??true;if(a.seed!==undefined)p.seed=a.seed;
   }
  }
  const refs=await Promise.all(images.map(async v=>({url:await this.image(v,signal),...(kind==='video'?{file_type:0}:{})})));
  for(const [type,list]of [[1,videos],[3,audio]])for(const url of list){if(typeof url!=='string'||!/^https:\/\//.test(url))throw Error('音视频参考须为HTTPS外链');refs.push({url,file_type:type});}
  if(refs.length)p.file_list=refs;return {kind,p};
 }
 async submit(a,context,fingerprint){
  const {kind,p}=await this.payload(a,context.signal);if(!(await this.s.credentialInfo(kind)).configured)throw Error('请先配置'+kind+'密钥');
  const job={requestId:a.requestId,kind,model:p.model,sessionId:context.sessionId,...(Number.isInteger(context.turn)?{turn:context.turn}:{}),fingerprint,status:'submitting',...(context.outputDirectory?{outputDirectory:context.outputDirectory}:{}),createdAt:new Date().toISOString(),files:[]};await this.jobs.put(job.requestId,job);
  let response;try{response=await this.api('/'+(kind==='video'?'videos':'images')+'/generations',p,kind,context.signal);}catch(e){job.status=e.http&&e.http<500?'submission-failed':'submission-unknown';job.error=e.message+'；未自动重提，请先核对官网任务以避免重复计费';await this.jobs.put(job.requestId,job);return this.publicJob(job);}
  job.taskId=idOf(response);job.status=stateOf(response);if(items(response).length)job.response=response;await this.jobs.put(job.requestId,job);
  try{return await this.consume(job,response,context.signal);}catch(e){job.error=e.message;job.status=job.taskId||job.response?'download-retry':'submission-unknown';await this.jobs.put(job.requestId,job);return this.publicJob(job);}
 }
 async consume(job,j,signal){
  const state=stateOf(j);const progress=upstreamProgress(j);if(progress!==undefined)job.progress=progress;job.updatedAt=new Date().toISOString();delete job.error;
  if(['failed','error','cancelled','canceled'].includes(state)){job.status='failed';job.error=String(j.error?.message??j.error??j.message??'上游任务失败').slice(0,1500);await this.jobs.put(job.requestId,job);return this.publicJob(job);}
  const list=items(j);if(list.length){job.response=j;job.status='downloading';await this.jobs.put(job.requestId,job);for(let i=0;i<list.length;i++){
   if(job.files.some(v=>v.index===i))continue;const item=list[i];let bytes;if(item.b64_json){if(item.b64_json.length>90e6)throw Error('图片返回内容过大');bytes=Buffer.from(item.b64_json,'base64');}else if(item.url){const url=new URL(item.url);if(url.protocol!=='https:')throw Error('仅下载HTTPS生成结果');const r=await this.s.fetch(url,{signal:AbortSignal.any([this.controller.signal,...(signal?[signal]:[]),AbortSignal.timeout(180000)])});if(!r.ok)throw Error('结果下载HTTP '+r.status);bytes=await boundedBytes(r,job.kind==='video'?512*1024*1024:64*1024*1024);}else throw Error('任务结果缺少URL/base64');
   const type=job.kind==='video'?videoType(bytes):imageType(bytes);if(!type)throw Error('生成结果文件类型校验失败');const file=await this.s.saveFile(bytes,type,job.requestId+'-'+(i+1)+'.'+type,job.sessionId,job.outputDirectory);job.files.push({index:i,...file});await this.jobs.put(job.requestId,job);
  }job.status='completed';job.progress=100;delete job.error;delete job.response;
  }else if(['completed','succeeded','success'].includes(state)){job.status='download-retry';job.error='任务完成但未返回可下载文件，请查询官网';}
  else if(!job.taskId){job.status='submission-unknown';job.error='返回中无任务ID和文件，未重提';}
  else job.status=['queued','pending','running','processing','in_progress'].includes(state)?state:'queued';
  await this.jobs.put(job.requestId,job);return this.publicJob(job);
 }
 async poll(job,signal){
  if(this.active.has(job.requestId))return this.active.get(job.requestId);if(job.status==='submitting'&&!job.taskId&&!job.response){await this.recover(job);return this.publicJob(job);}if(job.status==='completed'||job.status==='failed'||(!job.taskId&&!job.response))return this.publicJob(job);
  const p=(async()=>{try{if(Date.now()-Date.parse(job.pollingStartedAt??job.createdAt)>24*3600000){job.pollingStartedAt=new Date().toISOString();await this.jobs.put(job.requestId,job);}return await this.consume(job,job.response??await this.api('/'+(job.kind==='video'?'videos':'images')+'/tasks/'+encodeURIComponent(job.taskId),undefined,job.kind,signal),signal);}catch(e){job.error=e.message;job.status=String(e.apiCode)==='1610'?'expired':job.response?'download-retry':'refresh-error';job.updatedAt=new Date().toISOString();await this.jobs.put(job.requestId,job);return this.publicJob(job);}})();this.active.set(job.requestId,p);try{return await p;}finally{this.active.delete(job.requestId);}
 }
 async tick(){if(this.controller.signal.aborted)return;for(const [,job] of this.jobs.entries())await this.recover(job);const jobs=[...this.jobs.entries()].map(([,j])=>j).filter(j=>(j.taskId||j.response)&&!terminal.has(j.status)&&!this.active.has(j.requestId));for(const j of jobs.slice(0,3)){if(Date.now()-Date.parse(j.pollingStartedAt??j.createdAt)>24*3600000){j.status='polling-paused';j.error='任务超过24小时，自动查询已暂停，可手动刷新';await this.jobs.put(j.requestId,j);continue;}await this.poll(j,this.controller.signal);}}
 async close(){this.controller.abort();await Promise.allSettled([...this.active.values(),this.tail]);}
}
export function imageType(b){return b.length>8&&b[0]===137&&b.toString('ascii',1,4)==='PNG'?'png':b[0]===255&&b[1]===216?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':undefined;}
export function videoType(b){return b.toString('ascii',4,8)==='ftyp'?'mp4':b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163?'webm':undefined;}
async function boundedBytes(r,max){if(Number(r.headers?.get('content-length'))>max)throw Error('结果文件过大');const parts=[];let size=0;for await(const part of r.body){size+=part.length;if(size>max)throw Error('结果文件超过下载上限');parts.push(part);}return Buffer.concat(parts);}
