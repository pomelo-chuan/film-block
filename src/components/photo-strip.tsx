import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
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
import type { Photo } from "@/types/photo";
import { SortablePhoto } from "./sortable-photo";
export function PhotoStrip({
  photos,
  selected,
  active,
  busy,
  onChoose,
  onActivate,
  onReorder,
}: {
  photos: Photo[];
  selected: string[];
  active: string;
  busy: boolean;
  onChoose: (id: string) => void;
  onActivate: (id: string) => void;
  onReorder: (from: string, to: string) => void;
}) {
  useTranslation();
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => onActivate(String(event.active.id))}
      onDragEnd={(event) => {
        if (!busy && event.over && event.active.id !== event.over.id)
          onReorder(String(event.active.id), String(event.over.id));
      }}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            t("已拿起照片 {{name}}", {
              name: photos.find((photo) => photo.id === active.id)?.name ?? "",
            }),
          onDragOver: ({ over }) =>
            over
              ? t("照片移动到第 {{position}} 位", {
                  position:
                    photos.findIndex((photo) => photo.id === over.id) + 1,
                })
              : undefined,
          onDragEnd: ({ over }) =>
            over
              ? t("排序完成，位置 {{position}}", {
                  position:
                    photos.findIndex((photo) => photo.id === over.id) + 1,
                })
              : t("已取消排序"),
          onDragCancel: () => t("已取消排序"),
        },
        screenReaderInstructions: {
          draggable: t(
            "按空格键开始排序，使用方向键移动照片，再按空格键放下，按 Escape 取消。",
          ),
        },
      }}
    >
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
    </DndContext>
  );
}
