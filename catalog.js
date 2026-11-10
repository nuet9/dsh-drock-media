export const BASE='https://ai.freeflyagain.xyz/v1';
export const catalog=[
 ...['gpt-image-2.6-sunburst','gpt-image-2.6-flare','gpt-image-2.5-sunburst','gpt-image-2.5-flare','gpt-image-2','gemini-3-pro-image-preview','gemini-3.1-flash-image-preview'].map(id=>({id,label:id,kind:'image',note:id==='gpt-image-2.6-sunburst'?'已完成真实文生图验证':'官网列出，尚未逐一实测'})),
 ...['midjourney-v7','midjourney-v8.1','midjourney-v8.2'].map(id=>({id,label:id,kind:'mj',note:'同步出图；一次一张；宽高比写入提示词；尚未实测'})),
 ...['seedance-2.0','seedance-2.0-fast','miniMax-Hailuo-02','miniMax-Hailuo-2.3'].map(id=>({id,label:id,kind:'video',note:'异步生成；需要对应视频分组；尚未实测'}))
];
export const defaults={revision:0,imageModel:'gpt-image-2.6-sunburst',imageQuality:'auto',imageSize:'auto',mjModel:'midjourney-v7',videoModel:'seedance-2.0-fast',videoSeconds:5,videoSize:'720P'};
export const kinds=['image','mj','video'];
export const imageSizes={'auto':'auto','1:1':'1024x1024','3:2':'1536x1024','2:3':'1024x1536','4:3':'1152x864','3:4':'864x1152','16:9':'1536x864','9:16':'864x1536','21:9':'1792x768','9:21':'768x1792'};
export const resolveImageSize=value=>Object.hasOwn(imageSizes,value)?imageSizes[value]:value;
export function validateSettings(input){
 const s={...defaults};for(const k of Object.keys(defaults))if(input?.[k]!==undefined&&input[k]!==''&&input[k]!==null)s[k]=input[k];
 for(const [kind,key]of [['image','imageModel'],['mj','mjModel'],['video','videoModel']])if(!catalog.some(v=>v.kind===kind&&v.id===s[key]))throw Error('未知模型：'+s[key]);
 if(!['auto','low','medium','high'].includes(s.imageQuality))throw Error('图片质量应为 auto/low/medium/high');
 if(typeof s.imageSize!=='string'||!(/^(auto|[1-9][0-9]{2,3}x[1-9][0-9]{2,3})$/).test(resolveImageSize(s.imageSize)))throw Error('图片尺寸应为 auto 或 1024x1024 等格式');
 if(!Number.isInteger(s.videoSeconds)||s.videoSeconds<4||s.videoSeconds>15)throw Error('视频时长应为4–15整数秒');
 if(typeof s.videoSize!=='string'||!(/^(480p|720p|768p|1080p|854x480|480x854|1280x720|720x1280|1920x1080|1080x1920)$/i).test(s.videoSize))throw Error('视频尺寸应为480P/720P/768P/1080P或1280x720等');
 if(s.videoModel.startsWith('miniMax')){if(!input?.videoSeconds||input.videoSeconds===defaults.videoSeconds)s.videoSeconds=6;if(!input?.videoSize||input.videoSize===defaults.videoSize)s.videoSize='768P';if(![6,10].includes(s.videoSeconds)||!['768p','1080p'].includes(s.videoSize.toLowerCase())||(s.videoSize.toLowerCase()==='1080p'&&s.videoSeconds!==6))throw Error('海螺支持768P 6/10秒、1080P仅6秒');}
 return s;
}
