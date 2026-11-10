/* Drock media settings. Browser module; React is supplied by Harness. */
window.__ModuleLoader__.load({
  id: '@local/drock-media',
  factory(require) {
    const React = require('react'), h = React.createElement, ns = 'drock-media';
    const fields = ['imageModel', 'imageQuality', 'imageSize', 'mjModel', 'videoModel', 'videoSeconds', 'videoSize'];
    const kinds = ['image', 'mj', 'video'];
    const dict = {
      zh: {
        title:'生图 / 生视频', close:'关闭', intro:'保持普通聊天模型，描述需求后会自动选择对应的生图 / 生视频工具。生成请求会消耗积分。',
        official:'官网模型广场 ↗', settings:'默认模型与参数', credentials:'接口凭据', jobs:'最近任务', image:'图片', mj:'MJ 图片', video:'视频',
        model:'默认模型', quality:'图片质量', imageSize:'图片尺寸', videoSize:'视频尺寸 / 清晰度', seconds:'视频时长（秒）',
        defaults:'留空使用 Host 默认', modelDefault:'使用 Host 默认模型', unavailable:'当前模型不在目录中', noModels:'Host 尚未提供此类模型',
        untested:'目录与备注由 Host 提供；未标明实测通过的模型均未确认可用。', limits:'时长和尺寸取决于所选模型。Hailuo 使用 6 / 10 秒，不支持 5 秒，1080P 仅支持 6 秒；尺寸可填 720P 等清晰度或 1280x720 等宽高，请以官网模型说明为准。',
        newKey:'输入新 Key（不读取原密钥）', configured:'已配置', unconfigured:'未配置', source:'来源', unknown:'未知', saveKey:'保存 Key', removeKey:'移除 Key',
        removeConfirm:'确认移除此组已保存的 Key？环境变量或其他来源仍可能生效。', confirmRemove:'确认移除', check:'检查接口（只读）', checkHint:'检查只读取接口，不生成、不扣费。', reachable:'接口可达', unreachable:'接口不可达', unchecked:'未验证可达性', models:'接口返回的模型',
        save:'保存默认设置', saved:'默认设置已保存', keySaved:'Key 已保存，输入内容已清除', keyRemoved:'已移除保存的 Key', loading:'读取中…', working:'处理中…',
        reload:'重新读取', reloadHint:'如遇版本冲突，重新读取后再修改；本地草稿会被替换。', error:'操作失败', failed:'RPC 请求失败', invalid:'Host 返回了无效数据',
        conflict:'保存未完成。若提示 revision / 版本冲突，请先重新读取最新设置再修改。', dirty:'有未保存修改', discardAsk:'存在未保存的设置或 Key 输入。要放弃这些内容吗？', discardClose:'放弃并关闭', discardReload:'放弃并重新读取', cancel:'继续编辑',
        empty:'暂无任务。请在对话中描述图片或视频需求。', refresh:'查询并下载', refreshHint:'仅刷新已有任务；下载完成的结果会显示文件路径。', refreshed:'任务已刷新',
        requestId:'请求 ID', taskId:'任务 ID', status:'状态', created:'创建时间', files:'文件', noFiles:'尚无已下载文件', bytes:'字节', pending:'等待中', queued:'排队中', running:'进行中', submitted:'已提交', processing:'处理中', succeeded:'已完成', completed:'已完成', success:'已完成', failedStatus:'失败', cancelled:'已取消',
        requiredKey:'请先输入非空 Key', invalidSeconds:'视频时长须为正整数，或留空使用默认值。'
      },
      en: {
        title:'Images / Videos', close:'Close', intro:'Keep your usual chat model. Describe what you need and the corresponding image or video tool will be selected automatically. Generation requests consume credits.',
        official:'Official model catalog ↗', settings:'Default models and parameters', credentials:'API credentials', jobs:'Recent jobs', image:'Image', mj:'MJ image', video:'Video',
        model:'Default model', quality:'Image quality', imageSize:'Image size', videoSize:'Video size / resolution', seconds:'Video duration (seconds)',
        defaults:'Leave blank for Host default', modelDefault:'Use Host default model', unavailable:'Current model is missing from the catalog', noModels:'Host has not supplied models for this category',
        untested:'Catalog and notes come from Host. Models without an explicit successful test note have not been confirmed to work.', limits:'Duration and size depend on the model. Hailuo uses 6 / 10 seconds, does not support 5 seconds, and supports only 6 seconds at 1080P. Enter a resolution such as 720P or dimensions such as 1280x720; consult the official documentation.',
        newKey:'New Key (existing secrets are never read)', configured:'Configured', unconfigured:'Not configured', source:'Source', unknown:'Unknown', saveKey:'Save Key', removeKey:'Remove Key',
        removeConfirm:'Remove the saved Key for this category? Environment variables or other sources may still apply.', confirmRemove:'Confirm removal', check:'Check API (read only)', checkHint:'Checks only read the API; they do not generate or consume credits.', reachable:'API reachable', unreachable:'API unreachable', unchecked:'Reachability not verified', models:'Models returned by API',
        save:'Save defaults', saved:'Default settings saved', keySaved:'Key saved and input cleared', keyRemoved:'Saved Key removed', loading:'Loading…', working:'Working…',
        reload:'Reload', reloadHint:'For revision conflicts, reload before editing again; local drafts will be replaced.', error:'Operation failed', failed:'RPC request failed', invalid:'Host returned invalid data',
        conflict:'Save did not complete. If the error indicates a revision conflict, reload the latest settings and edit again.', dirty:'Unsaved changes', discardAsk:'There are unsaved settings or Key inputs. Discard them?', discardClose:'Discard and close', discardReload:'Discard and reload', cancel:'Keep editing',
        empty:'No jobs yet. Describe your image or video request in chat.', refresh:'Query and download', refreshHint:'Refresh only existing jobs. Downloaded results appear as file paths.', refreshed:'Job refreshed',
        requestId:'Request ID', taskId:'Task ID', status:'Status', created:'Created', files:'Files', noFiles:'No downloaded files yet', bytes:'bytes', pending:'Pending', queued:'Queued', running:'Running', submitted:'Submitted', processing:'Processing', succeeded:'Completed', completed:'Completed', success:'Completed', failedStatus:'Failed', cancelled:'Cancelled',
        requiredKey:'Enter a nonempty Key first', invalidSeconds:'Video duration must be a positive integer, or blank for the default.'
      }
    };
    const css = '.drm-launch{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:5px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}.drm-launch:hover,.drm-launch[aria-expanded=true]{background:var(--dsw-alias-bg-layer-2)}.drm-launch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary)}'+
'.drm{position:fixed;inset:auto;left:50%;top:6vh;transform:translateX(-50%);margin:0;z-index:1200;box-shadow:0 18px 60px #0006;box-sizing:border-box;width:min(880px,calc(100vw - 24px));max-height:88vh;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}.drm::backdrop{background:transparent}.drm header{cursor:move;touch-action:none;user-select:none}.drm header button{cursor:pointer}.drm *{box-sizing:border-box}.drm header,.drm footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:14px 18px}.drm header{border-bottom:1px solid var(--dsw-alias-border-l1)}.drm h2{font-size:16px;margin:0}.drm h3{font-size:14px;margin:0 0 12px}.drm p{margin:6px 0;line-height:1.6}.drm-body{padding:14px 18px;max-height:calc(88vh - 140px);overflow:auto}.drm section{margin:16px 0;padding:14px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px}.drm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px}.drm label{display:flex;flex-direction:column;gap:5px}.drm input,.drm select{font:inherit;color:inherit;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:8px;width:100%;min-width:0}.drm button{font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:6px 10px;cursor:pointer}.drm button:disabled{opacity:.5;cursor:default}.drm :focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.drm a{color:var(--dsw-alias-brand-primary)}.drm-note{color:var(--dsw-alias-label-secondary);font-size:12px;overflow-wrap:anywhere}.drm-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:8px 0}.drm-error{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;overflow-wrap:anywhere}.drm-success{color:var(--dsw-alias-state-success-primary)}.drm-warning{color:var(--dsw-alias-state-warn-primary)}.drm-job{padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;margin-top:8px}';
    const clean = settings => Object.fromEntries(fields.map(key => [key, settings?.[key] ?? '']));
    return {
      inject:['slots','connection','locale'],
      apply(ctx) {
        for (const [lang, strings] of Object.entries(dict)) ctx.locale.register(ns, lang, strings);
        let visible = false;
        const listeners = new Set();
        const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
        const setOpen = value => { visible = value; listeners.forEach(fn => fn()); };
        async function rpc(payload, t) {
          const response = await fetch('/api/drock-media', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:crypto.randomUUID(),method:'drock-media',payload})});
          if (!response.ok) throw new Error('HTTP '+response.status);
          const envelope = await response.json(), result = envelope.result;
          if (!result || result.ok !== true) throw new Error(result?.error?.message || t('failed'));
          return result.value;
        }
        function Icon() {
          return h('svg', {width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},
            h('path',{d:'M4 4.5h13a2 2 0 0 1 2 2V12M14 19.5H4a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z'}),
            h('circle',{cx:7,cy:9,r:1.3}),h('path',{d:'m3 17 5-5 3.5 3 2-2M16 14l6 3.5-6 3.5Z'}));
        }
        function Launcher({t}) {
          const open = React.useSyncExternalStore(subscribe, () => visible);
          return h(React.Fragment,null,h('style',null,css),h('button',{type:'button',className:'drm-launch',title:t('title'),'aria-label':t('title'),'aria-haspopup':'dialog','aria-expanded':open,onClick:()=>setOpen(true)},h(Icon)));
        }
        function Panel({t}) {
          const open = React.useSyncExternalStore(subscribe, () => visible);
          const dialog = React.useRef(null), returnFocus = React.useRef(null), confirmRef = React.useRef(null), inFlight = React.useRef(false);
          const [data,setData] = React.useState(null), [draft,setDraft] = React.useState(clean(null)), [base,setBase] = React.useState(clean(null));
          const [keys,setKeys] = React.useState({image:'',mj:'',video:''}), [checks,setChecks] = React.useState({});
          const [busy,setBusy] = React.useState(false), [error,setError] = React.useState(''), [message,setMessage] = React.useState('');
          const [confirm,setConfirm] = React.useState(null), [remove,setRemove] = React.useState(null);
          const dirtySettings = JSON.stringify(draft) !== JSON.stringify(base);
          const dirty = dirtySettings || kinds.some(kind => keys[kind].length > 0);
          const adopt = value => {
            if (!value?.settings || !Array.isArray(value.catalog) || !Array.isArray(value.jobs) || !value.credentials) throw new Error(t('invalid'));
            setData(value); setDraft(clean(value.settings)); setBase(clean(value.settings));
          };
          async function work(fn) {
            if (inFlight.current) return;
            inFlight.current = true; setBusy(true); setError(''); setMessage('');
            try { await fn(); } catch (e) { setError(e?.message || String(e)); } finally { inFlight.current = false; setBusy(false); }
          }
          const load = () => work(async () => { adopt(await rpc({action:'get'},t)); setKeys({image:'',mj:'',video:''}); setChecks({}); setRemove(null); });
          React.useEffect(() => {
            const el = dialog.current;
            if (open) { returnFocus.current = document.activeElement; if (!el.open) el.show(); load(); }
            else if (el.open) { el.close(); const target = returnFocus.current; if (target?.isConnected) target.focus(); }
          }, [open]);
          React.useEffect(() => { if (confirm) confirmRef.current?.focus(); }, [confirm]);
          React.useEffect(() => {
            if (!open || !dirty) return;
            const warn = event => { event.preventDefault(); event.returnValue = ''; };
            window.addEventListener('beforeunload',warn);
            return () => window.removeEventListener('beforeunload',warn);
          }, [open,dirty]);
          React.useEffect(() => () => { if (dialog.current?.open) dialog.current.close(); }, []);
          const drag = React.useRef(null);
          const startDrag = event => {
            if(event.button!==0 || event.target.closest('button'))return;
            const el=dialog.current, rect=el.getBoundingClientRect();
            drag.current={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
            event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();
          };
          const moveDrag = event => {
            if(!drag.current)return;const el=dialog.current, d=drag.current;
            const left=Math.max(8,Math.min(window.innerWidth-el.offsetWidth-8,d.left+event.clientX-d.x));
            const top=Math.max(8,Math.min(window.innerHeight-el.offsetHeight-8,d.top+event.clientY-d.y));
            Object.assign(el.style,{left:left+'px',top:top+'px',transform:'none'});
          };
          const endDrag = () => {drag.current=null;};
          React.useEffect(()=>{if(!open)return;const fit=()=>{const el=dialog.current,r=el.getBoundingClientRect();Object.assign(el.style,{left:Math.max(8,Math.min(innerWidth-r.width-8,r.left))+'px',top:Math.max(8,Math.min(innerHeight-r.height-8,r.top))+'px',transform:'none'});};window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[open]);
          const finishClose = () => { setConfirm(null); setKeys({image:'',mj:'',video:''}); setRemove(null); setError(''); setMessage(''); setOpen(false); };
          const request = action => { if (busy) return; if (dirty) setConfirm(action); else if (action === 'close') finishClose(); else load(); };
          const change = (key,value) => { setDraft(previous=>({...previous,[key]:value})); setMessage(''); };
          const save = () => work(async () => {
            const seconds = draft.videoSeconds;
            if (seconds !== '' && (!Number.isSafeInteger(Number(seconds)) || Number(seconds) <= 0)) throw new Error(t('invalidSeconds'));
            try { adopt(await rpc({action:'save',revision:data.settings.revision,settings:{...draft,videoSeconds:seconds === '' ? '' : Number(seconds)}},t)); }
            catch (e) { throw new Error((e?.message || String(e)) + '\n' + t('conflict')); }
            setMessage(t('saved'));
          });
          const credential = (kind, action) => work(async () => {
            if (action === 'credential' && !keys[kind].trim()) throw new Error(t('requiredKey'));
            const value = await rpc(action === 'credential' ? {action,kind,key:keys[kind].trim()} : {action,kind},t);
            if (!value?.settings || !Array.isArray(value.catalog) || !Array.isArray(value.jobs) || !value.credentials) throw new Error(t('invalid'));
            // Keep drafts and their original revision so a concurrent settings change cannot be overwritten.
            if (dirtySettings) { setData(previous=>({...value,settings:previous.settings})); }
            else adopt(value);
            setKeys(previous=>({...previous,[kind]:''})); setChecks(previous=>({...previous,[kind]:null})); setRemove(null);
            setMessage(t(action === 'credential' ? 'keySaved' : 'keyRemoved'));
          });
          const model = kind => {
            const field = kind === 'image' ? 'imageModel' : kind === 'mj' ? 'mjModel' : 'videoModel';
            const catalog = data.catalog.filter(item=>item.kind===kind), current = catalog.find(item=>item.id===draft[field]);
            return h('div',{key:kind},h('label',null,t(kind)+' · '+t('model'),h('select',{value:draft[field],disabled:busy,onChange:event=>change(field,event.target.value)},
              h('option',{value:''},t('modelDefault')),
              draft[field] && !current && h('option',{value:draft[field]},draft[field]+' · '+t('unavailable')),
              ...catalog.map(item=>h('option',{key:item.id,value:item.id},item.label || item.id)))),
              h('p',{className:'drm-note'},current?.note || (!catalog.length ? t('noModels') : '')));
          };
          const textField = (field,label,type='text') => h('label',{key:field},t(label),h('input',{type,value:draft[field],disabled:busy,placeholder:t('defaults'),min:type==='number'?1:undefined,step:type==='number'?1:undefined,onChange:event=>change(field,event.target.value)}));
          const choiceField = (field,label,options) => h('label',{key:field},t(label),h('select',{value:draft[field],disabled:busy,onChange:event=>change(field,event.target.value)},!options.some(([value])=>value===draft[field])&&h('option',{value:draft[field]},draft[field]),...options.map(([value,title])=>h('option',{key:value,value},title))));
          const sizeOptions=[['auto','auto'],['1:1','1:1'],['3:2','3:2'],['4:3','4:3'],['16:9','16:9'],['21:9','21:9'],['2:3','2:3'],['3:4','3:4'],['9:16','9:16'],['9:21','9:21']];
          const credentialCard = kind => {
            const value = data.credentials[kind] || {}, result = checks[kind];
            return h('section',{key:kind,'aria-label':t(kind)+' '+t('credentials')},h('h3',null,t(kind)),
              h('p',{className:'drm-note'},t(value.configured?'configured':'unconfigured')+' · '+t('source')+': '+(value.source || t('unknown'))),
              h('label',null,t('newKey'),h('input',{type:'password',autoComplete:'new-password',spellCheck:false,value:keys[kind],disabled:busy,onChange:event=>{setKeys(previous=>({...previous,[kind]:event.target.value}));setMessage('');}})),
              h('div',{className:'drm-row'},h('button',{type:'button',disabled:busy||!keys[kind].trim(),onClick:()=>credential(kind,'credential')},t('saveKey')),
                h('button',{type:'button',disabled:busy||!value.configured,onClick:()=>setRemove(kind)},t('removeKey')),
                h('button',{type:'button',disabled:busy,onClick:()=>work(async()=>{const result=await rpc({action:'check',kind},t);if(!result||typeof result.configured!=='boolean')throw new Error(t('invalid'));setChecks(previous=>({...previous,[kind]:result}));})},t('check'))),
              remove===kind && h('div',{className:'drm-confirm'},h('p',null,t('removeConfirm')),h('div',{className:'drm-row'},h('button',{disabled:busy,onClick:()=>credential(kind,'credential-remove')},t('confirmRemove')),h('button',{disabled:busy,onClick:()=>setRemove(null)},t('cancel')))),
              result && h('div',{'role':'status'},h('p',null,t(result.configured?'configured':'unconfigured')+' · '+t('source')+': '+(result.source||t('unknown'))),h('p',null,t(result.reachable===true?'reachable':result.reachable===false?'unreachable':'unchecked')),h('p',{className:'drm-note'},result.message),Array.isArray(result.models)&&h('p',{className:'drm-note'},t('models')+': '+result.models.join(', '))));
          };
          const statusText = status => status === 'failed' ? t('failedStatus') : (['pending','queued','running','submitted','processing','succeeded','completed','success','cancelled'].includes(status) ? t(status) : status);
          return h('dialog',{ref:dialog,className:'drm','aria-label':t('title'),onKeyDown:event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();request('close');}},onCancel:event=>{event.preventDefault();request('close');},onClose:()=>{if(visible)setOpen(false);}},
            h('style',null,css),h('header',{onPointerDown:startDrag,onPointerMove:moveDrag,onPointerUp:endDrag,onPointerCancel:endDrag},h('h2',null,t('title')),h('button',{type:'button',disabled:busy,onClick:()=>request('close'),'aria-label':t('close')},'×')),
            h('div',{className:'drm-body','aria-busy':busy},h('p',null,t('intro')),h('a',{href:'https://ai.freeflyagain.xyz/modelSquare',target:'_blank',rel:'noopener noreferrer'},t('official')),
              confirm && h('div',{className:'drm-confirm',role:'alert'},h('p',null,t('discardAsk')),h('div',{className:'drm-row'},h('button',{ref:confirmRef,onClick:()=>setConfirm(null)},t('cancel')),h('button',{onClick:()=>{const action=confirm;setConfirm(null);if(action==='close')finishClose();else load();}},t(confirm==='close'?'discardClose':'discardReload')))),
              error && h('p',{className:'drm-error',role:'alert'},t('error')+': '+error),message && h('p',{className:'drm-success',role:'status'},message),
              busy && h('p',{className:'drm-note',role:'status'},t(data?'working':'loading')),
              data && h(React.Fragment,null,
                h('section',{'aria-label':t('settings')},h('h3',null,t('settings')),h('div',{className:'drm-grid'},...kinds.map(model),choiceField('imageQuality','quality',[['auto','auto · 自动'],['low','low · 低'],['medium','medium · 中'],['high','high · 高']]),choiceField('imageSize','imageSize',sizeOptions),textField('videoSeconds','seconds','number'),textField('videoSize','videoSize')),
                  h('p',{className:'drm-warning'},t('untested')),h('p',{className:'drm-note'},t('limits'))),
                h('h3',null,t('credentials')),h('p',{className:'drm-note'},t('checkHint')),h('div',{className:'drm-grid'},...kinds.map(credentialCard)),
                h('section',{'aria-label':t('jobs')},h('h3',null,t('jobs')),h('p',{className:'drm-note'},t('refreshHint')),
                  !data.jobs.length && h('p',{className:'drm-note'},t('empty')),
                  ...[...data.jobs].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)).map(job=>h('article',{className:'drm-job',key:job.requestId},
                    h('div',{className:'drm-row'},h('strong',null,(kinds.includes(job.kind)?t(job.kind):job.kind)+' · '+job.model),h('span',null,t('status')+': '+statusText(job.status)),h('button',{disabled:busy,onClick:()=>work(async()=>{const updated=await rpc({action:'refresh',requestId:job.requestId},t);if(!updated||updated.requestId!==job.requestId)throw new Error(t('invalid'));setData(previous=>({...previous,jobs:previous.jobs.map(item=>item.requestId===updated.requestId?updated:item)}));setMessage(t('refreshed'));})},t('refresh'))),
                    h('p',{className:'drm-note'},t('created')+': '+job.createdAt),h('p',{className:'drm-note'},t('requestId')+': '+job.requestId),job.taskId&&h('p',{className:'drm-note'},t('taskId')+': '+job.taskId),job.error&&h('p',{className:'drm-error'},typeof job.error==='string'?job.error:job.error.message||JSON.stringify(job.error)),
                    h('p',{className:'drm-note'},t('files')),Array.isArray(job.files)&&job.files.length?h('ul',null,...job.files.map((file,index)=>h('li',{key:file.path+index},h('code',null,file.path),' · '+file.bytes+' '+t('bytes')))):h('p',{className:'drm-note'},t('noFiles'))))))),
            h('footer',null,h('div',null,h('button',{type:'button',disabled:busy,onClick:()=>request('reload')},t('reload')),h('p',{className:'drm-note'},t('reloadHint'))),h('div',{className:'drm-row'},dirty&&h('span',{className:'drm-warning'},t('dirty')),h('button',{type:'button',disabled:busy||!data||!dirtySettings,onClick:save},t('save')))));
        }
        require('@local/drock-media/progress').apply(ctx);
        ctx.slots.inject('sidebar.footer.action',()=>ctx.slots.register({name:'sidebar.footer.action',id:'drock-media-launcher',order:87,locale:ns,label:()=>ctx.locale.bind(ns)('title')},Launcher));
        ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'drock-media-settings',order:23,locale:ns},Panel));
      }
    };
  }
});
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
