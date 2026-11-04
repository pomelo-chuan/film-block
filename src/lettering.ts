import {defaults, fonts, type Settings} from './film';

type Lettering = Pick<Settings, 'text' | 'textEnabled' | 'font' | 'fontSize' | 'ink' | 'dateStampEnabled'>;
export const LETTERING_KEY = 'film-room:lettering:v1';

export function readLettering(storage?: Pick<Storage, 'getItem'>): Partial<Lettering> {
  try {
    const value: unknown = JSON.parse((storage ?? window.localStorage).getItem(LETTERING_KEY) ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const saved = value as Record<string, unknown>;
    const result: Partial<Lettering> = {};
    if (typeof saved.text === 'string') result.text = saved.text.slice(0, 80);
    if (typeof saved.dateStampEnabled === 'boolean') result.dateStampEnabled = saved.dateStampEnabled;
    if (typeof saved.textEnabled === 'boolean') result.textEnabled = saved.textEnabled;
    if (saved.font === 'Pixelify Sans') result.font = defaults.font;
    if (fonts.includes(saved.font as Settings['font'])) result.font = saved.font as Settings['font'];
    if (typeof saved.fontSize === 'number' && Number.isFinite(saved.fontSize)) result.fontSize = Math.min(40, Math.max(18, saved.fontSize));
    if (typeof saved.ink === 'string' && /^#[0-9a-f]{6}$/i.test(saved.ink)) result.ink = saved.ink;
    return result;
  } catch {
    return {};
  }
}

export function saveLettering(settings: Settings, storage?: Pick<Storage, 'setItem'>): void {
  const {text, textEnabled, font, fontSize, ink, dateStampEnabled} = settings;
  try {
    (storage ?? window.localStorage).setItem(LETTERING_KEY, JSON.stringify({text, textEnabled, font, fontSize, ink, dateStampEnabled}));
  } catch {
    // Storage restrictions must not prevent editing or exporting photographs.
  }
}
