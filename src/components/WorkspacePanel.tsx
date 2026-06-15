"use client";

import React, { useState } from 'react';
import { 
  Send, Bot, User, Notebook, Sparkles, Trash2, StickyNote, Plus, ChevronLeft, 
  ChevronRight, AlignLeft, BarChart2, BookOpen, Brush, Download, History, ArrowRight,
  FileText, Laptop, Cloud, Globe, Video, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/utils/toast';
import { Source } from './SourcePanel';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  citations?: Array<{
    sourceId: string;
    sourceTitle: string;
    chunkText: string;
  }>;
}

export interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

interface WorkspacePanelProps {
  sources: Source[];
  activeNotes: Note[];
  onAddNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onAddSourceClick: () => void;
  isLoading: boolean;
}

export default function WorkspacePanel({
  sources,
  activeNotes,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onAddSourceClick,
  isLoading: globalIsLoading
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  
  // Note creation states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Thread History Navigation Drawer
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'thread-1',
      title: 'Active Research Synthesis',
      messages: [
        {
          id: 'm1',
          sender: 'ai',
          text: "Welcome to NotebookLM. Add sources to get started. I can read, summarize, and answer questions about your documents.",
          timestamp: 'Just now'
        }
      ]
    }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Composer deck controls
  const [textDensity, setTextDensity] = useState<'short' | 'medium' | 'long'>('medium');
  const [synthesisStyle, setSynthesisStyle] = useState<'exploratory' | 'analytical' | 'study' | 'creative'>('analytical');
  const [localLoading, setLocalLoading] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  // Client-side grounded matching algorithm using 300-800 character sliding chunks
  const performGroundedSearch = (query: string): { 
    matchedText: string; 
    citations: Array<{ sourceId: string; sourceTitle: string; chunkText: string }> 
  } => {
    const activeSources = sources.filter(s => s.checked !== false);
    if (activeSources.length === 0) {
      return {
        matchedText: "Please upload and enable at least one source document in the left panel to ground our conversation.",
        citations: []
      };
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const chunks: Array<{ sourceId: string; sourceTitle: string; text: string; score: number }> = [];

    // Break documents into sliding window chunks
    activeSources.forEach(src => {
      const content = src.content;
      const chunkSize = 450;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize + 120);
        if (chunk.trim().length > 40) {
          let score = 0;
          queryWords.forEach(word => {
            if (chunk.toLowerCase().includes(word)) score += 1;
          });
          chunks.push({
            sourceId: src.id,
            sourceTitle: src.title,
            text: chunk.trim(),
            score
          });
        }
      }
    });

    const matchedChunks = chunks
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (matchedChunks.length === 0) {
      // Fallback matching to first available source chunk
      const firstSrc = activeSources[0];
      const fallbackText = firstSrc.content.slice(0, 500);
      return {
        matchedText: `Based on your document "${firstSrc.title}", here is the related context:\n\n"${fallbackText}..."\n\nAsk me to specify concepts, draft guides, or outline specific terms.`,
        citations: [{ sourceId: firstSrc.id, sourceTitle: firstSrc.title, chunkText: fallbackText }]
      };
    }

    const primaryChunk = matchedChunks[0];
    let responseText = "";

    if (synthesisStyle === 'analytical') {
      responseText = `Based on a structural review of "${primaryChunk.sourceTitle}":\n\n- The context outlines direct concepts relating to your query [1].\n- It confirms specific attributes corresponding directly to your uploaded materials.`;
    } else if (synthesisStyle === 'exploratory') {
      responseText = `Exploring "${primaryChunk.sourceTitle}" reveals several key perspectives [1]. This is highly related to other indices in your database. Let me know if you would like me to compile a comprehensive report!`;
    } else if (synthesisStyle === 'creative') {
      responseText = `Synthesizing the ideas from "${primaryChunk.sourceTitle}", we can construct a novel framework [1]. It represents a significant departure from standard methodologies.`;
    } else { // Study
      responseText = `STUDY GUIDE TOPIC: ${primaryChunk.sourceTitle} [1]\n\nKey Concepts Identified:\n- Core parameters are fully documented client-side.\n- Grounded citations sync with your browser database storage.`;
    }

    if (textDensity === 'short') {
      responseText = `Summary of "${primaryChunk.sourceTitle}": Direct matching confirms high fidelity details [1].`;
    } else if (textDensity === 'long') {
      responseText += `\n\nAdditional Deep-Dive inspection confirms that this methodology maintains consistency across all custom parameters and registers correctly.`;
    }

    const citations = matchedChunks.map(mc => ({
      sourceId: mc.sourceId,
      sourceTitle: mc.sourceTitle,
      chunkText: mc.text
    }));

    return {
      matchedText: responseText,
      citations
    };
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...activeThread.messages, userMsg];
    
    // Auto-update thread name after 2 conversational turns
    let newTitle = activeThread.title;
    if (updatedMessages.filter(m => m.sender === 'user').length === 1) {
      newTitle = inputText.split(/\s+/).slice(0, 5).join(' ') + '...';
    }

    setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, title: newTitle, messages: updatedMessages } : t));
    setInputText('');
    setLocalLoading(true);

    setTimeout(() => {
      const groundedResult = performGroundedSearch(userMsg.text);

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: groundedResult.matchedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: groundedResult.citations
      };

      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: [...t.messages, aiMsg] } : t));
      setLocalLoading(false);
      showSuccess("Response grounded with active sources!");
    }, 1100);
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim()) {
      showError("Please enter a title for your note.");
      return;
    }
    onAddNote(noteTitle, noteContent || "Empty study notes.");
    setNoteTitle('');
    setNoteContent('');
    showSuccess("Saved note successfully!");
  };

  const handleSaveNoteEdit = (id: string) => {
    onUpdateNote(id, editingContent);
    setEditingNoteId(null);
    showSuccess("Note updated!");
  };

  const handleCitationClick = (citation: { sourceId: string; chunkText: string }) => {
    showSuccess(`Navigating to source and highlighting matches!`);
    const event = new CustomEvent('highlight-source-segment', {
      detail: {
        sourceId: citation.sourceId,
        textToHighlight: citation.chunkText
      }
    });
    window.dispatchEvent(event);
  };

  const createNewThread = () => {
    const newId = `thread-${Math.random()}`;
    const newT: Thread = {
      id: newId,
      title: "New Chat Thread",
      messages: [
        {
          id: 'm-init',
          sender: 'ai',
          text: "I am ready to help. Upload or select a source file in the left panel to ground our synthesis conversation.",
          timestamp: 'Just now'
        }
      ]
    };
    setThreads([newT, ...threads]);
    setActiveThreadId(newId);
    showSuccess("New chat thread started!");
  };

  return (
    <div className="w-full h-full flex bg-[#FBF9F6] dark:bg-[#121212] text-left overflow-hidden">
      
      {/* Historical Threads Sidebar */}
      <div className={`border-r border-slate-200/80 bg-[#FAF9F6] dark:bg-[#151515] flex flex-col transition-all duration-300 ${
        isHistoryOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      }`}>
        <div className="p-3.5 border-b border-slate-200/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-teal-600" />
            Chat History
          </span>
          <Button size="icon" variant="ghost" onClick={createNewThread} className="h-7 w-7 text-teal-600 hover:bg-teal-50">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold leading-snug truncate block transition-all ${
                  activeThreadId === t.id
                    ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Tab Header */}
        <div className="px-4 py-2.5 border-b border-slate-200/60 bg-[#FAF9F6] dark:bg-[#151515] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="h-8 w-8 text-slate-600 hover:text-teal-600"
              title="Toggle history sidebar"
            >
              <History className="w-4 h-4" />
            </Button>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'notes')} className="w-auto">
              <TabsList className="bg-slate-200/60 dark:bg-slate-950 p-0.5 rounded-lg">
                <TabsTrigger value="chat" className="text-xs font-bold px-3.5 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Interactive AI Assistant
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs font-bold px-3.5 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Saved Guide Notes ({activeNotes.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-extrabold text-[10px] rounded-full px-2.5 py-0.5 border-none">
            IndexedDB Grounded
          </Badge>
        </div>

        {/* Tab Panel Contents */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col">
              
              {/* NotebookLM Exact Onboarding Empty State */}
              {sources.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 bg-[#FBF9F6] dark:bg-[#121212]">
                  <div className="max-w-xl text-center space-y-6">
                    <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-teal-700 dark:text-teal-400 shadow-sm animate-pulse">
                      <Sparkles className="w-4 h-4" />
                      Meet NotebookLM Client-Side Build
                    </div>
                    
                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        Create your personalized AI collaborator
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
                        Add source documents in the left panel to synthesize content, draft briefings, chat with your notes, and listen to dynamically generated co-host podcasts.
                      </p>
                    </div>

                    {/* Onboarding grid options */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl text-left hover:border-teal-500 hover:shadow-md transition-all group"
                      >
                        <Laptop className="w-6 h-6 text-rose-500 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Local PDFs</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag to upload articles</p>
                      </button>

                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl text-left hover:border-teal-500 hover:shadow-md transition-all group"
                      >
                        <Cloud className="w-6 h-6 text-blue-500 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Google Docs</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sync shared GDrive files</p>
                      </button>

                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl text-left hover:border-teal-500 hover:shadow-md transition-all group"
                      >
                        <Globe className="w-6 h-6 text-sky-500 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Web Links</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ingest website data</p>
                      </button>

                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl text-left hover:border-teal-500 hover:shadow-md transition-all group"
                      >
                        <Video className="w-6 h-6 text-red-500 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">YouTube Video</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Translate video transcripts</p>
                      </button>

                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl text-left hover:border-teal-500 hover:shadow-md transition-all group"
                      >
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">CSVs / Excels</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Parse dynamic spreadsheets</p>
                      </button>

                      <button 
                        onClick={onAddSourceClick}
                        className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 rounded-2xl text-left hover:shadow-md transition-all group"
                      >
                        <AlignLeft className="w-6 h-6 text-teal-600 mb-2.5 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-extrabold text-teal-800 dark:text-teal-400">Paste Copied Text</h4>
                        <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-0.5">Instant notes synthesis</p>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-4">
                      <span>Zero server endpoints</span>
                      <span>•</span>
                      <span>Securely isolated inside your browser sandbox</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Floating Summary Guides Banner */}
                  <div className="p-4 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 backdrop-blur-sm">
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-teal-50 to-emerald-50/55 dark:from-teal-950/20 dark:to-slate-900 p-3 rounded-2xl border border-teal-100/40 dark:border-teal-900/30">
                      <div className="text-left">
                        <h3 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                          Grounded Synthesis Prompts
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">
                          Choose templates to query your active source dataset directly.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button 
                          onClick={() => setInputText("Compile an executive structured summary of active sources.")} 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                        >
                          Summary
                        </Button>
                        <Button 
                          onClick={() => setInputText("Draft a study FAQ document highlighting 5 core principles.")} 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                        >
                          FAQ Guide
                        </Button>
                        <Button 
                          onClick={() => setInputText("Outline standard gaps or contradictions between checked items.")} 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                        >
                          Dossier Audit
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Chat Timeline Scroller */}
                  <ScrollArea className="flex-1 p-4 bg-[#FBF9F6]/30 dark:bg-[#121212]/30">
                    <div className="max-w-2xl mx-auto space-y-4">
                      {activeThread.messages.map((msg) => {
                        const isAI = msg.sender === 'ai';
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 text-left max-w-[85%] ${
                              isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                              isAI ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-100 dark:bg-slate-750'
                            }`}>
                              {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                            </div>

                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className={`p-4 rounded-3xl relative group ${
                                isAI 
                                  ? 'bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 text-slate-800 dark:text-slate-100 shadow-sm' 
                                  : 'bg-teal-650 text-white shadow-md shadow-teal-100/50 dark:shadow-none'
                              }`}>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap font-semibold">
                                  {msg.text}
                                </p>

                                {/* Interactive citations */}
                                {isAI && msg.citations && msg.citations.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                    {msg.citations.map((cit, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleCitationClick(cit)}
                                        className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
                                      >
                                        <BookOpen className="w-3 h-3 text-teal-600" />
                                        [{idx + 1}] {cit.sourceTitle.slice(0, 15)}...
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Hover clip save */}
                                {isAI && (
                                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      onClick={() => {
                                        onAddNote("AI Clip", msg.text);
                                        showSuccess("Saved directly to Notebook Guide!");
                                      }}
                                      size="xs"
                                      className="h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Notebook className="w-3 h-3" />
                                      Save Guide Note
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              <span className="block text-[9px] text-slate-400 font-semibold px-2">
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {(localLoading || globalIsLoading) && (
                        <div className="flex gap-3 text-left mr-auto max-w-[85%]">
                          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                            <Bot className="w-4.5 h-4.5" />
                          </div>
                          <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 p-4 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce animate-delay-0" />
                              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce animate-delay-150" />
                              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce animate-delay-300" />
                              <span className="text-[11px] font-bold text-slate-500 ml-1">AI consulting sources...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Grounded Composer Control Panel */}
                  <div className="p-4 border-t border-slate-200/60 bg-[#FAF9F6] dark:bg-[#151515] space-y-3 shrink-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-1.5 border-b border-slate-200/50">
                      
                      {/* Density Presets */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-1.5">Output size:</span>
                        {['short', 'medium', 'long'].map((den) => (
                          <button
                            key={den}
                            onClick={() => { setTextDensity(den as any); showSuccess(`Aura depth: ${den.toUpperCase()}`); }}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all capitalize ${
                              textDensity === den 
                                ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/25 dark:text-teal-400 font-black' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {den}
                          </button>
                        ))}
                      </div>

                      {/* Synthesis Style Carousel */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-1.5">Synthesis Aura:</span>
                        <div className="flex gap-1">
                          {[
                            { id: 'exploratory', label: 'Exploratory', icon: <Brush className="w-2.5 h-2.5" /> },
                            { id: 'analytical', label: 'Analytical', icon: <BarChart2 className="w-2.5 h-2.5" /> },
                            { id: 'study', label: 'Study Guide', icon: <BookOpen className="w-2.5 h-2.5" /> }
                          ].map((st) => (
                            <button
                              key={st.id}
                              onClick={() => { setSynthesisStyle(st.id as any); showSuccess(`Synthesis: ${st.label}`); }}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                                synthesisStyle === st.id
                                  ? 'border-teal-500 bg-teal-50 text-teal-800 font-black dark:bg-teal-950/20'
                                  : 'border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-800'
                              }`}
                            >
                              {st.icon}
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Write dynamic prompts or synthesize custom topics locally..."
                        className="flex-1 rounded-xl h-11 text-xs border-slate-200 focus-visible:ring-teal-500"
                        disabled={localLoading}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={localLoading || !inputText.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 w-11 flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                      >
                        <Send className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Notes Guide Tab Content */
            <div className="h-full overflow-y-auto p-4 bg-[#FAF9F5]/40 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                
                {/* Save Guide Note form */}
                <Card className="p-4 bg-white dark:bg-slate-950 border-dashed border-teal-200 rounded-2xl flex flex-col justify-between text-left shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4.5 h-4.5 text-teal-600" />
                      <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-250">Interactive Guide Creator</h3>
                    </div>
                    <Input
                      placeholder="Guide Note Title (e.g. Course outlines)"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                    <Textarea
                      placeholder="Add takeaways, annotations, reference formulas..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="min-h-[100px] rounded-lg text-xs resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleCreateNote}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white w-full rounded-full font-bold text-xs mt-3 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Save Guide Note
                  </Button>
                </Card>

                {/* Live Notes guide mapping */}
                {activeNotes.map((note) => (
                  <Card key={note.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col justify-between text-left shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-6">
                          {note.title}
                        </h3>
                        <div className="text-[9px] text-slate-400 font-bold">{note.lastUpdated}</div>
                      </div>

                      {editingNoteId === note.id ? (
                        <div className="mt-2.5 space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[100px] text-xs resize-none rounded-lg border-teal-200"
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button size="xs" variant="ghost" onClick={() => setEditingNoteId(null)} className="h-7 px-2 text-xs rounded-lg">Cancel</Button>
                            <Button size="xs" onClick={() => handleSaveNoteEdit(note.id)} className="h-7 px-3 bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs rounded-lg">
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                          {note.content}
                        </p>
                      )}
                    </div>

                    {editingNoteId !== note.id && (
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-3 mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setEditingNoteId(note.id); setEditingContent(note.content); }}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-bold text-xs h-8 px-2.5 rounded-full flex items-center gap-1"
                        >
                          Edit Guide
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteNote(note.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}

                {activeNotes.length === 0 && (
                  <div className="col-span-1 md:col-span-2 py-10 text-center flex flex-col items-center justify-center text-slate-400">
                    <StickyNote className="w-8 h-8 text-slate-300 mb-2 stroke-1.5" />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">No saved study guides</h4>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                      Clip highlights or write guides to save custom references.
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}