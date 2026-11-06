import { useLayoutEffect, useState, type RefObject } from "react";
export function useCanvasBounds(
  ref: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!enabled || !canvas) return;
    const update = () => {
      const next = {
        left: canvas.offsetLeft,
        top: canvas.offsetTop,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };
      setBounds((old) =>
        Object.keys(next).every(
          (key) =>
            old[key as keyof typeof old] === next[key as keyof typeof next],
        )
          ? old
          : next,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    update();
    return () => observer.disconnect();
  }, [ref, enabled]);
  return bounds;
}
