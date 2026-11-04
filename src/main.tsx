import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,ArrowRight,Check,Download,Expand,Film,ArrowUpRight,ImagePlus,Layers,LoaderCircle,Moon,Sun,Plus,SlidersHorizontal,Trash2,X,Palette,Type,ShieldCheck} from 'lucide-react';
import {defaults,presets,fonts,fontLabels,loadFilmFont,renderFilm,safeFilename,type Settings} from './film';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/doto/latin-400.css';
import {readLettering,saveLettering} from './lettering';
import {getInitialTheme,applyTheme,rememberTheme,type Theme} from './theme';
import {exportOptions,readExportOption,rememberExportOption,getExportOption,encodeExport,formatFileSize} from './export';
import {Preview,type Photo} from '@/components/film-preview';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Slider} from '@/components/ui/slider';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {Checkbox} from '@/components/ui/checkbox';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Alert,AlertDescription} from '@/components/ui/alert';
import {cn} from '@/lib/utils';
import './style.css';
function App(){
 const [manageOpen,setManageOpen]=useState(false);
 const [exportOption,setExportOption]=useState(readExportOption);
 const [theme,setTheme]=useState<Theme>(getInitialTheme);
 useEffect(()=>{applyTheme(theme);},[theme]);
 function toggleTheme(){const next=theme==='dark'?'light':'dark';setTheme(next);rememberTheme(next);}
 const [photos,setPhotos]=useState<Photo[]>([]),[selected,setSelected]=useState<string[]>([]),[active,setActive]=useState<string>(''),[settings,setSettings]=useState<Settings>(()=>({...defaults,...readLettering()})),[scope,setScope]=useState<'all'|'selected'>('all'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[drag,setDrag]=useState(false),[expanded,setExpanded]=useState(false);
 const expandTrigger=useRef<HTMLButtonElement>(null),managerTrigger=useRef<HTMLButtonElement>(null),addTrigger=useRef<HTMLButtonElement>(null);
 const input=useRef<HTMLInputElement>(null),urls=useRef(new Set<string>());const current=photos.find(p=>p.id===active);const shown=current?.settings??settings;const index=Math.max(0,photos.findIndex(p=>p.id===active));
 useEffect(()=>{saveLettering(settings);},[settings]);
 useEffect(()=>()=>{urls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),6500);return()=>clearTimeout(t);},[message]);
 function change(patch:Partial<Settings>){if(scope==='selected'&&photos.length&&!selected.length){setMessage('请先勾选要调整的照片');return;}setSettings(s=>({...s,...patch}));setPhotos(ps=>ps.map(p=>scope==='all'||selected.includes(p.id)?{...p,settings:{...p.settings,...patch}}:p));}
 async function upload(files:FileList|File[]){
  if(busy)return;
  setBusy(true);let failed=0;const added:Photo[]=[];
  for(const file of Array.from(files)){
   if(!file.type.startsWith('image/')){failed++;continue;}
   const url=URL.createObjectURL(file);const image=new Image();image.src=url;
   try{await image.decode();if(image.naturalWidth*image.naturalHeight>100000000)throw Error();urls.current.add(url);added.push({id:crypto.randomUUID(),name:file.name,image,url,settings:{...settings}});}catch{failed++;URL.revokeObjectURL(url);}
  }
  setPhotos(ps=>[...ps,...added]);if(added.length){setActive(added[0].id);setSelected(added.map(p=>p.id));setManageOpen(false);}setBusy(false);setMessage(failed?`已导入 ${added.length} 张，${failed} 个文件无法读取（支持常见图片格式，单张不超过 1 亿像素）`:`已导入 ${added.length} 张照片`);
 }
 function remove(id:string){const p=photos.find(p=>p.id===id);if(p){URL.revokeObjectURL(p.url);urls.current.delete(p.url);}const rest=photos.filter(p=>p.id!==id);setPhotos(rest);setSelected(s=>s.filter(v=>v!==id));if(active===id)setActive(rest[0]?.id??'');}
 function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 async function exportPhotos(targets:Photo[]){
  if(!targets.length){input.current?.click();return;}
  const option=exportOption;setBusy(true);
  try{
   const Zip=targets.length>1?(await import('jszip')).default:null;
   const zip=Zip?new Zip():null;let totalBytes=0;
   for(let i=0;i<targets.length;i++){
    const p=targets[i];if(p.settings.textEnabled)await loadFilmFont(p.settings.font,p.settings.text);
    const canvas=document.createElement('canvas');let blob:Blob;
    try{
     renderFilm(canvas,p.image,p.image.naturalWidth,p.image.naturalHeight,p.settings,photos.indexOf(p),option.maxSize);
     blob=await encodeExport(canvas,option);
    }finally{canvas.width=canvas.height=0;}
    totalBytes+=blob.size;
    const name=safeFilename(p.name,option.extension);
    if(targets.length===1)download(blob,name);else zip?.file(`${String(i+1).padStart(2,'0')}-${name}`,blob);
   }
   if(zip){const archive=await zip.generateAsync({type:'blob'});totalBytes=archive.size;download(archive,'film-block.zip');}
   setMessage(`已导出 ${targets.length} 张照片 · ${option.extension==='jpg'?'JPEG':'PNG'} · ${formatFileSize(totalBytes)}`);
  }catch{setMessage('导出失败，请减少照片数量后重试');}finally{setBusy(false);}
 }

 const target=scope==='all'?photos:photos.filter(p=>selected.includes(p.id));
 const choosePhoto=(id:string)=>{setActive(id);if(scope==='selected')setSelected(ids=>ids.includes(id)?ids:[...ids,id]);};
 const togglePhoto=(id:string)=>{
  const next=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];setSelected(next);
  if(!selected.includes(id))setActive(id);else if(active===id&&next.length)setActive(next[0]);
 };
 const selectAll=()=>setSelected(selected.length===photos.length?[]:photos.map(p=>p.id));
 const fieldClass='h-11! w-full text-sm';
 return <div className="min-h-svh bg-background text-foreground">
  <header className="sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
   <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:h-16">
    <a href="./" className="brand flex min-w-0 items-center gap-2 font-semibold tracking-wider"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Film className="size-5"/></span><h1 className="whitespace-nowrap text-base sm:text-lg">FILM BLOCK</h1></a>
    <span className="ml-3 hidden text-xs text-muted-foreground md:inline">给日常，一圈胶片的温度。</span>
    <div className="ml-auto flex items-center gap-1"><Button variant="ghost" size="icon" className="size-11 rounded-full" aria-label={theme==='dark'?'切换浅色模式':'切换深色模式'} onClick={toggleTheme}>{theme==='dark'?<Sun/>:<Moon/>}</Button><Button variant="ghost" className="h-11 gap-1 rounded-full px-2 text-xs" asChild><a aria-label="GitHub 仓库" href="https://github.com/pomelo-chuan/film-block" target="_blank" rel="noreferrer">GitHub<ArrowUpRight className="size-3.5"/></a></Button></div>
   </div>
  </header>
  <main className="mx-auto max-w-7xl px-3 pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-5 lg:pb-8">
   <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
    <div className="min-w-0 space-y-4">
     <section className="studio overflow-hidden rounded-2xl border bg-card shadow-xs" aria-label="照片预览">
      <div className="flex min-h-12 items-center gap-2 border-b px-3 sm:px-4"><span className="size-1.5 shrink-0 rounded-full bg-primary"/><span className="text-xs font-medium">实时预览</span><Badge variant="secondary" className="rounded-md text-[10px]">{photos.length?shown.format:'示例'}</Badge><span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{current?.name??'上传照片，开始创作'}</span><Button variant="ghost" size="icon" className="size-11 shrink-0" ref={expandTrigger} aria-label="放大预览" onClick={()=>setExpanded(true)}><Expand/></Button></div>
      <div className={cn('preview-stage',drag&&'outline-2 -outline-offset-4 outline-primary')} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);void upload(e.dataTransfer.files);}}>
       <div className="photo-mat"><Preview photo={current} settings={shown} index={index}/></div>
       {drag&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 text-sm font-medium"><ImagePlus className="size-8"/>松开以导入照片</div>}
      </div>
      <div className="flex min-h-12 items-center justify-between gap-2 border-t px-3 sm:px-4"><span className="truncate text-[11px] text-muted-foreground">{current?`${current.image.naturalWidth} × ${current.image.naturalHeight} · ${index+1} / ${photos.length}`:'示例照片 · 本地处理'}</span><div className="flex items-center"><Button variant="ghost" size="icon" className="size-11" aria-label="上一张" disabled={index===0||!photos.length} onClick={()=>setActive(photos[index-1].id)}><ArrowLeft/></Button><Button variant="ghost" size="icon" className="size-11" aria-label="下一张" disabled={index>=photos.length-1} onClick={()=>setActive(photos[index+1].id)}><ArrowRight/></Button></div></div>
     </section>
     <section aria-label="照片列表" className="min-w-0">
      <div className="mb-2 flex items-center gap-2"><h2 className="text-sm font-semibold">我的底片</h2><Badge variant="secondary" className="tabular-nums">{photos.length}</Badge><div className="ml-auto flex gap-1">{photos.length>0&&<Button variant="ghost" className="h-11 px-3 text-xs" ref={managerTrigger} onClick={()=>setManageOpen(true)}><Layers/>管理<span className="hidden sm:inline">照片</span></Button>}<Button variant="outline" className="h-11 px-3 text-xs" ref={addTrigger} disabled={busy} onClick={()=>input.current?.click()}><Plus/>添加照片</Button></div></div>
      <Input ref={input} type="file" accept="image/*" multiple hidden className="hidden" aria-label="上传照片" onChange={e=>{if(e.target.files)void upload(e.target.files);e.target.value='';}}/>
      {photos.length?<div className="filmstrip -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pt-1 pb-2" aria-label="照片缩略图">{photos.map((p,i)=><article key={p.id} className={cn('relative w-20 shrink-0 snap-start overflow-hidden rounded-xl border bg-card sm:w-28',active===p.id&&'border-primary ring-1 ring-primary')}><Button variant="ghost" className="thumbnail h-20 w-full rounded-none p-2 sm:h-28" aria-label={`预览 ${p.name}`} onClick={()=>choosePhoto(p.id)}><Preview photo={p} settings={p.settings} index={i}/></Button><span className="pointer-events-none absolute top-1 left-1 rounded-sm bg-background/90 px-1 text-[9px] text-muted-foreground">{String(i+1).padStart(2,'0')}</span>{selected.includes(p.id)&&<span className="pointer-events-none absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="size-2.5"/></span>}</article>)}<Button variant="outline" className="h-[82px] w-16 shrink-0 flex-col gap-2 rounded-xl border-dashed sm:h-[114px] sm:w-24" disabled={busy} onClick={()=>input.current?.click()}><Plus className="size-5"/><span className="text-xs">继续添加</span></Button></div>:<Button variant="outline" className="flex h-20 w-full gap-3 rounded-xl border-dashed bg-muted/30 px-4 whitespace-normal" disabled={busy} onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(e.dataTransfer.files);}}><ImagePlus className="size-6! shrink-0 text-primary"/><span className="min-w-0 text-left"><span className="block text-sm">{busy?'正在读取照片…':'添加你的第一张照片'}</span><span className="mt-1 block text-[11px] font-normal text-muted-foreground">点击选择或拖入 · 支持多张 JPG / PNG / WebP</span></span></Button>}
     </section>
    </div>
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-20" aria-label="胶片设置">
     <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="hidden items-center gap-2 px-4 pt-4 pb-3 lg:flex"><SlidersHorizontal className="size-4 text-primary"/><h2 className="text-sm font-semibold">胶片配方</h2><span className="ml-auto text-[11px] text-muted-foreground">实时生效</span></div>
      <div className="px-4 pt-3 pb-3 lg:pt-0"><ToggleGroup type="single" value={scope} onValueChange={value=>{if(value!=='all'&&value!=='selected')return;setScope(value);if(value==='selected'&&selected.length&&!selected.includes(active))setActive(selected[0]);}} variant="outline" className="w-full" aria-label="调整范围"><ToggleGroupItem value="all" className="h-11 flex-1 text-xs" aria-label="统一调整"><Layers/>全部照片 {photos.length||''}</ToggleGroupItem><ToggleGroupItem value="selected" className="h-11 flex-1 text-xs" aria-label="仅选中">仅选中 {selected.length}</ToggleGroupItem></ToggleGroup></div>
      <Tabs defaultValue="film" className="gap-0"><TabsList className="mx-4 h-11! w-[calc(100%-2rem)] rounded-lg" aria-label="胶片设置分类"><TabsTrigger value="film" className="min-h-10"><Film/>胶卷</TabsTrigger><TabsTrigger value="base" className="min-h-10"><Palette/>片基</TabsTrigger><TabsTrigger value="text" className="min-h-10"><Type/>文字</TabsTrigger></TabsList>
       <TabsContent value="film" className="space-y-3 p-4"><div className="grid grid-cols-2 gap-2">{(['135','120'] as const).map(f=><Button key={f} variant="outline" className={cn('h-20 flex-col items-start gap-1 rounded-xl px-4 text-left',shown.format===f&&'border-primary bg-primary/8')} aria-label={`选择 ${f} 胶卷`} aria-pressed={shown.format===f} onClick={()=>change({format:f})}><span className="flex w-full items-center justify-between text-lg font-semibold">{f}{shown.format===f&&<Check className="size-4 text-primary"/>}</span><span className="text-[11px] font-normal text-muted-foreground">{f==='135'?'35 mm · 标准齿孔':'61 mm · 无齿孔'}</span></Button>)}</div><p className="text-xs leading-relaxed text-muted-foreground">{shown.format==='135'?'双侧标准齿孔，按照片比例自动排列。':'中画幅无齿孔片基，保留照片原有比例。'}</p></TabsContent>
       <TabsContent value="base" className="space-y-4 p-4"><div className="flex flex-wrap gap-2" aria-label="片基颜色预设">{presets.map(p=><Button key={p.color} variant="ghost" size="icon" className={cn('size-11 rounded-full border-2 p-1',shown.color===p.color?'border-primary':'border-transparent')} aria-label={p.name} aria-pressed={shown.color===p.color} title={p.name} onClick={()=>change({color:p.color,ink:p.ink})}><span className="flex size-8 items-center justify-center rounded-full border border-black/10" style={{backgroundColor:p.color}}>{shown.color===p.color&&<Check className="size-4" style={{color:p.ink}}/>}</span></Button>)}<Label className="relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed text-muted-foreground" title="自定义片基颜色"><Plus className="size-4"/><input type="color" aria-label="自定义片基颜色" className="absolute inset-0 size-full cursor-pointer opacity-0" value={shown.color} onChange={e=>change({color:e.target.value})}/></Label></div><div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{presets.find(p=>p.color===shown.color)?.name??'自定义颜色'}</span><code>{shown.color.toUpperCase()}</code></div><div className="space-y-2"><Label htmlFor="texture" className="text-xs">片基图案</Label><Select value={shown.texture} onValueChange={value=>change({texture:value as Settings['texture']})}><SelectTrigger id="texture" className={fieldClass} aria-label="片基图案"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="smooth" className="min-h-11">纯色片基</SelectItem><SelectItem value="grain" className="min-h-11">细颗粒纹理</SelectItem></SelectContent></Select></div></TabsContent>
       <TabsContent value="text" className="space-y-4 p-4"><div className="flex min-h-11 items-center justify-between gap-3"><Label htmlFor="text-enabled" className="flex min-h-11 flex-1 cursor-pointer items-center">显示片基文字</Label><Switch id="text-enabled" aria-label="显示片基文字" checked={shown.textEnabled} onCheckedChange={checked=>change({textEnabled:checked})}/></div><fieldset disabled={!shown.textEnabled} className="min-w-0 space-y-4 disabled:opacity-45"><div className="space-y-2"><Label htmlFor="edge-text" className="text-xs">片基文字</Label><Input id="edge-text" className="h-11 text-base sm:text-sm" maxLength={80} value={shown.text} onChange={e=>change({text:e.target.value})} placeholder="写下相机、胶卷或一句心情"/></div><div className="space-y-2"><Label htmlFor="font" className="text-xs">像素字体</Label><Select disabled={!shown.textEnabled} value={shown.font} onValueChange={value=>change({font:value as Settings['font']})}><SelectTrigger id="font" className={fieldClass} aria-label="像素字体"><SelectValue/></SelectTrigger><SelectContent>{fonts.map(font=><SelectItem key={font} value={font} className="min-h-11">{fontLabels[font]}</SelectItem>)}</SelectContent></Select></div><div><div className="flex items-center justify-between text-xs"><Label htmlFor="font-size" className="text-xs">文字大小</Label><span className="tabular-nums text-muted-foreground">{shown.fontSize}</span></div><Slider id="font-size" aria-label="文字大小" className="h-11" disabled={!shown.textEnabled} min={18} max={40} step={1} value={[shown.fontSize]} onValueChange={([value])=>change({fontSize:value})}/></div><div className="flex items-center justify-between gap-2"><span className="text-[11px] text-muted-foreground">开源字体 · 支持中英文</span><Label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">字色<input type="color" aria-label="文字颜色" className="size-9 cursor-pointer rounded-md border bg-transparent p-1" value={shown.ink} onChange={e=>change({ink:e.target.value})}/></Label></div></fieldset></TabsContent>
      </Tabs>
     </section>
     <section className="export-dock m-0! fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:z-auto lg:rounded-2xl lg:border lg:bg-card lg:p-4 lg:shadow-xs lg:backdrop-blur-none" aria-label="导出照片">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-end gap-3 lg:grid-cols-1"><div className="min-w-0 space-y-1.5"><Label htmlFor="export-quality" className="text-[11px] text-muted-foreground">导出质量</Label><Select disabled={busy} value={exportOption.id} onValueChange={value=>{const option=getExportOption(value);setExportOption(option);rememberExportOption(option.id);}}><SelectTrigger id="export-quality" aria-label="导出质量" className="h-11! w-full bg-background text-xs"><SelectValue>{exportOption.id==='balanced'?'均衡（推荐）':exportOption.label}</SelectValue></SelectTrigger><SelectContent>{exportOptions.map(option=><SelectItem key={option.id} value={option.id} className="min-h-12"><div className="flex flex-col gap-1"><span>{option.label}</span><span className="text-[10px] text-muted-foreground">{option.description}</span></div></SelectItem>)}</SelectContent></Select></div><Button className="export-button h-11 w-full gap-2 rounded-lg text-sm" disabled={busy||(photos.length>0&&target.length===0)} onClick={()=>void exportPhotos(target)}>{busy?<LoaderCircle className="size-4 animate-spin"/>:<Download className="size-4"/>}<span className="truncate">{busy?'正在处理…':photos.length?`导出${scope==='all'?'全部':'选中'}${target.length}张`:'添加照片'}</span></Button></div><p className="mt-2 hidden text-[11px] leading-relaxed text-muted-foreground lg:block">{exportOption.description}</p>
     </section>
     <p className="hidden items-center justify-center gap-1.5 pt-3 text-[11px] text-muted-foreground lg:flex"><ShieldCheck className="size-3.5"/>照片仅在本机处理，不上传服务器</p>
    </aside>
   </div>
   <footer className="mt-6 flex items-center justify-between gap-3 border-t pt-4 text-[10px] text-muted-foreground"><span>FILM BLOCK</span><span className="flex items-center gap-1"><ShieldCheck className="size-3"/>本地处理 · 私密创作</span></footer>
  </main>
  <Sheet open={manageOpen} onOpenChange={setManageOpen}><SheetContent onCloseAutoFocus={event=>{event.preventDefault();(managerTrigger.current??addTrigger.current)?.focus();}} side="bottom" showCloseButton={false} className="mx-auto max-h-[85dvh] max-w-3xl gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"><SheetHeader className="pr-16"><SheetTitle>管理照片</SheetTitle><SheetDescription>已选择 {selected.length} / {photos.length} 张 · 选择照片后可单独调整</SheetDescription></SheetHeader><SheetClose asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 size-11" aria-label="关闭照片管理"><X/></Button></SheetClose><Separator/><div className="flex items-center justify-between gap-3 px-4 py-2"><Button variant="ghost" className="h-11 px-2" onClick={selectAll}>{selected.length===photos.length?'取消全选':'全选'}</Button><Button variant="outline" className="h-11" disabled={busy} onClick={()=>input.current?.click()}><Plus/>添加照片</Button></div><div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((p,i)=><article key={p.id} className={cn('overflow-hidden rounded-xl border bg-muted/30',active===p.id&&'border-primary')}><Button variant="ghost" className="h-32 w-full rounded-none p-3" aria-label={`预览 ${p.name}`} onClick={()=>{choosePhoto(p.id);setManageOpen(false);}}><Preview photo={p} settings={p.settings} index={i}/></Button><div className="flex min-h-12 items-center border-t"><Label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3" htmlFor={`manage-${p.id}`}><Checkbox id={`manage-${p.id}`} className="size-5 shrink-0" aria-label={`选择 ${p.name}`} checked={selected.includes(p.id)} onCheckedChange={()=>togglePhoto(p.id)}/><span className="min-w-0 truncate text-xs">{p.name}</span></Label><Button variant="ghost" size="icon" className="size-11 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`删除 ${p.name}`} onClick={()=>remove(p.id)}><Trash2 className="size-4"/></Button></div></article>)}</div></div></SheetContent></Sheet>
  <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent onCloseAutoFocus={event=>{event.preventDefault();expandTrigger.current?.focus();}} showCloseButton={false} className="w-[calc(100%-1.5rem)] max-w-5xl! gap-2 p-3 pt-14 sm:p-6 sm:pt-14"><DialogTitle className="sr-only">放大预览</DialogTitle><DialogDescription className="sr-only">{current?.name??'示例照片'}的胶片边框效果</DialogDescription><DialogClose asChild><Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11" aria-label="关闭放大预览"><X/></Button></DialogClose><div className="zoom-preview flex h-[min(72dvh,800px)] min-w-0 items-center justify-center"><Preview photo={current} settings={shown} index={index} large/></div></DialogContent></Dialog>
  {message&&<Alert role="status" aria-live="polite" className="fixed right-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-3 z-[60] mx-auto w-auto max-w-md pr-14 shadow-lg lg:right-6 lg:bottom-6 lg:left-auto"><AlertDescription className="text-xs leading-relaxed text-foreground">{message}</AlertDescription><Button variant="ghost" size="icon" className="absolute top-0.5 right-1 size-11" aria-label="关闭提示" onClick={()=>setMessage('')}><X/></Button></Alert>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
