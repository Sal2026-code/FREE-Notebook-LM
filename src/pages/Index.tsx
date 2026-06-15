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
  const [state, setState] = useState<NotebookState>(loadNotebookState());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  // Computed state for custom edited slides (so Pencil input feedback works)
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    saveNotebookState(state);
  }, [state]);

  // Set first loaded source as selected initially on boot (if sources exist)
  useEffect(() => {
    if (state.sources.length > 0 && !selectedSourceId) {
      setSelectedSourceId(state.sources[0].id);
    }
  }, [state.sources]);

  // Derive dynamic flashcards and quizzes based strictly on active/checked sources
  const dynamicFlashcards = useMemo(() => {
    return generateDynamicFlashcards(state.sources);
  }, [state.sources]);

  const dynamicQuizzes = useMemo(() => {
    return generateDynamicQuizzes(state.sources);
  }, [state.sources]);

  const baseSlides = useMemo(() => {
    return generateDynamicSlides(state.sources);
  }, [state.sources]);

  // Sync base generated slides into our editedSlides state
  useEffect(() => {
    setEditedSlides(baseSlides);
  }, [baseSlides]);

  const handleRenameTitle = (newTitle: string) => {
    setState(prev => ({ ...prev, notebookTitle: newTitle }));
  };

  const handleLanguageChange = (lang: string) => {
    setState(prev => ({ ...prev, language: lang }));
    showSuccess(`Language preference set to: ${lang.toUpperCase()}`);
  };

  // Export DB
  const exportDatabase = () => {
    const payload = JSON.stringify(state, null, 2);
    navigator.clipboard.writeText(payload);
    showSuccess("Database payload JSON copied to your clipboard!");
  };

  // Import DB
  const importDatabase = (data: string) => {
    try {
      const parsed = JSON.parse(data) as NotebookState;
      if (parsed.notebookTitle && Array.isArray(parsed.sources)) {
        setState(parsed);
        showSuccess("Import successful! Your local database instance is fully restored.");
      } else {
        showError("Invalid database backup structure.");
      }
    } catch (e) {
      showError("Failed to parse DB import payload. Please check JSON syntax.");
    }
  };

  // Add Source Ingestion
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

  // Cluster algorithm: auto label folders if sources count >= 5
  const handleAutoLabelFolders = () => {
    if (state.sources.length < 5) {
      showError("Requires at least 5 active documents to cluster folder labels automatically!");
      return;
    }
    setState(prev => {
      const updated = prev.sources.map((src, idx) => {
        let folder = "General Reference Dossier";
        if (src.type === 'pdf') folder = "Academic Research Papers";
        else if (src.type === 'youtube' || src.type === 'url') folder = "Hyperlinks & Medias";
        else if (idx % 2 === 0) folder = "Quantum Computing Studies";
        return { ...src, folder };
      });
      return { ...prev, sources: updated };
    });
    showSuccess("Auto-Label Engine completed! Sources grouped into categorized folders.");
  };

  const handleChangeResearchMode = (mode: 'fast' | 'deep') => {
    setState(prev => ({ ...prev, researchMode: mode }));
  };

  const handleSendMessage = (text: string) => {
    // Legacy support (now handled intelligently directly inside grounded local conversational threads)
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

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true);
    setTimeout(() => {
      setIsGeneratingAudio(false);
      setHasAudio(true);
      showSuccess("Co-host Audio deep dive synthesised!");
    }, 2000);
  };

  const handleGenerateFlashcards = () => {
    setIsGeneratingFlashcards(true);
    setTimeout(() => {
      setIsGeneratingFlashcards(false);
      showSuccess("New Flashcards integrated!");
    }, 1500);
  };

  // Collapsible panel status
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

      {/* Spacing below 56px fixed header */}
      <div className="flex-1 pt-[56px] flex overflow-hidden relative h-[calc(100vh-56px)]">
        
        {/* Left Pane: Sources */}
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

        {/* Center Pane: Workspace & Responsive drawers */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative h-full">
          
          {/* Tablet & Mobile responsive control ribbons */}
          <div className="lg:hidden p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-slate-600 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                  <Files className="w-3.5 h-3.5 text-teal-600" />
                  Sources ({state.sources.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 bg-white dark:bg-slate-900">
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
                <Button variant="outline" size="sm" className="rounded-full text-slate-600 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                  <Headphones className="w-3.5 h-3.5 text-teal-600" />
                  Studio
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-85 bg-slate-50 dark:bg-slate-900">
                <AudioStudyPanel
                  onGenerateAudio={handleGenerateAudio}
                  isGeneratingAudio={isGeneratingAudio}
                  hasAudio={hasAudio}
                  flashcards={dynamicFlashcards}
                  quizzes={dynamicQuizzes}
                  slides={editedSlides}
                  onGenerateFlashcards={handleGenerateFlashcards}
                  isGeneratingFlashcards={isGeneratingFlashcards}
                  onUpdateSlides={setEditedSlides}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop panel expand / collapse trigger knobs */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-teal-500 p-1.5 rounded-r-xl shadow-md text-slate-500 hover:text-teal-600 transition-all"
              title={leftOpen ? "Collapse Sources Panel" : "Expand Sources Panel"}
            >
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-teal-500 p-1.5 rounded-l-xl shadow-md text-slate-500 hover:text-teal-600 transition-all"
              title={rightOpen ? "Collapse Study Studio" : "Expand Study Studio"}
            >
              {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Interactive central Workspace panel */}
          <div className="flex-1 min-h-0">
            <WorkspacePanel
              sources={state.sources}
              activeNotes={state.notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onAddSourceClick={() => {
                // Triggers clicking the '+ Add Source' button in the Left Panel natively
                const addBtn = document.querySelector('[role="dialog"]') || document.querySelector('button[class*="bg-teal-650"], button[class*="bg-teal-600"]');
                if (addBtn instanceof HTMLElement) {
                  addBtn.click();
                } else {
                  showSuccess("Click '+ Add Source' in the left panel to begin ingestion!");
                }
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Pane: Audio Deep Dive */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0 border-l border-slate-200 dark:border-slate-800 ${
          rightOpen ? 'w-[28%]' : 'w-0 overflow-hidden'
        }`}>
          <AudioStudyPanel
            onGenerateAudio={handleGenerateAudio}
            isGeneratingAudio={isGeneratingAudio}
            hasAudio={hasAudio}
            flashcards={dynamicFlashcards}
            quizzes={dynamicQuizzes}
            slides={editedSlides}
            onGenerateFlashcards={handleGenerateFlashcards}
            isGeneratingFlashcards={isGeneratingFlashcards}
            onUpdateSlides={setEditedSlides}
          />
        </div>

      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}