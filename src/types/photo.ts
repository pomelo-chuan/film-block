import type { Settings } from "../film";
import type { CaptureDate } from "../photo-date";

export type Photo = {
  id: string;
  name: string;
  file: File;
  image: HTMLImageElement;
  url: string;
  width: number;
  height: number;
  captureDate: CaptureDate | null;
  settings: Settings;
};
