import assert from 'node:assert/strict';
import {Media} from './media.js';
import {validateSettings,imageSizes} from './catalog.js';
const tables=new Map();const domain={table(name){if(!tables.has(name))tables.set(name,new Map());return {get:k=>tables.get(name).get(k),put:async(k,v)=>{tables.get(name).set(k,structuredClone(v));},entries:()=>tables.get(name).entries()};}};
let postCount=0,pollCount=0,fail=false;const bodies=[];const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH1sAAAAASUVORK5CYII=','base64');
const s={credential:async()=> 'test-secret',credentialInfo:async()=>({configured:true,source:'test'}),fetch:async(url,o)=>{if(o.method==='POST'){postCount++;bodies.push(JSON.parse(o.body));if(fail)throw Error('network timeout');return Response.json({id:'job_test',status:'queued'});}pollCount++;return Response.json({status:'completed',data:[{b64_json:png.toString('base64')}]});},saveFile:async(b,t,name)=>({path:'C:/test/'+name,bytes:b.length}),readImage:async()=>png};
const m=new Media(domain,s),ctx={sessionId:'session-test'};const a={action:'generate',kind:'image',requestId:'test-generate-01',prompt:'penguin'};
await Promise.all([m.execute(a,ctx),m.execute(a,ctx)]);assert.equal(postCount,1);await m.execute(a,ctx);assert.equal(postCount,1);
await assert.rejects(m.execute({...a,prompt:'other'},ctx),/requestId/);
const done=await m.execute({action:'status',requestId:a.requestId},ctx);assert.equal(done.status,'completed');assert.equal(done.files.length,1);await m.execute({action:'status',requestId:a.requestId},ctx);assert.equal(pollCount,1);
await assert.rejects(m.execute({action:'status',requestId:a.requestId},{sessionId:'session-other'}),/另一个会话/);
fail=true;const u={...a,requestId:'test-unknown-01'};assert.equal((await m.execute(u,ctx)).status,'submission-unknown');await m.execute(u,ctx);assert.equal(postCount,2);
const mj=await m.payload({kind:'mj',prompt:'x --ar 16:9'});assert.equal(mj.p.model,'midjourney-v7');assert.equal(mj.p.background,undefined);assert.equal(mj.p.size,undefined);await assert.rejects(m.payload({kind:'mj',prompt:'x',mask:'https://x/a'}));
const video=await m.payload({kind:'video',prompt:'x',size:'720x1280',images:['ref.png'],imageMode:'reference_image'});assert.equal(video.p.resolution,'720p');assert.equal(video.p.ratio,'9:16');assert.equal(video.p.file_list[0].file_type,0);
const hailuo=await m.payload({kind:'video',model:'miniMax-Hailuo-02',prompt:'x'});assert.equal(hailuo.p.duration,6);assert.equal(hailuo.p.resolution,'768p');await assert.rejects(m.payload({kind:'video',model:'miniMax-Hailuo-02',prompt:'x',seconds:10,size:'1080p'}));await assert.rejects(m.payload({kind:'video',prompt:'x',audio:['https://x/a']}));
await m.execute({action:'save',revision:0,settings:{imageModel:'',imageSize:''}});assert.equal(m.config().revision,1);await assert.rejects(m.execute({action:'save',revision:0,settings:{}}),/设置已被修改/);assert.equal(validateSettings({videoModel:'miniMax-Hailuo-2.3'}).videoSeconds,6);
// Isolated persisted stores and controlled promises exercise pre-persistence races and restarts.
function fixture(overrides={}){
 const records=new Map();const domain={table(name){if(!records.has(name))records.set(name,new Map());const table=records.get(name);return {get:k=>structuredClone(table.get(k)),put:async(k,v)=>{table.set(k,structuredClone(v));},entries:()=>[...table].map(([k,v])=>[k,structuredClone(v)])};}};
 const services={...s,...overrides};return {domain,records,services,media:new Media(domain,services)};
}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
const gate=deferred(),entered=deferred();let concurrentPosts=0;
const concurrent=fixture({readImage:async()=>{entered.resolve();await gate.promise;return png;},fetch:async()=>{concurrentPosts++;return Response.json({id:'concurrent_task',status:'queued'});}});
const concurrentArgs={...a,requestId:'race-request-01',images:['ref.png']};
const first=concurrent.media.execute(concurrentArgs,ctx);await entered.promise;
const identical=concurrent.media.execute(concurrentArgs,ctx);
await assert.rejects(concurrent.media.execute({...concurrentArgs,prompt:'different'},ctx),/requestId/);
await assert.rejects(concurrent.media.execute(concurrentArgs,{sessionId:'other-session'}),/requestId/);
gate.resolve();await Promise.all([first,identical]);assert.equal(concurrentPosts,1);await concurrent.media.close();

const interrupted=fixture({fetch:async()=>{throw Error('recovery must never submit or query');}});
await interrupted.media.jobs.put('restart-request-01',{requestId:'restart-request-01',sessionId:ctx.sessionId,kind:'image',status:'submitting',createdAt:new Date().toISOString(),files:[]});
const restarted=new Media(interrupted.domain,interrupted.services);
assert.equal((await restarted.execute({action:'get'},ctx)).jobs[0].status,'submission-unknown');
assert.equal((await restarted.execute({action:'refresh',requestId:'restart-request-01'},ctx)).status,'submission-unknown');
assert.equal(interrupted.media.jobs.get('restart-request-01').status,'submission-unknown');
// The generate retry after a restart also reports uncertainty and cannot resubmit.
const retryArgs={...a,requestId:'restart-generate-01'};
const generating=fixture({fetch:async()=>{throw Error('network timeout');}});
await generating.media.execute(retryArgs,ctx);const stale=generating.media.jobs.get(retryArgs.requestId);stale.status='submitting';await generating.media.jobs.put(retryArgs.requestId,stale);
assert.equal((await new Media(generating.domain,generating.services).execute(retryArgs,ctx)).status,'submission-unknown');
await restarted.close();await interrupted.media.close();await generating.media.close();

let mjPosts=0,mjDownloads=0,saveAttempts=0;
const syncResponse={status:'completed',data:[{b64_json:png.toString('base64')},{url:'https://example.invalid/result.png'}]};
const sync=fixture({fetch:async(url,o={})=>{if(o.method==='POST'){mjPosts++;return Response.json(syncResponse);}mjDownloads++;if(mjDownloads===1)return new Response('',{status:503});return new Response(png);},saveFile:async(...args)=>{saveAttempts++;return s.saveFile(...args);}});
const syncArgs={action:'generate',kind:'mj',prompt:'test',requestId:'sync-mj-request-01'};
const failedDownload=await sync.media.execute(syncArgs,ctx);assert.equal(failedDownload.status,'download-retry');assert.equal(failedDownload.files.length,1);assert.equal(failedDownload.response,undefined);
assert.deepEqual(sync.media.jobs.get(syncArgs.requestId).response,syncResponse);await sync.media.close();
const syncRestart=new Media(sync.domain,sync.services);
assert.equal((await syncRestart.execute(syncArgs,ctx)).status,'download-retry');assert.equal(mjPosts,1);
const [downloaded,downloadedAgain]=await Promise.all([syncRestart.execute({action:'refresh',requestId:syncArgs.requestId},ctx),syncRestart.execute({action:'refresh',requestId:syncArgs.requestId},ctx)]);
assert.deepEqual(downloadedAgain,downloaded);
assert.equal(downloaded.status,'completed');assert.equal(downloaded.files.length,2);assert.equal(saveAttempts,2);assert.equal(mjPosts,1);assert.equal(mjDownloads,2);await syncRestart.close();

let resumedPolls=0;
const paused=fixture({fetch:async(url,o)=>{assert.equal(o.method,'GET');resumedPolls++;return Response.json({status:'running'});}});
const pausedJob={requestId:'paused-request-01',sessionId:ctx.sessionId,kind:'image',taskId:'old_task',status:'running',createdAt:new Date(Date.now()-25*3600000).toISOString(),files:[]};
await paused.media.jobs.put(pausedJob.requestId,pausedJob);await paused.media.tick();assert.equal(paused.media.jobs.get(pausedJob.requestId).status,'polling-paused');assert.equal(resumedPolls,0);
assert.equal((await paused.media.execute({action:'refresh',requestId:pausedJob.requestId},ctx)).status,'running');
assert.ok(Date.parse(paused.media.jobs.get(pausedJob.requestId).pollingStartedAt)>Date.parse(pausedJob.createdAt));
await paused.media.tick();assert.equal(resumedPolls,2);assert.equal(paused.media.jobs.get(pausedJob.requestId).status,'running');assert.equal(paused.media.jobs.get(pausedJob.requestId).error,undefined);await paused.media.close();
await m.close();console.log('PASS: active request conflicts, interrupted submissions, synchronous MJ download recovery, renewed polling window, idempotency, uncertain submission, downloads, session ownership, MJ/video payloads, Hailuo limits, settings conflicts');
for(const [ratio,pixels] of Object.entries(imageSizes)){assert.equal(validateSettings({imageSize:ratio}).imageSize,ratio);assert.equal((await m.payload({kind:'image',prompt:'ratio check',size:ratio})).p.size,pixels);}
assert.equal((await m.payload({kind:'image',prompt:'legacy size',size:'1536x1024'})).p.size,'1536x1024');
await assert.rejects(m.payload({kind:'image',prompt:'invalid size',size:'5:7'}));
const expired=fixture({fetch:async()=>Response.json({error:{code:1610,message:'Generated resources have expired and been deleted (TTL 600s).'}})});
await expired.media.jobs.put('expired-request-01',{requestId:'expired-request-01',sessionId:ctx.sessionId,kind:'image',status:'queued',taskId:'old_task',createdAt:new Date().toISOString(),files:[]});
assert.equal((await expired.media.execute({action:'status',requestId:'expired-request-01'},ctx)).status,'expired');
expired.services.fetch=async()=>{throw Error('expired task must not be automatically polled');};await expired.media.tick();await expired.media.close();
