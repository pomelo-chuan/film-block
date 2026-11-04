export type CaptureDate = Readonly<{year:number;month:number;day:number;source:'DateTimeOriginal'|'CreateDate'}>;

export function parseCaptureDate(value:unknown,source:CaptureDate['source']='DateTimeOriginal'):CaptureDate|null{
  if(typeof value!=='string')return null;
  const text=value.trim().replace(/\0+$/,'').trim();
  // Parse the recorded wall-clock components, never the viewer's timezone.
  const match=/^(\d{4})([:-])(\d{2})\2(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):?(\d{2}))?$/.exec(text);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[3]),day=Number(match[4]);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(year<1||month<1||month>12||day<1||day>days[month-1])return null;
  if(match[5]&&(Number(match[5])>23||Number(match[6])>59||Number(match[7])>59))return null;
  if(match[8]&&(Number(match[8])>23||Number(match[9])>59))return null;
  return {year,month,day,source};
}
export function captureDateFromMetadata(metadata:unknown):CaptureDate|null{
  if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return null;
  const tags=metadata as Record<string,unknown>;
  return parseCaptureDate(tags.DateTimeOriginal,'DateTimeOriginal')??parseCaptureDate(tags.CreateDate,'CreateDate');
}
export async function readCaptureDate(file:Blob|Uint8Array|ArrayBuffer):Promise<CaptureDate|null>{
  try{
    const {parse}=await import('exifr');
    const metadata:unknown=await parse(file,{pick:['DateTimeOriginal','CreateDate'],reviveValues:false,translateValues:false,gps:false,ifd1:false,makerNote:false,userComment:false,xmp:false,icc:false,iptc:false,jfif:false});
    return captureDateFromMetadata(metadata);
  }catch{return null;}
}
export const dateFormats = ["'YY MM DD", 'YYYY-MM-DD', 'YY.MM.DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const;
export type DateFormat = typeof dateFormats[number];
export function formatStampDate(date:CaptureDate,format:DateFormat="'YY MM DD"){
 const yyyy=String(date.year).padStart(4,'0'),yy=yyyy.slice(-2),mm=String(date.month).padStart(2,'0'),dd=String(date.day).padStart(2,'0');
 switch(format){
  case 'YYYY-MM-DD':return `${yyyy}-${mm}-${dd}`;
  case 'YY.MM.DD':return `${yy}.${mm}.${dd}`;
  case 'DD/MM/YYYY':return `${dd}/${mm}/${yyyy}`;
  case 'MM/DD/YYYY':return `${mm}/${dd}/${yyyy}`;
 }
 return `'${String(date.year%100).padStart(2,'0')} ${String(date.month).padStart(2,'0')} ${String(date.day).padStart(2,'0')}`;}
export function formatCaptureDate(date:CaptureDate){return `${String(date.year).padStart(4,'0')}-${String(date.month).padStart(2,'0')}-${String(date.day).padStart(2,'0')}`;}
