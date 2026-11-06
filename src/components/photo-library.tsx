import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Layers, Plus } from "lucide-react";
import type { RefObject } from "react";
import type { Photo } from "@/types/photo";
import { Button } from "./ui/button";
import { SortablePhoto } from "./sortable-photo";
type Props = {
  photos: Photo[];
  selected: string[];
  active: string;
  busy: boolean;
  managerTrigger: RefObject<HTMLButtonElement | null>;
  addTrigger: RefObject<HTMLButtonElement | null>;
  onManage: () => void;
  onAdd: () => void;
  onChoose: (id: string) => void;
  onActivate: (id: string) => void;
  onReorder: (from: string, to: string) => void;
};
export function PhotoLibrary({
  photos,
  selected,
  active,
  busy,
  managerTrigger,
  addTrigger,
  onManage,
  onAdd,
  onChoose,
  onActivate,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <section className="editor-library" aria-label="照片列表">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => onActivate(String(event.active.id))}
        onDragEnd={(event) => {
          if (!busy && event.over && event.active.id !== event.over.id)
            onReorder(String(event.active.id), String(event.over.id));
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "按空格键开始排序，使用方向键移动照片，再按空格键放下，按 Escape 取消。",
          },
        }}
      >
        <div className="filmstrip" aria-label="照片缩略图">
          {photos.length > 0 && (
            <Button
              ref={managerTrigger}
              variant="ghost"
              className="size-[60px] shrink-0 flex-col gap-1 rounded-lg border bg-muted/40 text-muted-foreground"
              aria-label="管理照片"
              title="管理照片"
              disabled={busy}
              onClick={onManage}
            >
              <Layers className="size-5" />
              <span className="text-[10px]">选择</span>
            </Button>
          )}
          <Button
            ref={addTrigger}
            variant="ghost"
            className="editor-add size-[60px] shrink-0 rounded-lg border bg-muted/60 text-primary"
            aria-label="添加照片"
            title="添加照片"
            disabled={busy}
            onClick={onAdd}
          >
            <Plus className="size-7!" />
          </Button>
          <SortableContext
            items={photos.map((photo) => photo.id)}
            strategy={horizontalListSortingStrategy}
          >
            {photos.map((photo, i) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={i}
                active={active === photo.id}
                selected={selected.includes(photo.id)}
                disabled={busy}
                onChoose={() => onChoose(photo.id)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </section>
  );
}
