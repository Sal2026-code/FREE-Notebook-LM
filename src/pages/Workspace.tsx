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
import { ArrowLeft, Share2 } from 'lucide-react';
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

  // Load notebook specific state from localStorage or initial defaults
  const [notebookTitle, setNotebookTitle] = useState("My Grounded Study Guide");
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [researchMode, setResearchMode] = useState<'fast' | 'deep'>('fast');
  const [language, setLanguage] = useState('en');

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [highlightedChunkText, setHighlightedChunkText] = useState<string | undefined>(undefined);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

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

  const dynamicFlashcards = useMemo(() => {
    return generateWorkspaceFlashcards(sources);
  }, [sources]);

  const dynamicQuizzes = useMemo(() => {
    return generateWorkspaceQuizzes(sources);
  }, [sources]);

  const baseSlides = useMemo(() => {
    return generateWorkspaceSlides(sources);
  }, [sources]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased font-sans">
      <div className="fixed top-0 left-0 right-0 z-50 h-[56px] border-b border-slate-200 bg-[#FFFFFF]/90 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <NotebookLMLogo className="w-8 h-8" />
          <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{notebookTitle}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50 text-[10px] rounded-full px-2.5">
            Workspace ID: {id?.slice(0, 5)}
          </Badge>
          <Button onClick={exportDatabase} variant="outline" size="sm" className="h-8 rounded-full text-xs font-semibold gap-1">
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </div>

      <div className="flex-1 pt-[56px] flex overflow-hidden relative h-[calc(100vh-56px)]">
        
        {/* Left Pane */}
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

        {/* Center Pane */}
        <div className="flex-1 lg:w-[53%] flex flex-col min-w-0 bg-white dark:bg-slate-900 relative h-full overflow-hidden">
          {/* Mobile responsive panel links */}
          <div className="lg:hidden p-3 bg-slate-100 flex items-center justify-between shrink-0">
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
                  onGenerateAudio={() => {}}
                  isGeneratingAudio={false}
                  hasAudio={sources.length > 0}
                  flashcards={dynamicFlashcards}
                  quizzes={dynamicQuizzes}
                  slides={editedSlides}
                  sources={sources}
                  onGenerateFlashcards={() => {}}
                  isGeneratingFlashcards={false}
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

        {/* Right Pane */}
        <div className="hidden lg:block lg:w-[25%] h-full shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#FAF9F5] dark:bg-[#161616] overflow-hidden">
          <AudioStudyPanel
            onGenerateAudio={() => {}}
            isGeneratingAudio={false}
            hasAudio={sources.length > 0}
            flashcards={dynamicFlashcards}
            quizzes={dynamicQuizzes}
            slides={editedSlides}
            sources={sources}
            onGenerateFlashcards={() => {}}
            isGeneratingFlashcards={false}
            onUpdateSlides={setEditedSlides}
          />
        </div>

      </div>
    </div>
  );
}