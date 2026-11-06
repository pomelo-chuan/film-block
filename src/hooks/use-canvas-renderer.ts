import { useEffect, useRef, useState } from "react";
type Draw = (
  canvas: HTMLCanvasElement,
  cancelled: () => boolean,
) => void | Promise<void>;
export function useCanvasRenderer(draw: Draw, delay = 0) {
  const ref = useRef<HTMLCanvasElement>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false,
      frame = 0;
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        const buffer = document.createElement("canvas");
        void Promise.resolve()
          .then(() => draw(buffer, () => cancelled))
          .then(() => {
            if (cancelled || !ref.current) return;
            const canvas = ref.current;
            canvas.width = buffer.width;
            canvas.height = buffer.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw Error("浏览器不支持 Canvas");
            ctx.drawImage(buffer, 0, 0);
            setFailed(false);
          })
          .catch(() => {
            if (!cancelled) setFailed(true);
          })
          .finally(() => {
            buffer.width = buffer.height = 0;
          });
      });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [draw, delay]);
  return { ref, failed };
}
