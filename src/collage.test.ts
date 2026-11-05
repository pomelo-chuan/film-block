import {describe,it,expect} from 'vitest';
import {arrangements,canvasRatios,collageDefaults,collageLayout,collagePages} from './collage';
describe('collage pagination',()=>{
 it('keeps every photo exactly once, in order, without empty pages',()=>{
  for(const count of [0,1,2,3,5,12,13,25,100])for(const slides of [1,2,3]){
   const items=Array.from({length:count},(_,i)=>i),pages=collagePages(items,slides);
   expect(pages.flat()).toEqual(items);
   expect(pages.every(page=>page.length>0&&page.length<=12)).toBe(true);
   if(pages.length)expect(Math.max(...pages.map(page=>page.length))-Math.min(...pages.map(page=>page.length))).toBeLessThanOrEqual(1);
  }
 });
 it('distributes five photos into 2/2/1 rather than dropping the remainder',()=>expect(collagePages([1,2,3,4,5],3)).toEqual([[1,2],[3,4],[5]]));
});
describe('collage placement',()=>{
 for(const arrangement of Object.keys(arrangements) as (keyof typeof arrangements)[])it(`${arrangement} fits mixed aspect ratios without cropping, overlapping, or leaving the canvas`,()=>{
  for(const ratio of canvasRatios)for(const count of [1,2,5,12])for(const spacing of [0,3,10]){
   const [rw,rh]=ratio.split(':').map(Number),width=1200*rw/rh,height=1200;
   const aspects=Array.from({length:count},(_,i)=>[.4,1,2.5][i%3]);
   const rects=collageLayout(aspects,{...collageDefaults,arrangement,spacing,ratio,margin:20},width,height);
   expect(rects).toHaveLength(count);
   rects.forEach((r,i)=>{
    expect(r.width).toBeGreaterThan(0);expect(r.height).toBeGreaterThan(0);
    expect(r.width/r.height).toBeCloseTo(aspects[i],6);
    expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x+r.width).toBeLessThanOrEqual(width+1e-6);expect(r.y+r.height).toBeLessThanOrEqual(height+1e-6);
    for(const b of rects.slice(i+1))expect(Math.min(r.x+r.width,b.x+b.width)-Math.max(r.x,b.x)<=1e-6||Math.min(r.y+r.height,b.y+b.height)-Math.max(r.y,b.y)<=1e-6).toBe(true);
   });
  }
 });
 it('handles no photos without a phantom cell',()=>expect(collageLayout([],collageDefaults,960,1200)).toEqual([]));
});

describe('individual collage photo sizing',()=>{
 for(const arrangement of Object.keys(arrangements) as (keyof typeof arrangements)[])it(`${arrangement} respects photo scale without cropping or overlapping`,()=>{
  const aspects=[.6,1,1.8,.9],settings={...collageDefaults,arrangement};
  const rects=collageLayout(aspects,settings,960,1200,[50,150,100,75]);
  rects.forEach((r,i)=>{
   expect(r.width/r.height).toBeCloseTo(aspects[i]);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(960);expect(r.y+r.height).toBeLessThanOrEqual(1200);
   for(const b of rects.slice(i+1))expect(Math.min(r.x+r.width,b.x+b.width)-Math.max(r.x,b.x)<=1e-6||Math.min(r.y+r.height,b.y+b.height)-Math.max(r.y,b.y)<=1e-6).toBe(true);
  });
 });
 it('applies independent relative sizing and returns exactly to the default after reset',()=>{
  const settings={...collageDefaults,arrangement:'stack' as const};
  const smaller=collageLayout([1,1],settings,960,1200,[50,100]);expect(smaller[0].width/smaller[1].width).toBeCloseTo(.5);
  const bigger=collageLayout([1,1],settings,960,1200,[150,100]);expect(bigger[0].width/bigger[1].width).toBeCloseTo(1.5);
  expect(collageLayout([1,1],settings,960,1200,[100,100])).toEqual(collageLayout([1,1],settings,960,1200));
 });
});
