import { useEffect, useRef, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
export function PreviewCarousel({
  ids,
  index,
  onSelect,
  render,
}: {
  ids: string[];
  index: number;
  onSelect: (index: number) => void;
  render: (index: number) => ReactNode;
}) {
  const startIndex = useRef(index);
  const [viewport, api] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: "trimSnaps",
    startIndex: startIndex.current,
  });
  const selection = useRef({ index, onSelect });
  selection.current = { index, onSelect };
  useEffect(() => {
    if (!api) return;
    api.scrollTo(selection.current.index, true);
    const selected = () => selection.current.onSelect(api.selectedScrollSnap());
    const reInit = () => api.scrollTo(selection.current.index, true);
    api.on("select", selected);
    api.on("reInit", reInit);
    return () => {
      api.off("select", selected);
      api.off("reInit", reInit);
    };
  }, [api]);
  useEffect(() => {
    if (api && api.selectedScrollSnap() !== index) api.scrollTo(index);
  }, [api, index]);
  return (
    <div
      className="preview-carousel"
      ref={viewport}
      role="region"
      aria-roledescription="轮播"
      aria-label="左右滑动预览"
    >
      <div className="preview-carousel-track">
        {ids.map((id, i) => (
          <div
            key={id}
            className="preview-carousel-slide"
            data-active={i === index}
            aria-hidden={i !== index}
            inert={i !== index}
            role="group"
            aria-roledescription="幻灯片"
            aria-label={`${i + 1} / ${ids.length}`}
          >
            <div className="photo-mat">
              {Math.abs(i - index) <= 1 ? render(i) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
