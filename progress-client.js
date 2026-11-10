/* Append after client.js, then call require('@local/drock-media/progress').apply(ctx)
 * inside the original apply. Registering this lazy module alone does not activate it.
 * TurnLocation is props.turn; its numeric coordinate is props.turn.turn.
 */
window.__ModuleLoader__.load({
  id: '@local/drock-media/progress',
  factory(require) {
    const React = require('react'), h = React.createElement;
    return {apply(ctx) {
      const ns = 'drock-media-progress';
      const words = {
        zh: {image:'图片',mj:'MJ 图片',video:'视频',submitting:'提交中',queued:'排队中',generating:'生成中',downloading:'下载中',completed:'已完成',failed:'失败',cancelled:'已取消',elapsed:'耗时',open:'打开文件',retryVideo:'重新加载视频',unsupported:'视频加载失败，请重试或打开文件查看。',imageError:'图片加载失败，请打开文件查看。',pollError:'进度暂时无法读取，正在重试。',expired:'资源已过期',paused:'查询已暂停',uncertain:'提交结果待确认',retry:'下载重试中',unknown:'处理中',seconds:'秒',minutes:'分'},
        en: {image:'Image',mj:'MJ image',video:'Video',submitting:'Submitting',queued:'Queued',generating:'Generating',downloading:'Downloading',completed:'Completed',failed:'Failed',cancelled:'Cancelled',elapsed:'Elapsed',open:'Open file',retryVideo:'Reload video',unsupported:'Video failed to load. Retry or open the file.',imageError:'Image could not load. Open the file to view it.',pollError:'Progress is temporarily unavailable. Retrying.',expired:'Resources expired',paused:'Polling paused',uncertain:'Submission unconfirmed',retry:'Retrying download',unknown:'Processing',seconds:'s',minutes:'m'}
      };
      for (const [lang, dict] of Object.entries(words)) ctx.locale.register(ns, lang, dict);
      const css = ".drmp{margin:12px 0;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px}.drmp-top{display:flex;gap:12px;align-items:center;padding:12px}.drmp-art{flex:none;width:58px;height:58px;border-radius:9px;background:#080a0f;position:relative;overflow:hidden}.drmp-art:after{content:\"\";position:absolute;inset:0;background:radial-gradient(circle,#328bff 1.4px,transparent 1.65px) center/7px 7px;mask-image:radial-gradient(ellipse at center,#000 12%,#0009 43%,transparent 76%);-webkit-mask-image:radial-gradient(ellipse at center,#000 12%,#0009 43%,transparent 76%)}.drmp-main{min-width:0;flex:1}.drmp-title{display:flex;gap:8px;justify-content:space-between}.drmp-meta{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:12px}.drmp progress{display:block;width:100%;height:6px;margin-top:9px;accent-color:var(--dsw-alias-brand-primary)}.drmp-files{padding:0 12px 12px}.drmp figure{margin:8px 0 0}.drmp video,.drmp img{display:block;width:100%;max-height:440px;object-fit:contain;border-radius:7px;background:var(--dsw-alias-bg-base)}.drmp figcaption{margin-top:5px;overflow-wrap:anywhere}.drmp a{color:var(--dsw-alias-brand-primary)}.drmp-error{padding:12px;color:var(--dsw-alias-state-error-primary)}.drmp-notice{color:var(--dsw-alias-label-secondary)}";
      const flowCss = ".drmp-flow{height:5px;margin-top:9px;border-radius:4px;overflow:hidden;background:repeating-linear-gradient(90deg,#12243a 0%,#1b4677 22%,#378df4 42%,#69baff 50%,#378df4 58%,#1b4677 78%,#12243a 100%);background-size:200% 100%;animation:drmp-flow-right 2.4s linear infinite}@keyframes drmp-flow-right{from{background-position:200% 0}to{background-position:0% 0}}@media(prefers-reduced-motion:reduce){.drmp-flow{animation:none}}";
      const sessions = new Map();
      const empty = Object.freeze({jobs:[],error:false,now:0});
      let disposed = false;
      const stateOf = id => {
        if (!sessions.has(id)) sessions.set(id,{id,listeners:new Set(),snapshot:empty,timer:null,controller:null});
        return sessions.get(id);
      };
      const publish = state => state.listeners.forEach(fn => fn());
      const stop = state => {
        clearTimeout(state.timer); state.timer = null;
        state.controller?.abort(); state.controller = null;
      };
      const schedule = state => {
        clearTimeout(state.timer);
        if (!disposed && state.listeners.size && !document.hidden) state.timer = setTimeout(() => poll(state),3000);
      };
      async function poll(state) {
        if (disposed || !state.listeners.size || document.hidden || state.controller) return;
        const controller = new AbortController(); state.controller = controller;
        const timeout = setTimeout(() => controller.abort(),10000);
        try {
          const rpcId = crypto.randomUUID();
          const response = await fetch(new URL('api/drock-media',document.baseURI),{
            method:'POST',credentials:'same-origin',signal:controller.signal,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({type:'client-request',rpcId,method:'drock-media',payload:{action:'progress',sessionId:state.id}})
          });
          if (!response.ok) throw new Error('HTTP '+response.status);
          const envelope = await response.json();
          if (envelope.type !== 'server-response' || envelope.rpcId !== rpcId || envelope.result?.ok !== true || !Array.isArray(envelope.result.value?.jobs)) throw new Error('Invalid progress response');
          if (state.controller !== controller || disposed) return;
          state.snapshot = {jobs:envelope.result.value.jobs.filter(job => job && job.sessionId === state.id),error:false,now:Date.now()};
          publish(state);
        } catch (_) {
          if (state.controller !== controller || disposed) return;
          state.snapshot = {...state.snapshot,error:true,now:Date.now()}; publish(state);
        } finally {
          clearTimeout(timeout);
          if (state.controller === controller) {state.controller = null; schedule(state);}
        }
      }
      function subscribe(id, fn) {
        if (!id || disposed) return () => {};
        const state = stateOf(id); state.listeners.add(fn);
        if (state.listeners.size === 1) poll(state);
        return () => {
          state.listeners.delete(fn);
          if (!state.listeners.size) {stop(state); sessions.delete(id);}
        };
      }
      function useJobs(id) {
        const sub = React.useCallback(fn => subscribe(id,fn),[id]);
        const get = React.useCallback(() => id ? stateOf(id).snapshot : empty,[id]);
        return React.useSyncExternalStore(sub,get,() => empty);
      }
      ctx.effect(() => {
        const visibility = () => {
          for (const state of sessions.values()) {
            if (document.hidden) stop(state); else poll(state);
          }
        };
        document.addEventListener('visibilitychange',visibility);
        return () => {
          disposed = true; document.removeEventListener('visibilitychange',visibility);
          for (const state of sessions.values()) {stop(state); state.listeners.clear();}
          sessions.clear();
        };
      });
      const statusOf = job => String(job.status || '').toLowerCase();
      const complete = job => ['succeeded','completed','success','done'].includes(statusOf(job));
      const failed = job => ['failed','error','cancelled','canceled'].includes(statusOf(job));
      const terminal = job => complete(job) || failed(job) || ['expired','polling-paused','submission-unknown','submission-failed'].includes(statusOf(job));
      function stage(job) {
        const s = statusOf(job);
        if (complete(job)) return 'completed';
        if(s==='expired')return 'expired';if(s==='polling-paused')return 'paused';if(s==='submission-unknown')return 'uncertain';if(s==='submission-failed')return 'failed';if(s==='download-retry')return 'retry';
        if (['failed','error'].includes(s)) return 'failed';
        if (['cancelled','canceled'].includes(s)) return 'cancelled';
        if (['downloading','download'].includes(s)) return 'downloading';
        if (['queued','pending','waiting','submitted'].includes(s)) return 'queued';
        if (['submitting','created'].includes(s)) return 'submitting';
        if (['running','processing','generating','in_progress'].includes(s)) return 'generating';
        return 'unknown';
      }
      function elapsed(job, now, t) {
        const start = typeof job.createdAt === 'number' ? job.createdAt : Date.parse(job.createdAt);
        const end = terminal(job) ? (typeof job.updatedAt === 'number' ? job.updatedAt : Date.parse(job.updatedAt)) : now;
        if (!Number.isFinite(start) || !Number.isFinite(end)) return '';
        const seconds = Math.max(0,Math.floor((end-start)/1000));
        return t('elapsed')+' '+(seconds >= 60 ? Math.floor(seconds/60)+t('minutes')+' ' : '')+(seconds%60)+t('seconds');
      }
      function FileView({file,job,t,openFile}) {
        const [error,setError] = React.useState('');
        const [retry,setRetry] = React.useState(0);
        const path = file.path;
        const src = new URL((job.kind==='video'?'api/drock-media/video?requestId='+encodeURIComponent(job.requestId)+'&index='+encodeURIComponent(file.index??0):'api/file?path='+encodeURIComponent(path)),document.baseURI).href;
        const video = /\.(mp4|webm|mov|m4v|ogv|mkv)(?:$|[?#])/i.test(path) || job.kind === 'video';
        const image = !video && (/\.(png|jpe?g|webp|gif|avif|bmp)(?:$|[?#])/i.test(path) || !!file.imageRef);
        React.useEffect(() => {setError('');},[src]);
        return h('figure',null,
          video && h('video',{key:src+':'+retry,src,controls:true,playsInline:true,preload:'auto','aria-label':t('video'),onLoadedData:()=>setError(''),onCanPlay:()=>setError(''),onPlaying:()=>setError(''),onError:()=>setError(t('unsupported'))}),
          image && !error && h('img',{src,alt:job.model || t('image'),loading:'lazy',onError:()=>setError(t('imageError'))}),
          error && h('p',{className:'drmp-notice',role:'status'},error,video&&h('button',{type:'button',onClick:()=>{setError('');setRetry(v=>v+1);}},t('retryVideo'))),
          h('figcaption',null,h('a',{href:src,target:'_blank',rel:'noopener'},t('open')+' · '+path.split(/[\\/]/).pop())));
      }
      function Card({job,now,t,showFiles,openFile}) {
        const real = typeof job.progress === 'number' && Number.isFinite(job.progress) && job.progress >= 0 && job.progress <= 100;
        const percent = real ? Math.round(job.progress) : undefined;
        return h('article',{className:'drmp','aria-label':t(job.kind in words.en ? job.kind : 'image')+' · '+t(stage(job))},
          !complete(job) && h('div',{className:'drmp-top'},h('div',{className:'drmp-art','aria-hidden':true}),
            h('div',{className:'drmp-main'},h('div',{className:'drmp-title'},h('strong',null,t(job.kind in words.en ? job.kind : 'image')),h('span',{role:'status'},t(stage(job))+(real && !terminal(job) ? ' · '+percent+'%' : ''))),
              h('div',{className:'drmp-meta'},[job.model,elapsed(job,now,t)].filter(Boolean).join(' · ')),
              !terminal(job) && (real?h('progress',{max:100,value:percent,'aria-label':t(stage(job))}):h('div',{className:'drmp-flow',role:'progressbar','aria-label':t(stage(job))})))),
          job.error && h('div',{className:'drmp-error'},typeof job.error === 'string' ? job.error : job.error.message || String(job.error)),
          showFiles && Array.isArray(job.files) && h('div',{className:'drmp-files'},...job.files.filter(f=>typeof f?.path === 'string' && f.path).map(file=>h(FileView,{key:file.path,file,job,t,openFile}))));
      }
      function Dock({sessionId,t}) {
        const data = useJobs(sessionId), jobs = data.jobs.filter(job=>!terminal(job));
        if (!jobs.length && !data.error) return null;
        return h('div',{style:{width:'100%',minWidth:0,flexBasis:'100%'}},h('style',null,css+flowCss),...jobs.map(job=>h(Card,{key:job.requestId,job,now:data.now,t})),data.error && h('p',{className:'drmp-notice',role:'status'},t('pollError')));
      }
      function Tail({sessionId,turn,openFile,t}) {
        const data = useJobs(sessionId);
        // Never guess ownership for old jobs: one numeric turn coordinate, one tail.
        const number = turn?.turn;
        const jobs = Number.isInteger(number) ? data.jobs.filter(job => Number.isInteger(job.turn) && job.turn === number) : [];
        React.useEffect(()=>{
          const paths=new Set(jobs.filter(complete).flatMap(j=>(j.files||[]).map(f=>f.path.replaceAll('\\','/'))));
          if(!paths.size)return;
          const changed=new Map();
          const scan=()=>{for(const img of document.querySelectorAll('img')){if(img.closest('.drmp'))continue;let path;try{path=new URL(img.src,document.baseURI).searchParams.get('path')?.replaceAll('\\','/');}catch{}if(paths.has(path)&&!changed.has(img)){changed.set(img,img.style.display);img.style.display='none';}}};
          scan();const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});
          return()=>{observer.disconnect();for(const [img,display]of changed)img.style.display=display;};
        },[jobs.map(j=>j.requestId+':'+j.status).join('|')]);
        if (!jobs.length) return null;
        return h('div',null,h('style',null,css+flowCss),...jobs.map(job=>h(Card,{key:job.requestId,job,now:data.now,t,showFiles:true,openFile})));
      }
      ctx.slots.inject('conversation.composer.dock',()=>ctx.slots.register({name:'conversation.composer.dock',id:'drock-media-progress',order:30,locale:ns},Dock));
      ctx.slots.inject('conversation.chat.turnTail',()=>ctx.slots.register({name:'conversation.chat.turnTail',id:'drock-media-results',order:30,locale:ns},Tail));
    }};
  }
});
