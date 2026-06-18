"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SourcePanel, { Source } from '@/components/SourcePanel';
import WorkspacePanel, { ChatMessage, Note } from '@/components/WorkspacePanel';
import AudioStudyPanel, { Flashcard } from '@/components/AudioStudyPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Share2, Sparkles, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { 
  createChunksFromText,
  generateWorkspaceFlashcards, 
  generateWorkspaceQuizzes, 
  generateWorkspaceSlides,
  Slide
} from '@/utils/db';
import NotebookLMLogo from '@/components/NotebookLMLogo';

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Notebook states
  const [notebookTitle, setNotebookTitle] = useState("My Grounded Study Guide");
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [researchMode, setResearchMode] = useState<'fast' | 'deep'>('fast');
  const [language, setLanguage] = useState('en');

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [highlightedChunkText, setHighlightedChunkText] = useState<string | undefined>(undefined);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

  // Realistic generation states to mimic real product video workflows
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioGenerationProgress, setAudioGenerationProgress] = useState(0);
  const [audioGenerationStatus, setAudioGenerationStatus] = useState("");
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false);

  const [isGeneratingGuides, setIsGeneratingGuides] = useState(false);
  const [hasGeneratedGuides, setHasGeneratedGuides] = useState(false);

  // Load state on mount based on ID
  useEffect(() => {
    if (!id) return;
    try {
      const savedList = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        const current = parsed.find((n: any) => n.id === id);
        if (current) {
          setNotebookTitle(current.title || "Study Guide");
          setSources(current.sources || []);
          setNotes(current.notes || []);
          setResearchMode(current.researchMode || 'fast');
          setLanguage(current.language || 'en');
          
          // Pre-seed audio status if sources already exist
          if (current.sources && current.sources.length > 0) {
            setHasGeneratedAudio(true);
            setHasGeneratedGuides(true);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load custom notebook", e);
    }
  }, [id]);

  // Save state on change
  const saveState = (updatedSources?: Source[], updatedNotes?: Note[], updatedTitle?: string) => {
    if (!id) return;
    try {
      const savedList = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      let parsed = savedList ? JSON.parse(savedList) : [];
      parsed = parsed.map((n: any) => {
        if (n.id === id) {
          return {
            ...n,
            title: updatedTitle ?? notebookTitle,
            sources: updatedSources ?? sources,
            notes: updatedNotes ?? notes,
            researchMode,
            language,
            updatedAt: new Date().toLocaleDateString()
          };
        }
        return n;
      });
      localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(parsed));
    } catch (e) {
      console.error("Failed to save notebook details", e);
    }
  };

  // Simulated professional synthesis stages (from Google launch metrics)
  const handleGenerateAudio = () => {
    if (sources.length === 0) {
      showError("Please upload at least one source file first.");
      return;
    }
    
    setIsGeneratingAudio(true);
    setAudioGenerationProgress(0);
    setAudioGenerationStatus("Ingesting grounding context nodes...");

    const steps = [
      { prg: 20, msg: "Parsing high-density semantic slices..." },
      { prg: 45, msg: "Drafting conversational host script templates..." },
      { prg: 70, msg: "Synthesizing professional co-host dialogs..." },
      { prg: 90, msg: "Compiling premium browser speech waveforms..." },
      { prg: 100, msg: "Ready!" }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAudioGenerationProgress(step.prg);
        setAudioGenerationStatus(step.msg);
        if (step.prg === 100) {
          setIsGeneratingAudio(false);
          setHasGeneratedAudio(true);
          showSuccess("Deep-Dive Audio Overview synthesized successfully!");
        }
      }, (idx + 1) * 800);
    });
  };

  const handleGenerateGuides = () => {
    setIsGeneratingGuides(true);
    setTimeout(() => {
      setIsGeneratingGuides(false);
      setHasGeneratedGuides(true);
      showSuccess("FAQ, Briefs, Glossary terms compiled cleanly!");
    }, 1500);
  };

  const dynamicFlashcards = useMemo(() => {
    return hasGeneratedGuides ? generateWorkspaceFlashcards(sources) : [];
  }, [sources, hasGeneratedGuides]);

  const dynamicQuizzes = useMemo(() => {
    return hasGeneratedGuides ? generateWorkspaceQuizzes(sources) : [];
  }, [sources, hasGeneratedGuides]);

  const baseSlides = useMemo(() => {
    return hasGeneratedGuides ? generateWorkspaceSlides(sources) : [];
  }, [sources, hasGeneratedGuides]);

  useEffect(() => {
    setEditedSlides(baseSlides);
  }, [baseSlides]);

  const handleRenameTitle = (newTitle: string) => {
    setNotebookTitle(newTitle);
    saveState(undefined, undefined, newTitle);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    showSuccess(`Language set to ${lang.toUpperCase()}`);
  };

  const exportDatabase = () => {
    const payload = JSON.stringify({ notebookTitle, sources, notes, researchMode, language }, null, 2);
    navigator.clipboard.writeText(payload);
    showSuccess("Backup JSON copied successfully!");
  };

  const importDatabase = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.sources) {
        setSources(parsed.sources);
        setNotes(parsed.notes || []);
        saveState(parsed.sources, parsed.notes || []);
        showSuccess("Backup session restored cleanly!");
      } else {
        showError("Invalid study workspace syntax.");
      }
    } catch (e) {
      showError("Failed to parse backup payload.");
    }
  };

  const handleAddSource = (newSource: Omit<Source, 'id' | 'addedAt' | 'wordCount' | 'chunks'>) => {
    const sourceId = Math.random().toString();
    const sourceTitle = newSource.title;
    const content = newSource.content;
    const chunks = createChunksFromText(sourceId, sourceTitle, content);

    const fresh: Source = {
      ...newSource,
      id: sourceId,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      addedAt: new Date().toLocaleDateString(),
      checked: true,
      chunks
    };

    const updated = [...sources, fresh];
    setSources(updated);
    setSelectedSourceId(fresh.id);
    saveState(updated);
    
    // Auto trigger synthesis to keep flow smooth
    setHasGeneratedAudio(true);
    setHasGeneratedGuides(true);
  };

  const handleDeleteSource = (sourceId: string) => {
    const updated = sources.filter(s => s.id !== sourceId);
    setSources(updated);
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(updated.length > 0 ? updated[0].id : null);
    }
    saveState(updated);
  };

  const handleToggleCheckSource = (sourceId: string) => {
    const updated = sources.map(s => s.id === sourceId ? { ...s, checked: !s.checked } : s);
    setSources(updated);
    saveState(updated);
  };

  const handleAutoLabelFolders = () => {
    if (sources.length < 5) {
      showError("Requires at least 5 active documents to cluster!");
      return;
    }
    const updated = sources.map((src) => {
      let folder = "Dossier Studies";
      if (src.type === 'pdf') folder = "Uploaded PDFs";
      else if (src.type === 'url') folder = "Webpages & Media transcripts";
      return { ...src, folder };
    });
    setSources(updated);
    saveState(updated);
    showSuccess("Auto-label folder grouping complete!");
  };

  const handleAddNote = (title: string, content: string) => {
    const fresh = {
      id: Math.random().toString(),
      title,
      content,
      lastUpdated: 'Just now'
    };
    const updated = [fresh, ...notes];
    setNotes(updated);
    saveState(undefined, updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    saveState(undefined, updated);
  };

  const handleUpdateNote = (noteId: string, content: string) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, content, lastUpdated: 'Just now' } : n);
    setNotes(updated);
    saveState(undefined, updated);
  };

  const handleTriggerCitationHighlight = (chunkText: string) => {
    setHighlightedChunkText(chunkText);
    const matchedSource = sources.find(s => s.chunks.some(chk => chk.text === chunkText));
    if (matchedSource) {
      setSelectedSourceId(matchedSource.id);
    }
    setTimeout(() => {
      setHighlightedChunkText(undefined);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-slate-950 flex flex-col antialiased font-sans">
      
      {/* Top Header navbar */}
      <Header
        title={notebookTitle}
        onRenameTitle={handleRenameTitle}
        language={language}
        onLanguageChange={handleLanguageChange}
        exportDatabase={exportDatabase}
        importDatabase={importDatabase}
        activeSourceCount={sources.filter(s => s.checked !== false).length}
      />

      <div className="flex-1 pt-[56px] flex overflow-hidden relative h-[calc(100vh-56px)]">
        
        {/* Left Pane (Sources) */}
        <div className="hidden lg:block lg:w-[22%] h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-[#FAF9F6] dark:bg-slate-900 overflow-hidden">
          <SourcePanel
            sources={sources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onToggleCheckSource={handleToggleCheckSource}
            onAutoLabelFolders={handleAutoLabelFolders}
            researchMode={researchMode}
            onChangeResearchMode={setResearchMode}
            highlightedChunkText={highlightedChunkText}
          />
        </div>

        {/* Center Pane (Chat & Keep Notes) */}
        <div className="flex-1 lg:w-[53%] flex flex-col min-w-0 bg-white dark:bg-slate-900 relative h-full overflow-hidden">
          {/* Mobile responsive panel links */}
          <div className="lg:hidden p-3 bg-slate-150 flex items-center justify-between shrink-0 border-b">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-xs">
                  Sources ({sources.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 bg-white">
                <SourcePanel
                  sources={sources}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={setSelectedSourceId}
                  onAddSource={handleAddSource}
                  onDeleteSource={handleDeleteSource}
                  onToggleCheckSource={handleToggleCheckSource}
                  onAutoLabelFolders={handleAutoLabelFolders}
                  researchMode={researchMode}
                  onChangeResearchMode={setResearchMode}
                  highlightedChunkText={highlightedChunkText}
                />
              </SheetContent>
            </Sheet>

            <span className="font-extrabold text-xs text-teal-600 truncate max-w-[150px]">
              {notebookTitle}
            </span>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-xs">
                  Studio
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-85 bg-slate-50">
                <AudioStudyPanel
                  onGenerateAudio={handleGenerateAudio}
                  isGeneratingAudio={isGeneratingAudio}
                  hasAudio={hasGeneratedAudio}
                  flashcards={dynamicFlashcards}
                  quizzes={dynamicQuizzes}
                  slides={editedSlides}
                  sources={sources}
                  onGenerateFlashcards={handleGenerateGuides}
                  isGeneratingFlashcards={isGeneratingGuides}
                  onUpdateSlides={setEditedSlides}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 min-h-0 h-full overflow-hidden">
            <WorkspacePanel
              sources={sources}
              activeNotes={notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onAddSourceClick={() => {}}
              isLoading={false}
              onTriggerCitationHighlight={handleTriggerCitationHighlight}
            />
          </div>
        </div>

        {/* Right Pane (Audio Overview & Study Tools) */}
        <div className="hidden lg:block lg:w-[25%] h-full shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#161616] overflow-hidden">
          
          {isGeneratingAudio ? (
            /* Premium active generation screens, replicating launch animations */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900 text-white">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-widest text-teal-400">Synthesizing Co-Hosts</h4>
                <p className="text-[11px] text-slate-400 max-w-[180px] font-bold">{audioGenerationStatus}</p>
              </div>
              <div className="w-32 bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full transition-all duration-300" style={{ width: `${audioGenerationProgress}%` }} />
              </div>
            </div>
          ) : (
            <AudioStudyPanel
              onGenerateAudio={handleGenerateAudio}
              isGeneratingAudio={isGeneratingAudio}
              hasAudio={hasGeneratedAudio}
              flashcards={dynamicFlashcards}
              quizzes={dynamicQuizzes}
              slides={editedSlides}
              sources={sources}
              onGenerateFlashcards={handleGenerateGuides}
              isGeneratingFlashcards={isGeneratingGuides}
              onUpdateSlides={setEditedSlides}
            />
          )}

        </div>

      </div>
    </div>
  );
}