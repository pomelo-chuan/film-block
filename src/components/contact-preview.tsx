import {useEffect,useRef,useState} from 'react';
import {contactLayout,renderContact,type ContactSettings} from '@/contact';
import type {Settings} from '@/film';
import type {Photo} from './film-preview';
export function ContactPreview({photos,settings,base,index,active,onSelect,label='整卷展示预览'}:{photos:Photo[];settings:ContactSettings;base:Settings;index:number;active:string;onSelect:(id:string)=>void;label?:string}){
 const ref=useRef<HTMLCanvasElement>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let cancelled=false;const buffer=document.createElement('canvas');setFailed(false);
  void renderContact(buffer,photos,settings,base,1600,index,()=>cancelled).then(()=>{if(!cancelled&&ref.current){const canvas=ref.current;canvas.width=buffer.width;canvas.height=buffer.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(buffer,0,0);const at=photos.findIndex(p=>p.id===active);if(at>=0){const g=contactLayout(photos.length,settings),r=g.slots[at],unit=canvas.width/g.width;ctx.strokeStyle='#ffbd65';ctx.lineWidth=2;ctx.strokeRect(r.x*unit-1,r.y*unit-1,r.width*unit+2,r.height*unit+2);}}}).catch(()=>{if(!cancelled)setFailed(true);}).finally(()=>{buffer.width=buffer.height=0;});
  return()=>{cancelled=true;};
 },[photos,settings,base,index,active]);
 if(!photos.length)return <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground"><span>添加照片，查看整卷胶片</span><span className="text-xs">连续胶片条 · 格号 · 整卷信息</span></div>;
 return failed?<p role="alert" className="text-sm">整卷预览失败，请减少照片后重试</p>:<canvas ref={ref} className="film-canvas" aria-label={label} onClick={event=>{const canvas=ref.current;if(!canvas)return;const rect=canvas.getBoundingClientRect(),g=contactLayout(photos.length,settings),x=(event.clientX-rect.left)/rect.width*g.width,y=(event.clientY-rect.top)/rect.height*g.height;const at=g.slots.findIndex(r=>r.filled&&x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height);if(at>=0)onSelect(photos[at].id);}}/>;
}
