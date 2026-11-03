export type Settings = { format: '135' | '120'; color: string; ink: string; text: string; font: 'Pixelify Sans' | 'Silkscreen' | 'Press Start 2P'; fontSize: number; holes: 'round' | 'square' | 'none'; count: number; width: number; paper: string; texture: 'smooth' | 'grain'; frameSize: number; frameOffset: number; frameColor: string };
export const defaults: Settings = {format:'135', color:'#171815', ink:'#dda84d', text:'KODAK PORTRA 400', font:'Pixelify Sans', fontSize:32, holes:'round', count:8, width:10, paper:'#f7f5ef', texture:'smooth', frameSize:0, frameOffset:15, frameColor:'#a99a78'};
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
// Holes are our decorative geometry, not a darktable processing feature.
export function perforations(g: ReturnType<typeof geometry>, s: Settings) {
  if(s.holes === 'none') return [];
  const length=g.vertical?g.height:g.width, inset=g.rail*.24;
  const pitch=(length-2*inset)/s.count, ratio=s.holes==='round'?.72:1;
  const across=Math.min(g.rail*.34,pitch*.64/ratio), along=across*ratio;
  return Array.from({length:s.count*2},(_,i)=>{
    const center=inset+pitch*(Math.floor(i/2)+.5), side=i%2;
    const cross=side?(g.vertical?g.width:g.height)-g.rail*.27:g.rail*.27;
    return {x:g.vertical?cross-across/2:center-along/2,
      y:g.vertical?center-along/2:cross-across/2,
      width:g.vertical?across:along,height:g.vertical?along:across,
      radius:s.holes==='round'?Math.min(across,along)*.18:0};
  });
}
// Keep the line entirely outside the photograph, even at maximum offset.
export function frameLine(w:number,h:number,g:ReturnType<typeof geometry>,s:Settings){
  const border=Math.min(g.x,g.y), size=border*s.frameSize/100;
  const gap=(border-size)*s.frameOffset/100;
  return {x:g.x-gap-size/2,y:g.y-gap-size/2,width:w+2*gap+size,height:h+2*gap+size,size};
}
function drawBaseTexture(ctx:CanvasRenderingContext2D,w:number,h:number,g:ReturnType<typeof geometry>){
  ctx.save();ctx.beginPath();ctx.rect(0,0,g.width,g.height);ctx.rect(g.x,g.y,w,h);ctx.clip('evenodd');
  // Fixed seed and normalized coordinates keep grain stable between preview/export.
  let seed=137;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const dot=Math.min(w,h)/650;
  for(let i=0;i<18000;i++){
    const x=random()*g.width,y=random()*g.height;
    if(x>g.x&&x<g.x+w&&y>g.y&&y<g.y+h)continue;
    ctx.fillStyle=i%2?'rgba(255,244,216,.12)':'rgba(0,0,0,.10)';
    ctx.fillRect(x,y,dot*(.5+random()),dot*(.5+random()));
  }
  ctx.restore();
}
export function renderFilm(canvas:HTMLCanvasElement, image:CanvasImageSource, w:number,h:number,s:Settings,index:number,maxSize=6000){
  const factor=Math.min(1,maxSize/Math.max(w,h)); w=Math.round(w*factor);h=Math.round(h*factor);
  const g=geometry(w,h,s); canvas.width=g.width;canvas.height=g.height;
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('浏览器不支持 Canvas');
  ctx.fillStyle=s.color;ctx.fillRect(0,0,g.width,g.height);ctx.drawImage(image,g.x,g.y,w,h);
  const {rail,vertical}=g;
  if(s.texture==='grain')drawBaseTexture(ctx,w,h,g);
  if(s.frameSize>0){const line=frameLine(w,h,g,s);ctx.strokeStyle=s.frameColor;ctx.lineWidth=line.size;ctx.strokeRect(line.x,line.y,line.width,line.height);}
  ctx.fillStyle=s.paper;
  for(const hole of perforations(g,s)){
    ctx.beginPath();ctx.roundRect(hole.x,hole.y,hole.width,hole.height,hole.radius);ctx.fill();
  }
  const font=rail*s.fontSize/100;ctx.fillStyle=s.ink;ctx.font=`400 ${font}px "${s.font}", monospace`;ctx.textBaseline='alphabetic';
  const label=s.text.trim() || 'FILM / ROOM';const frame=String(index+1).padStart(2,'0');
  ctx.save();
  if(vertical){ctx.translate(g.width-rail*.76,g.height-g.y);ctx.rotate(-Math.PI/2);}
  else ctx.translate(g.x,g.height-rail*.76);
  const available=(vertical?h:w)*.78;
  const labelMetrics=ctx.measureText(label);
  ctx.fillText(label,0,(labelMetrics.actualBoundingBoxAscent-labelMetrics.actualBoundingBoxDescent)/2,available);ctx.restore();
  ctx.save();if(vertical){ctx.translate(rail*.76,g.y);ctx.rotate(Math.PI/2);}else ctx.translate(g.x,rail*.76);
  const frameLabel=`${s.format}  ▸  ${frame} A`, frameMetrics=ctx.measureText(frameLabel);
  ctx.fillText(frameLabel,0,(frameMetrics.actualBoundingBoxAscent-frameMetrics.actualBoundingBoxDescent)/2,(vertical?h:w)*.8);ctx.restore();
}
export function safeFilename(name:string){return name.replace(/\.[^.]+$/,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_')+'-film.png';}
