import {formatStampDate,type CaptureDate} from './photo-date';

// A vector seven-segment date back: no external font or device font dependency.
const digits:Record<string,string>={0:'abcdef',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgecd',7:'abc',8:'abcdefg',9:'abfgcd'};
const segments:Record<string,readonly[number,number,number,number]>={
  a:[.13,.04,.49,.04],b:[.56,.11,.56,.43],c:[.56,.57,.56,.89],
  d:[.13,.96,.49,.96],e:[.06,.57,.06,.89],f:[.06,.11,.06,.43],g:[.13,.50,.49,.50],
};
export function stampLayout(x:number,y:number,width:number,height:number,date:CaptureDate){
  const text=formatStampDate(date),unit=Math.min(width,height)*.045;
  const advance=(character:string)=>character===' '? .32:character==="'"?.25:.78;
  const span=Array.from(text).reduce((n,c)=>n+advance(c),0)*unit;
  const inset=Math.min(width,height)*.045;
  return {text,unit,x:x+width-inset-span,y:y+height-inset-unit,width:span,height:unit,advance};
}
export function drawDateStamp(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,date:CaptureDate){
  const layout=stampLayout(x,y,width,height,date),u=layout.unit;
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  ctx.lineCap='butt';ctx.lineJoin='bevel';
  const trace=()=>{
    let cursor=layout.x;ctx.beginPath();
    for(const character of layout.text){
      if(character==="'"){ctx.moveTo(cursor+.09*u,layout.y+.03*u);ctx.lineTo(cursor+.04*u,layout.y+.19*u);}
      else for(const name of digits[character]??''){
        const [x1,y1,x2,y2]=segments[name];ctx.moveTo(cursor+x1*u,layout.y+y1*u);ctx.lineTo(cursor+x2*u,layout.y+y2*u);
      }
      cursor+=layout.advance(character)*u;
    }
    ctx.stroke();
  };
  ctx.strokeStyle='rgba(83,24,0,.65)';ctx.lineWidth=u*.115;ctx.shadowColor='rgba(93,20,0,.65)';ctx.shadowBlur=u*.12;trace();
  ctx.strokeStyle='#ffb354';ctx.lineWidth=u*.065;ctx.shadowColor='rgba(255,100,15,.8)';ctx.shadowBlur=u*.18;trace();
  ctx.restore();
}
