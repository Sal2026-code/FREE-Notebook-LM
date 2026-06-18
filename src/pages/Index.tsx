"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import SourcePanel, { Source } from '@/components/SourcePanel';
import WorkspacePanel, { ChatMessage, Note } from '@/components/WorkspacePanel';
import AudioStudyPanel, { Flashcard } from '@/components/AudioStudyPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { Files, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { 
  loadNotebookState, 
  saveNotebookState, 
  NotebookState, 
  generateDynamicFlashcards, 
  generateDynamicQuizzes, 
  generateDynamicSlides,
  Slide
} from '@/utils/db';

export default function Index() {
  const [state, setState] = useState<NotebookState>({
    notebookTitle: "My Clean Workspace",
    sources: [],
    notes: [],
    messages: [
      {
        id: 'm-init',
        sender: 'ai',
        text: "Welcome to absolutelyfreenotebooklm.com! Start by uploading your files, links, or notes in the left pane. All processing and indexing are done securely and privately inside your web browser.",
        timestamp: 'Just now'
      }
    ],
    researchMode: 'fast',
    language: 'en'
  });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

  useEffect(() => {
    saveNotebookState(state);
  }, [state]);

  const dynamicFlashcards = useMemo(() => {
    return generateDynamicFlashcards(state.sources);
  }, [state.sources]);

  const dynamicQuizzes = useMemo(() => {
    return generateDynamicQuizzes(state.sources);
  }, [state.sources]);

  const baseSlides = useMemo(() => {
    return generateDynamicSlides(state.sources);
  }, [state.sources]);

  useEffect(() => {
    setEditedSlides(baseSlides);
  }, [baseSlides]);

  const handleRenameTitle = (newTitle: string) => {
    setState(prev => ({ ...prev, notebookTitle: newTitle }));
  };

  const handleLanguageChange = (lang: string) => {
    setState(prev => ({ ...prev, language: lang }));
    showSuccess(`Language set to ${lang.toUpperCase()}`);
  };

  const exportDatabase = () => {
    const payload = JSON.stringify(state, null, 2);
    navigator.clipboard.writeText(payload);
    showSuccess("Backup JSON copied successfully!");
  };

  const importDatabase = (data: string) => {
    try {
      const parsed = JSON.parse(data) as NotebookState;
      if (parsed.notebookTitle && Array.isArray(parsed.sources)) {
        setState(parsed);
        showSuccess("Backup session restored cleanly!");
      } else {
        showError("Invalid study workspace syntax.");
      }
    } catch (e) {
      showError("Failed to parse backup payload.");
    }
  };

  const handleAddSource = (newSource: Omit<Source, 'id' | 'addedAt' | 'wordCount'>) => {
    const fresh: Source = {
      ...newSource,
      id: Math.random().toString(),
      wordCount: newSource.content.split(/\s+/).filter(Boolean).length,
      addedAt: new Date().toLocaleDateString(),
      checked: true
    };
    setState(prev => ({
      ...prev,
      sources: [...prev.sources, fresh]
    }));
    setSelectedSourceId(fresh.id);
  };

  const handleDeleteSource = (id: string) => {
    setState(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s.id !== id)
    }));
    if (selectedSourceId === id) {
      setSelectedSourceId(state.sources.length > 1 ? state.sources[0].id : null);
    }
  };

  const handleRenameSource = (id: string, newTitle: string) => {
    setState(prev => ({
      ...prev,
      sources: prev.sources.map(s => s.id === id ? { ...s, title: newTitle } : s)
    }));
  };

  const handleToggleCheckSource = (id: string) => {
    setState(prev => ({
      ...prev,
      sources: prev.sources.map(s => s.id === id ? { ...s, checked: !s.checked } : s)
    }));
  };

  const handleAutoLabelFolders = () => {
    if (state.sources.length < 5) {
      showError("Requires at least 5 active documents to cluster!");
      return;
    }
    setState(prev => {
      const updated = prev.sources.map((src, idx) => {
        let folder = "Dossier Studies";
        if (src.type === 'pdf') folder = "Uploaded PDFs";
        else if (src.type === 'url') folder = "Webpages & Media transcripts";
        return { ...src, folder };
      });
      return { ...prev, sources: updated };
    });
    showSuccess("Auto-label folder grouping complete!");
  };

  const handleChangeResearchMode = (mode: 'fast' | 'deep') => {
    setState(prev => ({ ...prev, researchMode: mode }));
  };

  const handleAddNote = (title: string, content: string) => {
    const fresh: Note = {
      id: Math.random().toString(),
      title,
      content,
      lastUpdated: 'Just now'
    };
    setState(prev => ({ ...prev, notes: [fresh, ...prev.notes] }));
  };

  const handleDeleteNote = (id: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const handleUpdateNote = (id: string, content: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, content, lastUpdated: 'Just now' } : n)
    }));
  };

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased">
      <Header 
        title={state.notebookTitle}
        onRenameTitle={handleRenameTitle}
        language={state.language}
        onLanguageChange={handleLanguageChange}
        exportDatabase={exportDatabase}
        importDatabase={importDatabase}
      />

      <div className="flex-1 pt-[56px] flex overflow-hidden relative h-[calc(100vh-56px)]">
        
        <div className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0 border-r border-slate-200 dark:border-slate-800 ${
          leftOpen ? 'w-[22%]' : 'w-0 overflow-hidden'
        }`}>
          <SourcePanel
            sources={state.sources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onRenameSource={handleRenameSource}
            onToggleCheckSource={handleToggleCheckSource}
            onAutoLabelFolders={handleAutoLabelFolders}
            researchMode={state.researchMode}
            onChangeResearchMode={handleChangeResearchMode}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative h-full">
          
          {/* Responsive triggers for Mobile/Tablet */}
          <div className="lg:hidden p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-slate-600 bg-white border-slate-200 text-xs">
                  <Files className="w-3.5 h-3.5 text-teal-600" />
                  Sources ({state.sources.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 bg-white">
                <SourcePanel
                  sources={state.sources}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={setSelectedSourceId}
                  onAddSource={handleAddSource}
                  onDeleteSource={handleDeleteSource}
                  onRenameSource={handleRenameSource}
                  onToggleCheckSource={handleToggleCheckSource}
                  onAutoLabelFolders={handleAutoLabelFolders}
                  researchMode={state.researchMode}
                  onChangeResearchMode={handleChangeResearchMode}
                />
              </SheetContent>
            </Sheet>

            <span className="font-extrabold text-xs text-teal-600 truncate max-w-[150px]">
              {state.notebookTitle}
            </span>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-slate-600 bg-white border-slate-200 text-xs">
                  <Headphones className="w-3.5 h-3.5 text-teal-600" />
                  Studio
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-85 bg-slate-50">
                <AudioStudyPanel
                  onGenerateAudio={() => {}}
                  isGeneratingAudio={false}
                  hasAudio={hasAudio}
                  flashcards={dynamicFlashcards}
                  quizzes={dynamicQuizzes}
                  slides={editedSlides}
                  sources={state.sources}
                  onGenerateFlashcards={() => {}}
                  isGeneratingFlashcards={false}
                  onUpdateSlides={setEditedSlides}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="bg-white border border-slate-200 hover:border-teal-500 p-1.5 rounded-r-xl shadow-md text-slate-500 hover:text-teal-600 transition-all"
            >
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="bg-white border border-slate-200 hover:border-teal-500 p-1.5 rounded-l-xl shadow-md text-slate-500 hover:text-teal-600 transition-all"
            >
              {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <WorkspacePanel
              sources={state.sources}
              activeNotes={state.notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onAddSourceClick={() => {
                const addBtn = document.querySelector('button[class*="bg-teal-600"]') as HTMLElement;
                if (addBtn) addBtn.click();
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0 border-l border-slate-200 dark:border-slate-800 ${
          rightOpen ? 'w-[28%]' : 'w-0 overflow-hidden'
        }`}>
          <AudioStudyPanel
            onGenerateAudio={() => {}}
            isGeneratingAudio={false}
            hasAudio={hasAudio}
            flashcards={dynamicFlashcards}
            quizzes={dynamicQuizzes}
            slides={editedSlides}
            sources={state.sources}
            onGenerateFlashcards={() => {}}
            isGeneratingFlashcards={false}
            onUpdateSlides={setEditedSlides}
          />
        </div>

      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}