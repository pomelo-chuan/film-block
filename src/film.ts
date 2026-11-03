export type Settings = { format: '135' | '120'; color: string; ink: string; text: string; holes: 'round' | 'square' | 'none'; count: number; width: number; paper: string };
export const defaults: Settings = {format:'135', color:'#171815', ink:'#dda84d', text:'KODAK PORTRA 400', holes:'round', count:18, width:10, paper:'#f7f5ef'};
export const presets = [
  {name:'经典黑', color:'#171815', ink:'#dda84d', label:'CLASSIC BLACK'},
  {name:'暖棕色', color:'#493025', ink:'#efbb72', label:'WARM BROWN'},
  {name:'奶油白', color:'#e8dfcc', ink:'#655340', label:'CREAM WHITE'},
  {name:'橄榄绿', color:'#333e32', ink:'#cbbf86', label:'OLIVE GREEN'},
  {name:'酒红色', color:'#552d32', ink:'#e7b992', label:'BURGUNDY'},
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
  const font=Math.max(8,rail*.19);ctx.fillStyle=s.ink;ctx.font=`500 ${font}px monospace`;ctx.textBaseline='middle';
  const label=s.text.trim() || 'FILM / ROOM';const frame=String(index+1).padStart(2,'0');
  ctx.save();
  if(vertical){ctx.translate(g.width-rail*.18,g.height-g.y);ctx.rotate(-Math.PI/2);}
  else ctx.translate(g.x,g.height-rail*.2);
  const available=(vertical?h:w)*.78;
  ctx.fillText(label,0,0,available);ctx.restore();
  ctx.save();if(vertical){ctx.translate(rail*.2,g.y);ctx.rotate(Math.PI/2);}else ctx.translate(g.x,rail*.21);
  ctx.fillText(`${s.format}  ▸  ${frame} A`,0,0,(vertical?h:w)*.8);ctx.restore();
}
export function safeFilename(name:string){return name.replace(/\.[^.]+$/,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_')+'-film.png';}
