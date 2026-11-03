import {describe,it,expect} from 'vitest';
import {defaults,geometry,safeFilename} from './film';
describe('film export geometry',()=>{
 it('keeps portrait image dimensions while adding side rails',()=>{const g=geometry(1000,1500,defaults);expect(g.vertical).toBe(true);expect(g.width).toBe(1200);expect(g.height).toBe(1610);expect(g.x).toBe(100);expect(g.y).toBeCloseTo(55);});
 it('rotates rails for landscape images',()=>{const g=geometry(1500,1000,defaults);expect(g.vertical).toBe(false);expect(g.width).toBe(1610);expect(g.height).toBe(1200);});
 it('uses wider end borders for medium format without cropping',()=>{const g=geometry(1000,1000,{...defaults,format:'120'});expect(g.width-2*g.x).toBe(1000);expect(g.height-2*g.y).toBe(1000);expect(g.width).toBe(1170);});
 it('sanitizes export names',()=>expect(safeFilename('trip/photo.jpeg')).toBe('trip_photo-film.png'));
});
