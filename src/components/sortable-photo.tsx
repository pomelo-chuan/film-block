import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Check} from 'lucide-react';
import {Button} from './ui/button';
import {Preview,type Photo} from './film-preview';
import {cn} from '@/lib/utils';
export function SortablePhoto({photo,index,active,selected,disabled,onChoose}:{photo:Photo;index:number;active:boolean;selected:boolean;disabled:boolean;onChoose:()=>void}){
 const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:photo.id,disabled});
 return <article ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition,opacity:isDragging?.5:1,zIndex:isDragging?1:undefined}} className={cn('relative size-[60px] shrink-0 overflow-hidden rounded-lg border-2 bg-muted/30',active?'border-primary':'border-transparent')}>
  <Button ref={setActivatorNodeRef} {...attributes} {...listeners} variant="ghost" disabled={disabled} className="thumbnail size-full touch-manipulation select-none rounded-none p-0.5" aria-label={`预览 ${photo.name}`} title={`${photo.name} · 长按拖动排序`} onContextMenu={event=>event.preventDefault()} onClick={onChoose}><Preview photo={photo} settings={photo.settings} index={index}/></Button>
  <span className="pointer-events-none absolute top-0.5 left-0.5 rounded bg-background/85 px-1 text-[9px] tabular-nums text-foreground">{index+1}</span>
  {selected&&<span className="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="size-2.5"/></span>}
 </article>;
}
