"use client";

import React, { useState } from 'react';
import { 
  Plus, FileText, Link, AlignLeft, Trash2, Search, Eye, Folder, 
  Laptop, Globe, Cloud, FolderPlus, Sliders, Play, FileCode, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { showSuccess, showError } from '@/utils/toast';

export interface SourceChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  text: string;
  startIndex: number;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  content: string;
  wordCount: number;
  addedAt: string;
  checked?: boolean;
  folder?: string;
  chunks: SourceChunk[];
}

interface SourcePanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (id: string) => void;
  onAddSource: (source: Omit<Source, 'id' | 'addedAt' | 'wordCount' | 'chunks'>) => void;
  onDeleteSource: (id: string) => void;
  onToggleCheckSource: (id: string) => void;
  onAutoLabelFolders: () => void;
  researchMode: 'fast' | 'deep';
  onChangeResearchMode: (mode: 'fast' | 'deep') => void;
  highlightedChunkText?: string; 
}

export default function SourcePanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onAddSource,
  onDeleteSource,
  onToggleCheckSource,
  onAutoLabelFolders,
  researchMode,
  onChangeResearchMode,
  highlightedChunkText
}: SourcePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('local');

  const [previewSource, setPreviewSource] = useState<Source | null>(null);

  const handleAdd = (type: string) => {
    if (!newTitle.trim()) {
      showError("Please specify a document title.");
      return;
    }
    if (!newContent.trim()) {
      showError("Please paste raw textual copy to ingest.");
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
    showSuccess("Document chunks generated successfully!");
  };

  const getIcon = (type: string) => {
    if (type === 'pdf') return <FileText className="w-4.5 h-4.5 text-rose-500" />;
    if (type === 'youtube') return <Link className="w-4.5 h-4.5 text-red-500" />;
    if (type === 'url') return <Globe className="w-4.5 h-4.5 text-sky-500" />;
    return <AlignLeft className="w-4.5 h-4.5 text-emerald-600" />;
  };

  const filtered = sources.filter(src => 
    src.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    src.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#FAF9F6] dark:bg-[#121212] border-r border-slate-200 dark:border-slate-800 text-left">
      
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-[#FFFFFF] dark:bg-[#151515] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpenCheck className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-[11px] tracking-wider uppercase">Source Index</h2>
          </div>
          <Badge className="bg-teal-50 border border-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
            {sources.length} active
          </Badge>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#006a6a] hover:bg-[#005252] text-white rounded-2xl h-10 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
              <Plus className="w-4 h-4" /> Add Source Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-left shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-teal-600" /> Dynamic Grounding Hub
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 mt-1">
                Parsed entirely client-side. Compiled strictly in-memory safely.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full mt-3">
              <TabsList className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <TabsTrigger value="local" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-[#006a6a] data-[state=active]:text-white">
                  <Laptop className="w-3.5 h-3.5 mr-1" /> File Ingest
                </TabsTrigger>
                <TabsTrigger value="drive" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-[#006a6a] data-[state=active]:text-white">
                  <Cloud className="w-3.5 h-3.5 mr-1" /> GDrive
                </TabsTrigger>
                <TabsTrigger value="url" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-[#006a6a] data-[state=active]:text-white">
                  <Globe className="w-3.5 h-3.5 mr-1" /> URL Link
                </TabsTrigger>
                <TabsTrigger value="text" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-[#006a6a] data-[state=active]:text-white">
                  <AlignLeft className="w-3.5 h-3.5 mr-1" /> Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="space-y-3 pt-3">
                <Input
                  placeholder="Document Name (e.g. workspace-notes.pdf)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste extracted document context here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs rounded-xl resize-none"
                />
                <Button onClick={() => handleAdd('pdf')} className="w-full bg-[#006a6a] hover:bg-[#005252] text-white rounded-xl text-xs font-bold">Parse Document</Button>
              </TabsContent>

              <TabsContent value="drive" className="space-y-3 pt-3">
                <Input
                  placeholder="GDrive Document Name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste summary rows here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs rounded-xl resize-none"
                />
                <Button onClick={() => handleAdd('drive')} className="w-full bg-[#006a6a] hover:bg-[#005252] text-white rounded-xl text-xs font-bold">Import Shared Drive</Button>
              </TabsContent>

              <TabsContent value="url" className="space-y-3 pt-3">
                <Input
                  placeholder="Webpage URL link"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste summary webpage copy..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs rounded-xl resize-none"
                />
                <Button onClick={() => handleAdd('url')} className="w-full bg-[#006a6a] hover:bg-[#005252] text-white rounded-xl text-xs font-bold">Parse URL</Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-3 pt-3">
                <Input
                  placeholder="Study reference topic"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Type or paste study targets directly..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs rounded-xl resize-none"
                />
                <Button onClick={() => handleAdd('text')} className="w-full bg-[#006a6a] hover:bg-[#005252] text-white rounded-xl text-xs font-bold">Log Text</Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search local vector indices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-slate-100 dark:bg-slate-900 border-none rounded-full focus-visible:ring-teal-500 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {sources.length >= 5 && (
          <Button 
            onClick={onAutoLabelFolders}
            variant="outline" 
            size="xs" 
            className="w-full h-8 mb-4 border-dashed border-teal-200 text-teal-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-50/50"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Auto-Label Folder Nodes
          </Button>
        )}

        {filtered.length === 0 ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-teal-600 animate-pulse">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Workspace is empty</p>
              <p className="text-[10px] mt-1 max-w-[190px] mx-auto text-slate-400 leading-normal">
                Click "+ Add Source" to upload PDFs, URLs, and text notes. They will automatically compile into grounded indexes on-device.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(source => (
              <div
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={`group relative p-3.5 rounded-3xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                  selectedSourceId === source.id
                    ? 'bg-white border-teal-300 shadow-sm shadow-teal-500/5 ring-1 ring-teal-100/50'
                    : 'bg-[#FFFFFF] hover:bg-slate-50/70 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                }`}
              >
                <Checkbox
                  checked={!!source.checked}
                  onCheckedChange={() => onToggleCheckSource(source.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="border-slate-300 data-[state=checked]:bg-[#006a6a] rounded"
                />
                
                <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900">{getIcon(source.type)}</div>
                
                <div className="flex-1 min-w-0 pr-1 text-left">
                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 leading-snug truncate">
                    {source.title}
                  </p>
                  <span className="text-[9px] text-slate-400 font-bold">{source.wordCount} words • {source.chunks.length} chunks</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSource(source);
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                    title="Read Chunks"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSource(source.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-[#FFFFFF] border-t border-slate-200 dark:bg-slate-950 flex flex-col gap-2.5 shrink-0 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-teal-600" /> Grounding Strategy:
          </span>
          <Badge className="bg-teal-600 text-white text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 border-none">
            {researchMode} mode
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => onChangeResearchMode('fast')}
            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
              researchMode === 'fast' ? 'bg-white text-teal-700 shadow-sm font-black' : 'text-slate-500'
            }`}
          >
            Fast Synthesis
          </button>
          <button
            onClick={() => onChangeResearchMode('deep')}
            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
              researchMode === 'deep' ? 'bg-white text-teal-700 shadow-sm font-black' : 'text-slate-500'
            }`}
          >
            Deep Study
          </button>
        </div>
      </div>

      {/* Slide-overlay Source Preview */}
      <Sheet open={!!previewSource} onOpenChange={(open) => !open && setPreviewSource(null)}>
        <SheetContent side="left" className="w-[420px] bg-white p-6 flex flex-col h-full border-r border-slate-200 text-left">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-teal-600" /> File Preview & Highlights
            </SheetTitle>
            <SheetDescription className="text-xs">
              Previewing parsed content chunks for "{previewSource?.title}"
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 my-4 bg-slate-50 p-4 rounded-xl border">
            {previewSource?.chunks.map((chk, index) => {
              const isFlashed = highlightedChunkText && chk.text.includes(highlightedChunkText);
              return (
                <div 
                  key={chk.id} 
                  className={`p-3.5 rounded-2xl mb-3 border text-[11px] leading-relaxed transition-all ${
                    isFlashed 
                      ? 'bg-yellow-100 border-yellow-400 font-semibold animate-pulse scale-[1.01]' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 border-b pb-1">
                    <span className="font-mono text-[9px] text-slate-400">Index Chunk #{index + 1}</span>
                    <Badge className="bg-slate-100 text-[8px] text-slate-500 rounded-sm border-none">Chars {chk.text.length}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap">{chk.text}</p>
                </div>
              );
            })}
          </ScrollArea>
          
          <div className="flex justify-end pt-2 border-t">
            <Button size="sm" onClick={() => setPreviewSource(null)} className="bg-[#006a6a] hover:bg-[#005252] text-white rounded-full text-xs font-semibold">
              Dismiss Preview
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}