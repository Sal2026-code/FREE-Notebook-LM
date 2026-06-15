"use client";

import React, { useState } from 'react';
import { 
  Plus, FileText, Link, AlignLeft, Trash2, Search, Sparkles, BookOpenCheck, 
  ChevronDown, ChevronRight, Eye, Folder, Sliders, Laptop, FolderPlus, Globe, Cloud, MoreVertical, Edit, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { showSuccess, showError } from '@/utils/toast';

export interface Source {
  id: string;
  title: string;
  type: string; // pdf, docx, txt, md, epub, csv, xlsx, pptx, mp3, mp4, png, jpg, youtube, url etc
  content: string;
  wordCount: number;
  addedAt: string;
  folder?: string;
  checked?: boolean;
}

interface SourcePanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (id: string) => void;
  onAddSource: (source: Omit<Source, 'id' | 'addedAt' | 'wordCount'>) => void;
  onDeleteSource: (id: string) => void;
  onRenameSource: (id: string, newTitle: string) => void;
  onToggleCheckSource: (id: string) => void;
  onAutoLabelFolders: () => void;
  researchMode: 'fast' | 'deep';
  onChangeResearchMode: (mode: 'fast' | 'deep') => void;
}

export default function SourcePanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onAddSource,
  onDeleteSource,
  onRenameSource,
  onToggleCheckSource,
  onAutoLabelFolders,
  researchMode,
  onChangeResearchMode
}: SourcePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // New source ingestion states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('local');

  // Preview Drawer state
  const [previewSource, setPreviewSource] = useState<Source | null>(null);
  
  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleAdd = (type: string) => {
    if (!newTitle.trim()) {
      showError("Please enter a title or filename.");
      return;
    }
    if (!newContent.trim()) {
      showError("Please paste or provide content parsed data.");
      return;
    }

    onAddSource({
      title: newTitle.trim(),
      type,
      content: newContent.trim()
    });

    setNewTitle('');
    setNewContent('');
    setIsAddOpen(false);
    showSuccess("Source ingested into local database successfully!");
  };

  // Truncate to maximum 5 words display
  const truncateTitle = (title: string) => {
    const words = title.split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return title;
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (t === 'docx' || t === 'doc') return <FileText className="w-4 h-4 text-blue-500" />;
    if (t === 'csv' || t === 'xlsx') return <FileCode className="w-4 h-4 text-emerald-600" />;
    if (t === 'youtube' || t === 'mp3' || t === 'mp4') return <Link className="w-4 h-4 text-red-500" />;
    if (t === 'url') return <Globe className="w-4 h-4 text-sky-500" />;
    return <AlignLeft className="w-4 h-4 text-teal-600" />;
  };

  const filteredSources = sources.filter(src => 
    src.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    src.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sources by folder
  const folders: { [key: string]: Source[] } = {};
  const unassigned: Source[] = [];

  filteredSources.forEach(src => {
    if (src.folder) {
      if (!folders[src.folder]) {
        folders[src.folder] = [];
      }
      folders[src.folder].push(src);
    } else {
      unassigned.push(src);
    }
  });

  const handleSaveRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameSource(id, renameValue.trim());
      setRenamingId(null);
      showSuccess("Source renamed successfully!");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 text-left">
      
      {/* Sticky "+ Add Source" & header info */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpenCheck className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xs tracking-wider uppercase">Local Documents</h2>
          </div>
          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full text-[10px] border-none">
            {sources.length} active
          </Badge>
        </div>

        {/* 4-Tab Media Ingestion Modal Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-teal-100 dark:shadow-none transition-all">
              <Plus className="w-4 h-4" />
              Add Source Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Ingest Local Media & Files
              </DialogTitle>
              <p className="text-[11px] text-slate-500">
                Processed client-side. Unlimited uploads of PDF, DOCX, TXT, MD, EPUB, CSV, YouTube and more.
              </p>
            </DialogHeader>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full my-3">
              <TabsList className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <TabsTrigger value="local" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                  <Laptop className="w-3.5 h-3.5 mr-1" /> Local File
                </TabsTrigger>
                <TabsTrigger value="drive" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                  <Cloud className="w-3.5 h-3.5 mr-1" /> GDrive
                </TabsTrigger>
                <TabsTrigger value="url" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                  <Globe className="w-3.5 h-3.5 mr-1" /> Web/YouTube
                </TabsTrigger>
                <TabsTrigger value="text" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                  <AlignLeft className="w-3.5 h-3.5 mr-1" /> Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="space-y-3.5 pt-3">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag or click to choose study files</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, CSV, XLSX, PPTX, EPUB, MP3, MP4, PNG, JPG (100% Client-side)</p>
                </div>
                <Input
                  placeholder="Simulated Filename (e.g. quantum-physics-primer.pdf)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste raw textual string extraction to simulate file parse..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[100px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('pdf')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Ingest File</Button>
              </TabsContent>

              <TabsContent value="drive" className="space-y-3.5 pt-3">
                <p className="text-xs text-slate-500">Connect to Google Drive accounts. This client sandbox is securely isolated with zero cloud telemetry overhead.</p>
                <Input
                  placeholder="Document Title (e.g. Marketing Brief)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Enter study guide details or shared drive document body..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[100px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('docx')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Import from Drive</Button>
              </TabsContent>

              <TabsContent value="url" className="space-y-3.5 pt-3">
                <p className="text-xs text-slate-500">Provide an article website link, wiki URL, or a YouTube educational course video link for transcription parsing.</p>
                <Input
                  placeholder="Web link / YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste URL content transcript or page summary body string..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[100px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('youtube')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Fetch Link Data</Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-3.5 pt-3">
                <Input
                  placeholder="Rich Text Document Title (e.g. Biology lecture session 4)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Type or paste high fidelity raw study notes, transcripts, or reference datasets here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[140px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('text')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Ingest Text Notes</Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Filter / Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-slate-50/55 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-full focus-visible:ring-teal-500 text-xs"
          />
        </div>
      </div>

      {/* Sources Stream with Folder Accordion and auto-label engine */}
      <ScrollArea className="flex-1 p-4">
        {sources.length >= 5 && (
          <Button 
            onClick={onAutoLabelFolders}
            variant="outline" 
            size="xs" 
            className="w-full h-8 mb-4 border-dashed border-teal-200 hover:border-teal-500 text-teal-700 dark:text-teal-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Trigger Folder Auto-Label Engine
          </Button>
        )}

        {filteredSources.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <FileText className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No documents in study list</p>
            <p className="text-[10px] mt-1 max-w-[180px]">Add PDFs, drive files, or web pages above to ground your notebook.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Render grouped folders with Accordions */}
            {Object.keys(folders).map(folderName => (
              <Accordion type="single" collapsible key={folderName} className="border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/50">
                <AccordionItem value={folderName} className="border-none">
                  <AccordionTrigger className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:no-underline flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                    <span className="truncate flex-1 text-left">{folderName}</span>
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[9px] rounded-full px-1.5 shrink-0 ml-1">
                      {folders[folderName].length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="p-2 space-y-1.5 pt-0 border-t border-slate-100 dark:border-slate-800">
                    {folders[folderName].map(source => (
                      <div
                        key={source.id}
                        onClick={() => onSelectSource(source.id)}
                        className={`group relative p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          selectedSourceId === source.id
                            ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={!!source.checked}
                          onCheckedChange={() => onToggleCheckSource(source.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-slate-300 dark:border-slate-750 data-[state=checked]:bg-teal-600"
                        />
                        <div className="shrink-0">{getIconForType(source.type)}</div>
                        <div className="flex-1 min-w-0">
                          {renamingId === source.id ? (
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleSaveRename(source.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(source.id)}
                              className="h-6 py-0.5 px-1.5 text-[11px] rounded-md focus-visible:ring-teal-500"
                              autoFocus
                            />
                          ) : (
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug truncate">
                              {truncateTitle(source.title)}
                            </p>
                          )}
                          <span className="text-[9px] text-slate-400 font-semibold">{source.wordCount} words</span>
                        </div>

                        {/* Action controllers */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSource(source);
                            }}
                            className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl">
                              <DropdownMenuItem onClick={() => { setRenamingId(source.id); setRenameValue(source.title); }}>
                                Rename Source
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDeleteSource(source.id)} className="text-rose-500">
                                Delete Document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}

            {/* Render unassigned sources */}
            {unassigned.map(source => (
              <div
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={`group relative p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  selectedSourceId === source.id
                    ? 'bg-teal-50/45 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900 shadow-sm'
                    : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-150 dark:border-slate-800'
                }`}
              >
                <Checkbox
                  checked={!!source.checked}
                  onCheckedChange={() => onToggleCheckSource(source.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-teal-600"
                />
                <div className="shrink-0">{getIconForType(source.type)}</div>
                
                <div className="flex-1 min-w-0 pr-1">
                  {renamingId === source.id ? (
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleSaveRename(source.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(source.id)}
                      className="h-6 py-0.5 px-1.5 text-[11px] rounded-md focus-visible:ring-teal-500"
                      autoFocus
                    />
                  ) : (
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug truncate">
                      {truncateTitle(source.title)}
                    </p>
                  )}
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{source.wordCount} words</span>
                </div>

                {/* Hover tools */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSource(source);
                    }}
                    className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Quick Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl">
                      <DropdownMenuItem onClick={() => { setRenamingId(source.id); setRenameValue(source.title); }}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteSource(source.id)} className="text-rose-500">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

          </div>
        )}
      </ScrollArea>

      {/* PANE FOOTER with Fast vs Deep Research slider */}
      <div className="p-4 bg-slate-100/70 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            AI synthesis depth:
          </span>
          <Badge className="bg-teal-600 text-white hover:bg-teal-600 text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5">
            {researchMode} research
          </Badge>
        </div>

        {/* Toggle Slider widget */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => {
              onChangeResearchMode('fast');
              showSuccess("Switched to Instant Fast Q&A Research Mode!");
            }}
            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
              researchMode === 'fast'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Fast Q&A
          </button>
          <button
            onClick={() => {
              onChangeResearchMode('deep');
              showSuccess("Dossier Synthesis Deep Research Mode enabled!");
            }}
            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
              researchMode === 'deep'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Deep Research
          </button>
        </div>
      </div>

      {/* Raw text preview eye drawer */}
      <Sheet open={!!previewSource} onOpenChange={(open) => !open && setPreviewSource(null)}>
        <SheetContent side="left" className="w-[380px] bg-white dark:bg-slate-950 p-6 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 text-left">
          <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <SheetTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-teal-600" />
              Document Raw string string viewer
            </SheetTitle>
            <SheetDescription className="text-xs">
              Previewing: {previewSource?.title}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 my-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-mono leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {previewSource?.content}
            </p>
          </ScrollArea>
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" onClick={() => setPreviewSource(null)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-semibold">
              Close Preview
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}