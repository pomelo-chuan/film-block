import {describe,it,expect} from 'vitest';
import {defaults,geometry,safeFilename,perforations,frameLine} from './film';
describe('film export geometry',()=>{
 it('keeps portrait image dimensions while adding side rails',()=>{const g=geometry(1000,1500,defaults);expect(g.vertical).toBe(true);expect(g.width).toBe(1200);expect(g.height).toBe(1610);expect(g.x).toBe(100);expect(g.y).toBeCloseTo(55);});
 it('rotates rails for landscape images',()=>{const g=geometry(1500,1000,defaults);expect(g.vertical).toBe(false);expect(g.width).toBe(1610);expect(g.height).toBe(1200);});
 it('uses wider end borders for medium format without cropping',()=>{const g=geometry(1000,1000,{...defaults,format:'120'});expect(g.width-2*g.x).toBe(1000);expect(g.height-2*g.y).toBe(1000);expect(g.width).toBe(1170);});
 it('sanitizes export names',()=>expect(safeFilename('trip/photo.jpeg')).toBe('trip_photo-film.png'));
});

describe('border decorations preserve photograph and spacing',()=>{
 for(const [w,h] of [[1000,1500],[1500,1000],[1000,1000]]){
  it(`keeps dense perforations separate and outside ${w}x${h} photograph`,()=>{
   const s={...defaults,count:32,width:18};const g=geometry(w,h,s);const holes=perforations(g,s);
   expect(holes).toHaveLength(64);
   for(let i=0;i<holes.length;i++){
    const p=holes[i];expect(p.x).toBeGreaterThanOrEqual(0);expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.x+p.width).toBeLessThanOrEqual(g.width);expect(p.y+p.height).toBeLessThanOrEqual(g.height);
    expect(p.x+p.width<=g.x||p.x>=g.x+w||p.y+p.height<=g.y||p.y>=g.y+h).toBe(true);
    if(i>=2){const previous=holes[i-2];expect(g.vertical?p.y>=previous.y+previous.height:p.x>=previous.x+previous.width).toBe(true);}
   }
  });
  it(`keeps frame line fully in borders of ${w}x${h} photograph`,()=>{
   for(const frameOffset of [0,15,100]){
    const s={...defaults,frameSize:12,frameOffset};const g=geometry(w,h,s);const line=frameLine(w,h,g,s);
    expect(line.x-line.size/2).toBeGreaterThanOrEqual(-1e-10);
    expect(line.y-line.size/2).toBeGreaterThanOrEqual(-1e-10);
    expect(line.x+line.size/2).toBeLessThanOrEqual(g.x+1e-10);
    expect(line.y+line.size/2).toBeLessThanOrEqual(g.y+1e-10);
   }
  });
 }
 it('does not generate holes when disabled',()=>expect(perforations(geometry(1000,1000,defaults),{...defaults,format:'120',holes:'none'})).toEqual([]));
});
