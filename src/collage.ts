import {geometry,loadDateFont,loadFilmFont,renderFilm} from './film';
import type {Photo} from './components/film-preview';
export const canvasRatios=['4:5','5:4','2:3','3:2','1:1','9:16','16:9'] as const;
export const arrangements={auto:'自动',row:'横排',stack:'竖排',grid:'网格'} as const;
export type CollageSettings={ratio:typeof canvasRatios[number];arrangement:keyof typeof arrangements;spacing:number;margin:number;background:string;slides:number};
export const collageDefaults:CollageSettings={ratio:'4:5',arrangement:'auto',spacing:3,margin:5,background:'#f7f5ef',slides:1};
export function collagePages<T>(items:T[],slides:number){
 if(!items.length)return [];
 const count=Math.min(items.length,Math.max(1,Math.floor(slides),Math.ceil(items.length/12)));
 const size=Math.floor(items.length/count),extra=items.length%count;let offset=0;
 return Array.from({length:count},(_,i)=>{const page=items.slice(offset,offset+size+(i<extra?1:0));offset+=page.length;return page;});
}
type Rect={x:number;y:number;width:number;height:number};
export function collageLayout(aspects:number[],s:CollageSettings,width:number,height:number):Rect[]{
 if(!aspects.length)return [];
 const n=aspects.length,edge=Math.min(width,height),margin=edge*Math.min(20,Math.max(0,s.margin))/100;
 const w=width-2*margin,h=height-2*margin;
 // Keep even a dense twelve-image row inside the canvas at maximum spacing.
 const gap=Math.min(edge*Math.max(0,s.spacing)/100,w/(2*n),h/(2*n));
 if(s.arrangement==='row'||s.arrangement==='stack'){
  const vertical=s.arrangement==='stack';
  const cross=vertical?Math.min(w,(h-gap*(n-1))/aspects.reduce((sum,a)=>sum+1/a,0)):Math.min(h,(w-gap*(n-1))/aspects.reduce((sum,a)=>sum+a,0));
  const lengths=aspects.map(a=>vertical?cross/a:cross*a),along=lengths.reduce((a,b)=>a+b,0)+gap*(n-1);
  let cursor=margin+((vertical?h:w)-along)/2;
  return lengths.map(length=>{const rect=vertical?{x:margin+(w-cross)/2,y:cursor,width:cross,height:length}:{x:cursor,y:margin+(h-cross)/2,width:length,height:cross};cursor+=length+gap;return rect;});
 }
 const grid=(cols:number)=>{
  const rows=Math.ceil(n/cols),cw=(w-gap*(cols-1))/cols,ch=(h-gap*(rows-1))/rows;
  return aspects.map((a,i)=>{const rw=Math.min(cw,ch*a),rh=rw/a,row=Math.floor(i/cols),col=i%cols,inRow=Math.min(cols,n-row*cols);
   return {x:margin+(w-(inRow*cw+(inRow-1)*gap))/2+col*(cw+gap)+(cw-rw)/2,y:margin+row*(ch+gap)+(ch-rh)/2,width:rw,height:rh};});
 };
 if(s.arrangement==='grid')return grid(Math.ceil(Math.sqrt(n*width/height))>n?n:Math.max(1,Math.ceil(Math.sqrt(n*width/height))));
 let best:Rect[]=[],area=-1;
 for(let cols=1;cols<=n;cols++){const rects=grid(cols),score=rects.reduce((sum,r)=>sum+r.width*r.height,0);if(score>area){area=score;best=rects;}}
 return best;
}
export async function renderCollage(canvas:HTMLCanvasElement,photos:Photo[],allPhotos:Photo[],s:CollageSettings,maxSize:number,cancelled=()=>false){
 const [rw,rh]=s.ratio.split(':').map(Number),ratio=rw/rh;
 canvas.width=Math.round(ratio>=1?maxSize:maxSize*ratio);canvas.height=Math.round(ratio>=1?maxSize/ratio:maxSize);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器不支持 Canvas');
 ctx.fillStyle=s.background;ctx.fillRect(0,0,canvas.width,canvas.height);
 const aspects=photos.map(p=>{const g=geometry(p.image.naturalWidth,p.image.naturalHeight,p.settings);return g.width/g.height;});
 const rects=collageLayout(aspects,s,canvas.width,canvas.height);
 for(let i=0;i<photos.length;i++){
  if(cancelled())return;
  const p=photos[i],rect=rects[i];
  if(p.settings.textEnabled)await loadFilmFont(p.settings.font,p.settings.text);
  if(p.captureDate)await loadDateFont(p.settings);
  if(cancelled())return;
  const frame=document.createElement('canvas');
  try{renderFilm(frame,p.image,p.image.naturalWidth,p.image.naturalHeight,p.settings,Math.max(0,allPhotos.indexOf(p)),Math.ceil(Math.max(rect.width,rect.height)),p.captureDate);ctx.drawImage(frame,rect.x,rect.y,rect.width,rect.height);}
  finally{frame.width=frame.height=0;}
 }
}
