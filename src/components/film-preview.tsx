import {useEffect,useRef} from 'react';
import {loadFilmFont,loadDateFont,renderFilm,type Settings} from '@/film';
import type {CaptureDate} from '@/photo-date';
export type Photo={id:string;name:string;image:HTMLImageElement;url:string;captureDate:CaptureDate|null;settings:Settings};
function makeDemo(){
 const c=document.createElement('canvas');c.width=1000;c.height=1250;const x=c.getContext('2d')!;
 let seed=45;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const sky=x.createLinearGradient(0,0,0,1250);sky.addColorStop(0,'#b6c8c1');sky.addColorStop(.52,'#e1d5b9');sky.addColorStop(1,'#757b56');x.fillStyle=sky;x.fillRect(0,0,1000,1250);
 for(let i=0;i<7;i++){x.fillStyle=['#8e9c82','#687b67','#4a6253','#344f43'][Math.min(3,Math.floor(i/2))];x.beginPath();x.moveTo(0,1250);for(let j=0;j<=1000;j+=25)x.lineTo(j,410+i*85+Math.sin(j/180+i)*95+rand()*22);x.lineTo(1000,1250);x.fill();}
 x.fillStyle='#b5b28d';x.beginPath();x.moveTo(590,740);x.bezierCurveTo(200,950,980,980,540,1250);x.lineTo(880,1250);x.bezierCurveTo(1150,980,300,900,620,740);x.fill();
 for(let i=0;i<24000;i++){const y=rand()*1250;x.fillStyle=`rgba(${rand()>.5?'255,246,219':'10,25,15'},${rand()*.13})`;x.fillRect(rand()*1000,y,1+rand()*2,1+rand()*2);}
 const image=new Image();image.src=c.toDataURL('image/jpeg',.92);return image;
}
const demo=makeDemo();
export function Preview({photo,settings,index}:{photo?:Photo;settings:Settings;index:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  let cancelled=false;const image=photo?.image??demo;
  const draw=async()=>{if(settings.textEnabled)await loadFilmFont(settings.font,settings.text);if(photo?.captureDate)await loadDateFont(settings);if(!cancelled&&ref.current)renderFilm(ref.current,image,image.naturalWidth,image.naturalHeight,settings,index,1200,photo?.captureDate??null);};
  if(image.complete)void draw();else image.addEventListener('load',draw,{once:true});
  return()=>{cancelled=true;image.removeEventListener('load',draw);};
 },[photo,settings,index]);
 return <canvas className="film-canvas" ref={ref} aria-label={photo?`${photo.name} 的胶片边框预览`:'胶片边框示例预览'}/>;
}
