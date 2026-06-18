"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, FileText, Link, AlignLeft, Trash2, Search, Sparkles, BookOpenCheck, 
  ChevronDown, ChevronRight, Eye, Folder, Sliders, Laptop, FolderPlus, Globe, Cloud, MoreVertical, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  type: string;
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
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('local');

  const [previewSource, setPreviewSource] = useState<Source | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleAdd = (type: string) => {
    if (!newTitle.trim()) {
      showError("Please specify a document title.");
      return;
    }
    if (!newContent.trim()) {
      showError("Please paste raw text context parsed from file.");
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
    showSuccess("Source file indexed into client database!");
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (t === 'youtube') return <Link className="w-4 h-4 text-red-500" />;
    if (t === 'url') return <Globe className="w-4 h-4 text-sky-500" />;
    return <AlignLeft className="w-4 h-4 text-teal-600" />;
  };

  const filteredSources = sources.filter(src => 
    src.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    src.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 text-left">
      
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpenCheck className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xs tracking-wider uppercase">Source Files</h2>
          </div>
          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full text-[10px] border-none">
            {sources.length} total
          </Badge>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 font-bold text-xs flex items-center justify-center gap-2 transition-all">
              <Plus className="w-4 h-4" />
              Add Source Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Ingest Source Document
              </DialogTitle>
              <p className="text-[11px] text-slate-500">
                Processed 100% locally. No servers, absolute privacy guaranteed.
              </p>
            </DialogHeader>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full my-3">
              <TabsList className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <TabsTrigger value="local" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <Laptop className="w-3.5 h-3.5 mr-1" /> File
                </TabsTrigger>
                <TabsTrigger value="drive" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <Cloud className="w-3.5 h-3.5 mr-1" /> Drive
                </TabsTrigger>
                <TabsTrigger value="url" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <Globe className="w-3.5 h-3.5 mr-1" /> URL
                </TabsTrigger>
                <TabsTrigger value="text" className="text-[10px] sm:text-xs font-bold rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <AlignLeft className="w-3.5 h-3.5 mr-1" /> Paste
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="space-y-3 pt-3">
                <Input
                  placeholder="Document Title (e.g., lecture-notes.txt)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste raw textual string extraction to compile document chunks..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('pdf')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Add Source File</Button>
              </TabsContent>

              <TabsContent value="drive" className="space-y-3 pt-3">
                <Input
                  placeholder="Document Title (e.g., Briefing Sheet)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste context lines from GDrive shared folder..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('docx')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Import Google Drive Source</Button>
              </TabsContent>

              <TabsContent value="url" className="space-y-3 pt-3">
                <Input
                  placeholder="URL link target"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Paste webpage summary or YouTube course transcripts..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('url')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Import URL Index</Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-3 pt-3">
                <Input
                  placeholder="Pasted Study Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
                <Textarea
                  placeholder="Write or paste study details..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px] text-xs resize-none rounded-xl"
                />
                <Button onClick={() => handleAdd('text')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">Ingest Text Block</Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 rounded-full focus-visible:ring-teal-500 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {sources.length >= 5 && (
          <Button 
            onClick={onAutoLabelFolders}
            variant="outline" 
            size="xs" 
            className="w-full h-8 mb-4 border-dashed border-teal-200 hover:border-teal-500 text-teal-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Auto-Label Folder Organization
          </Button>
        )}

        {filteredSources.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <FileText className="w-10 h-10 stroke-1 text-teal-600 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No source documents loaded</p>
              <p className="text-[10px] mt-1 max-w-[190px] mx-auto text-slate-400 leading-normal">
                Upload PDFs, URLs, Drive files, or paste custom notes to boot up your study workspace.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(folders).map(folderName => (
              <Accordion type="single" collapsible key={folderName} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white">
                <AccordionItem value={folderName} className="border-none">
                  <AccordionTrigger className="px-3 py-2 text-xs font-bold text-slate-700 hover:no-underline flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                    <span className="truncate flex-1 text-left">{folderName}</span>
                    <Badge className="bg-slate-100 text-slate-600 font-bold text-[9px] rounded-full px-1.5 ml-1">
                      {folders[folderName].length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="p-2 space-y-1.5 pt-0 border-t border-slate-100">
                    {folders[folderName].map(source => (
                      <div
                        key={source.id}
                        onClick={() => onSelectSource(source.id)}
                        className={`group relative p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          selectedSourceId === source.id
                            ? 'bg-teal-50/40 border-teal-200'
                            : 'bg-white hover:bg-slate-50 border-slate-100'
                        }`}
                      >
                        <Checkbox
                          checked={!!source.checked}
                          onCheckedChange={() => onToggleCheckSource(source.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-slate-300 data-[state=checked]:bg-teal-600"
                        />
                        <div className="shrink-0">{getIconForType(source.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 leading-snug truncate">
                            {source.title}
                          </p>
                          <span className="text-[9px] text-slate-400 font-semibold">{source.wordCount} words</span>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}

            {unassigned.map(source => (
              <div
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={`group relative p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  selectedSourceId === source.id
                    ? 'bg-teal-50/45 border-teal-200 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-150'
                }`}
              >
                <Checkbox
                  checked={!!source.checked}
                  onCheckedChange={() => onToggleCheckSource(source.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="border-slate-300 data-[state=checked]:bg-teal-600"
                />
                <div className="shrink-0">{getIconForType(source.type)}</div>
                
                <div className="flex-1 min-w-0 pr-1 text-left">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug truncate">
                    {source.title}
                  </p>
                  <span className="text-[9px] text-slate-400 font-semibold">{source.wordCount} words</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSource(source);
                    }}
                    className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                    title="Quick Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSource(source.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            AI Synthesis Depth:
          </span>
          <Badge className="bg-teal-600 text-white text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 border-none">
            {researchMode} Mode
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => {
              onChangeResearchMode('fast');
              showSuccess("Set search speed to Fast Q&A!");
            }}
            className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
              researchMode === 'fast'
                ? 'bg-white text-teal-700 shadow-sm'
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
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Deep Research
          </button>
        </div>
      </div>

      <Sheet open={!!previewSource} onOpenChange={(open) => !open && setPreviewSource(null)}>
        <SheetContent side="left" className="w-[380px] bg-white p-6 flex flex-col h-full border-r border-slate-200 text-left">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-teal-600" />
              Raw Source Text preview
            </SheetTitle>
            <SheetDescription className="text-xs">
              Reviewing: {previewSource?.title}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 my-4 bg-slate-50 p-4 rounded-xl border">
            <p className="text-[11px] font-mono leading-relaxed text-slate-700 whitespace-pre-wrap">
              {previewSource?.content}
            </p>
          </ScrollArea>
          <div className="flex justify-end pt-2 border-t">
            <Button size="sm" onClick={() => setPreviewSource(null)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-semibold">
              Close Preview
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}