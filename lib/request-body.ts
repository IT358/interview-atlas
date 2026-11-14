export class BodyLimitError extends Error {}
export async function boundedForm(req:Request,max=14*1024*1024){
 if(Number(req.headers.get('content-length')||0)>max)throw new BodyLimitError('リクエストが大きすぎます。');
 const reader=req.body?.getReader();if(!reader)throw new Error('Empty body');const parts:Uint8Array[]=[];let total=0;
 while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();throw new BodyLimitError('リクエストが大きすぎます。')}parts.push(value)}
 const all=new Uint8Array(total);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.byteLength}
 return new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')||''},body:all}).formData();
}
export function objectData(raw:string){if(raw.length>70000)throw new BodyLimitError('内容が長すぎます。');const d=JSON.parse(raw);if(!d||Array.isArray(d)||typeof d!=='object')throw new SyntaxError('Invalid record');return d;}
export function byteRange(header:string|null,size:number){if(!header)return null;const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))throw new RangeError('Invalid range');let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));let end=m[1]?(m[2]?Number(m[2]):size-1):size-1;end=Math.min(end,size-1);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new RangeError('Invalid range');return {offset:start,length:end-start+1,end};}
export async function boundedJson(req:Request,max=12000){
 if(Number(req.headers.get('content-length')||0)>max)throw new BodyLimitError('リクエストが大きすぎます。');
 const reader=req.body?.getReader();if(!reader)throw new SyntaxError('Empty body');const parts:Uint8Array[]=[];let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();throw new BodyLimitError('リクエストが大きすぎます。')}parts.push(value)}
 const body=new Uint8Array(total);let offset=0;for(const p of parts){body.set(p,offset);offset+=p.byteLength}const data=JSON.parse(new TextDecoder().decode(body));if(!data||Array.isArray(data)||typeof data!=='object')throw new SyntaxError('Invalid JSON');return data;
}
