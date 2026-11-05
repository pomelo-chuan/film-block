import {useEffect,useRef,useState} from 'react';
import {renderCollage,type CollageSettings} from '@/collage';
import type {Photo} from './film-preview';
export function CollagePreview({photos,allPhotos,settings,label='多张拼图预览'}:{label?:string;photos:Photo[];allPhotos:Photo[];settings:CollageSettings}){
 const ref=useRef<HTMLCanvasElement>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let cancelled=false;setFailed(false);const buffer=document.createElement('canvas');
  void renderCollage(buffer,photos,allPhotos,settings,1200,()=>cancelled).then(()=>{if(!cancelled&&ref.current){ref.current.width=buffer.width;ref.current.height=buffer.height;ref.current.getContext('2d')?.drawImage(buffer,0,0);}}).catch(()=>{if(!cancelled)setFailed(true);}).finally(()=>{buffer.width=buffer.height=0;});
  return()=>{cancelled=true;};
 },[photos,allPhotos,settings]);
 if(!photos.length)return <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground"><span>添加照片，开始多张拼图</span><span className="text-xs">保留每张照片的胶片边框与日期</span></div>;
 return failed?<p role="alert" className="text-sm">拼图预览失败，请减少照片或重试</p>:<canvas ref={ref} className="film-canvas" aria-label={label}/>;
}
