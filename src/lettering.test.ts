import {describe, it, expect} from 'vitest';
import {defaults} from './film';
import {LETTERING_KEY, readLettering, saveLettering} from './lettering';

describe('lettering preferences', () => {
  it('round-trips disabled lettering and Doto without storing photograph or frame settings', () => {
    const data = new Map<string, string>();
    const storage = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => {data.set(key, value);}};
    saveLettering({...defaults, text: '旅行记录', textEnabled: false, font: 'Doto', fontSize: 36}, storage);
    expect(readLettering(storage)).toEqual({text: '旅行记录', textEnabled: false, font: 'Doto', fontSize: 36, ink: defaults.ink, dateStampEnabled:true});
    expect(JSON.parse(data.get(LETTERING_KEY)!)).not.toHaveProperty('format');
  });
  it('validates damaged or outdated storage and bounds text input', () => {
    expect(readLettering({getItem: () => '{invalid json'})).toEqual({});
    expect(readLettering({getItem: () => JSON.stringify({text: 'x'.repeat(100), textEnabled: 'false', font: 'Missing', fontSize: 500, ink: 'bad'})})).toEqual({text: 'x'.repeat(80), fontSize: 40});
  });
  it('migrates retired Pixelify Sans to the bilingual default without losing text', () => {
    expect(readLettering({getItem: () => '{"text":"记忆 Memory","font":"Pixelify Sans","textEnabled":false}'})).toEqual({text:'记忆 Memory',font:'Fusion Pixel 12',textEnabled:false});
  });
  it('remembers the independent camera date switch', () => {
    expect(readLettering({getItem: () => '{"textEnabled":false,"dateStampEnabled":true}'})).toEqual({textEnabled:false,dateStampEnabled:true});
    expect(readLettering({getItem: () => '{"dateStampEnabled":false}'})).toEqual({dateStampEnabled:false});
  });
  it('preserves an intentionally empty label', () => {
    expect(readLettering({getItem: () => '{"text":""}'})).toEqual({text: ''});
  });
  it('continues when browser storage is unavailable', () => {
    expect(readLettering({getItem: () => {throw new Error('blocked');}})).toEqual({});
    expect(() => saveLettering(defaults, {setItem: () => {throw new Error('quota exceeded');}})).not.toThrow();
  });
});
