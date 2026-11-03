export type Settings = { format: '135' | '120'; color: string; ink: string; text: string; font: 'Pixelify Sans' | 'Silkscreen' | 'Press Start 2P'; fontSize: number; holes: 'round' | 'square' | 'none'; count: number; width: number; paper: string };
export const defaults: Settings = {format:'135', color:'#171815', ink:'#dda84d', text:'KODAK PORTRA 400', font:'Pixelify Sans', fontSize:32, holes:'round', count:18, width:10, paper:'#f7f5ef'};
export const fonts = ['Pixelify Sans', 'Silkscreen', 'Press Start 2P'] as const;
export async function loadFilmFont(font: Settings['font']) {
  await document.fonts.load(`400 24px "${font}"`);
}
export const presets = [
  {name:'反相黑', color:'#171815', ink:'#dda84d', description:'负片反相扫描后常见的深色边缘'},
  {name:'负片橙', color:'#b56532', ink:'#ffe0a3', description:'彩色负片橙色遮罩的透射观感'},
  {name:'琥珀棕', color:'#8a482b', ink:'#f8cf80', description:'彩色负片片基的暖琥珀棕调'},
  {name:'深棕色', color:'#493025', ink:'#efbb72', description:'较深的负片棕色风格'},
  {name:'黑白灰', color:'#a6a6a0', ink:'#292b28', description:'黑白负片中性片基的灰色风格'},
  {name:'透明基', color:'#e6e2d7', ink:'#55534b', description:'透明片基在浅色背景上的风格化呈现'},
];
export function geometry(w:number,h:number,s:Settings){
  const unit=Math.min(w,h), rail=unit*s.width/100, end=rail*(s.format==='120' ? .85 : .55);
  const vertical=h>w;
  return {rail,end,vertical,width:Math.round(w+2*(vertical?rail:end)),height:Math.round(h+2*(vertical?end:rail)),x:vertical?rail:end,y:vertical?end:rail};
}
export function renderFilm(canvas:HTMLCanvasElement, image:CanvasImageSource, w:number,h:number,s:Settings,index:number,maxSize=6000){
  const factor=Math.min(1,maxSize/Math.max(w,h)); w=Math.round(w*factor);h=Math.round(h*factor);
  const g=geometry(w,h,s); canvas.width=g.width;canvas.height=g.height;
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('浏览器不支持 Canvas');
  ctx.fillStyle=s.color;ctx.fillRect(0,0,g.width,g.height);ctx.drawImage(image,g.x,g.y,w,h);
  const {rail,vertical}=g; const length=vertical?g.height:g.width;
  if(s.holes!=='none'){
    const n=s.count, pitch=length/n, a=rail*.24, b=Math.min(pitch*.47,rail*.3);
    ctx.fillStyle=s.paper;
    for(let i=0;i<n;i++) for(let side=0;side<2;side++){
      const x=vertical?(side?g.width-rail*.72:rail*.48):pitch*(i+.5)-b/2;
      const y=vertical?pitch*(i+.5)-b/2:(side?g.height-rail*.72:rail*.48);
      ctx.beginPath();ctx.roundRect(x,y,vertical?a:b,vertical?b:a,s.holes==='round'?a*.23:0);ctx.fill();
    }
  }
  const font=rail*s.fontSize/100;ctx.fillStyle=s.ink;ctx.font=`400 ${font}px "${s.font}", monospace`;ctx.textBaseline='alphabetic';
  const label=s.text.trim() || 'FILM / ROOM';const frame=String(index+1).padStart(2,'0');
  ctx.save();
  if(vertical){ctx.translate(g.width-rail*.23,g.height-g.y);ctx.rotate(-Math.PI/2);}
  else ctx.translate(g.x,g.height-rail*.23);
  const available=(vertical?h:w)*.78;
  const labelMetrics=ctx.measureText(label);
  ctx.fillText(label,0,(labelMetrics.actualBoundingBoxAscent-labelMetrics.actualBoundingBoxDescent)/2,available);ctx.restore();
  ctx.save();if(vertical){ctx.translate(rail*.23,g.y);ctx.rotate(Math.PI/2);}else ctx.translate(g.x,rail*.23);
  const frameLabel=`${s.format}  ▸  ${frame} A`, frameMetrics=ctx.measureText(frameLabel);
  ctx.fillText(frameLabel,0,(frameMetrics.actualBoundingBoxAscent-frameMetrics.actualBoundingBoxDescent)/2,(vertical?h:w)*.8);ctx.restore();
}
export function safeFilename(name:string){return name.replace(/\.[^.]+$/,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_')+'-film.png';}
