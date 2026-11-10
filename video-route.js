import {open} from 'node:fs/promises';
export function byteRange(header,size){
 if(!header)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return false;
 let start,end;
 if(!m[1]){const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return false;start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(m[1]);end=m[2]?Number(m[2]):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return false;
 return {start,end:Math.min(end,size-1)};
}
export async function videoResponse(request,path){
 let file;try{
 file=await open(path,'r');const stat=await file.stat();if(!stat.isFile())throw Error('not file');
 const size=stat.size,range=byteRange(request.headers.get('range'),size);
 const headers={'Content-Type':path.toLowerCase().endsWith('.webm')?'video/webm':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'private, no-cache','X-Content-Type-Options':'nosniff'};
 if(range===false){await file.close();return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+size}});}
 const start=range?.start??0,end=range?.end??size-1;headers['Content-Length']=String(end-start+1);if(range)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;
 if(request.method==='HEAD'){await file.close();return new Response(null,{status:range?206:200,headers});}
 let position=start,closed=false;const close=async()=>{if(!closed){closed=true;await file.close();}};
 const body=new ReadableStream({async pull(controller){try{if(request.signal.aborted){await close();controller.error(request.signal.reason);return;}const count=Math.min(65536,end-position+1);if(count<=0){await close();controller.close();return;}const buffer=Buffer.allocUnsafe(count);const {bytesRead}=await file.read(buffer,0,count,position);if(!bytesRead)throw Error('Unexpected end of video');position+=bytesRead;controller.enqueue(new Uint8Array(buffer.subarray(0,bytesRead)));if(position>end){await close();controller.close();}}catch(e){await close();controller.error(e);}},cancel:close});
 return new Response(body,{status:range?206:200,headers});
 }catch(e){await file?.close().catch(()=>{});return new Response('Video unavailable',{status:404});}
}
