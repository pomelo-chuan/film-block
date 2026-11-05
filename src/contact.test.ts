import {describe,it,expect} from 'vitest';
import {contactDefaults,contactCapacity,contactPages,contactLayout,orderByCaptureDate,contactDateRange} from './contact';
import {parseCaptureDate} from './photo-date';
describe('complete roll pagination',()=>{
 for(const format of ['135','120'] as const)it(`${format} keeps every frame in order, with no empty rolls`,()=>{
  const settings={...contactDefaults,format},capacity=contactCapacity(settings);
  for(const count of [0,1,12,13,35,36,37,73]){
   const photos=Array.from({length:count},(_,i)=>i),pages=contactPages(photos,settings);
   expect(pages.flat()).toEqual(photos);expect(pages.every(page=>page.length>0&&page.length<=capacity)).toBe(true);
   expect(pages.length).toBe(Math.ceil(count/capacity));
  }
 });
 it('lays out continuous 135 rows with a shared film pitch and only trailing empty frames',()=>{
  const g=contactLayout(15,contactDefaults);expect(g.rows).toBe(3);expect(g.slots).toHaveLength(18);expect(g.slots.filter(r=>r.filled)).toHaveLength(15);
  expect(g.slots[1].x-g.slots[0].x).toBe(38);expect(g.slots[6].y-g.slots[0].y).toBe(39);
 });
 it('keeps all frames inside the paper in each supported layout',()=>{
  for(const format of ['135','120'] as const)for(const columns of [2,3,4,6])for(const infoEnabled of [false,true]){
   const s={...contactDefaults,format,columns,infoEnabled},g=contactLayout(contactCapacity(s),s);
   for(const r of g.slots){expect(r.x).toBeGreaterThan(0);expect(r.y).toBeGreaterThan(0);expect(r.x+r.width).toBeLessThan(g.width);expect(r.y+r.height).toBeLessThan(g.height);}
  }
 });
});
describe('roll date information',()=>{
 const old={id:'old',captureDate:parseCaptureDate('1995:07:08 12:00:00')},newer={id:'new',captureDate:parseCaptureDate('2024:02:29 12:00:00')},unknown={id:'unknown',captureDate:null};
 it('stably sorts known dates first without mutating the custom order',()=>{
  const items=[unknown,newer,{...newer,id:'same'},old,{...unknown,id:'unknown2'}];
  expect(orderByCaptureDate(items).map(p=>p.id)).toEqual(['old','new','same','unknown','unknown2']);expect(items[0].id).toBe('unknown');
 });
 it('never invents a footer date and only reports dates from that roll',()=>{
  expect(contactDateRange([unknown])).toBe('');expect(contactDateRange([newer,unknown])).toBe('2024-02-29');expect(contactDateRange([newer,unknown,old])).toBe('1995-07-08 – 2024-02-29');
 });
});
