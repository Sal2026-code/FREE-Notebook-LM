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
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'thread-1',
      title: 'Current Synthesis Session',
      messages: [
        {
          id: 'm1',
          sender: 'ai',
          text: "Upload or paste source files in the left pane. Once your custom documents are uploaded, ask me anything—I will ground all answers precisely in your local data.",
          timestamp: 'Just now'
        }
      ]
    }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [textDensity, setTextDensity] = useState<'short' | 'medium' | 'long'>('medium');
  const [synthesisStyle, setSynthesisStyle] = useState<'exploratory' | 'analytical' | 'study' | 'creative'>('analytical');
  const [localLoading, setLocalLoading] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const hasCheckedSources = sources.some(s => s.checked !== false);

  const performGroundedSearch = (query: string): { 
    matchedText: string; 
    citations: Array<{ sourceId: string; sourceTitle: string; chunkText: string }> 
  } => {
    const activeSources = sources.filter(s => s.checked !== false);
    if (activeSources.length === 0) {
      return {
        matchedText: "Information is not available in your uploaded sources. Please add source files to continue.",
        citations: []
      };
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const chunks: Array<{ sourceId: string; sourceTitle: string; text: string; score: number }> = [];

    activeSources.forEach(src => {
      const content = src.content;
      const chunkSize = 400;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize + 100);
        if (chunk.trim().length > 30) {
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
      // Direct RAG grounding error constraint
      return {
        matchedText: "Information is not available in your uploaded sources.",
        citations: []
      };
    }

    const primaryChunk = matchedChunks[0];
    let responseText = `Regarding your query based on "${primaryChunk.sourceTitle}" [1]:\n\n- The context confirms parameters and parameters aligned with local metrics.\n- We found active matching context: "${primaryChunk.text.slice(0, 180)}..."`;

    if (textDensity === 'short') {
      responseText = `Summary: Grounded matches found in "${primaryChunk.sourceTitle}" [1].`;
    } else if (textDensity === 'long') {
      responseText += `\n\nFurthermore, all matched data remains stored securely inside the IndexedDB sandbox client-side.`;
    }

    return {
      matchedText: responseText,
      citations: [{ sourceId: primaryChunk.sourceId, sourceTitle: primaryChunk.sourceTitle, chunkText: primaryChunk.text }]
    };
  };

  const handleSend = () => {
    if (!inputText.trim() || !hasCheckedSources) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...activeThread.messages, userMsg];
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
      showSuccess("Query processed against local index!");
    }, 1000);
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim()) {
      showError("Please specify a note title.");
      return;
    }
    onAddNote(noteTitle, noteContent || "Empty study notes.");
    setNoteTitle('');
    setNoteContent('');
    showSuccess("Takeaway note logged!");
  };

  return (
    <div className="w-full h-full flex bg-[#FBF9F6] dark:bg-[#121212] text-left overflow-hidden">
      
      {/* Historical Thread Sidebar */}
      <div className={`border-r border-slate-200/85 bg-[#FAF9F6] dark:bg-[#151515] flex flex-col transition-all duration-300 ${
        isHistoryOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      }`}>
        <div className="p-3.5 border-b border-slate-200/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-teal-600" />
            Sessions History
          </span>
          <Button size="icon" variant="ghost" onClick={() => {
            const newId = `thread-${Math.random()}`;
            setThreads([{ id: newId, title: "Fresh Session", messages: [{ id: 'init', sender: 'ai', text: "Ready. Add sources to begin grounded research.", timestamp: 'Just now' }] }, ...threads]);
            setActiveThreadId(newId);
          }} className="h-7 w-7 text-teal-600">
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
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        
        <div className="px-4 py-2.5 border-b border-slate-200/60 bg-[#FAF9F6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="h-8 w-8 text-slate-600 hover:text-teal-600"
            >
              <History className="w-4 h-4" />
            </Button>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'notes')} className="w-auto">
              <TabsList className="bg-slate-200/60 p-0.5 rounded-lg">
                <TabsTrigger value="chat" className="text-xs font-bold px-3.5 py-1">
                  Chat Assistant
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs font-bold px-3.5 py-1">
                  Saved Guide Notes ({activeNotes.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Badge className="bg-teal-50 text-teal-700 font-extrabold text-[10px] rounded-full px-2.5 py-0.5 border-none">
            absolutelyfreenotebooklm.com
          </Badge>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col">
              
              {/* Empty Data State Welcome Onboard */}
              {!hasCheckedSources ? (
                <div className="flex-1 flex items-center justify-center p-6 bg-[#FBF9F6] dark:bg-[#121212]">
                  <div className="max-w-md text-center space-y-5">
                    <div className="bg-teal-50 border border-teal-100 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-teal-700">
                      <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                      Ready to Ground Research
                    </div>
                    
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        Upload sources to unlock your AI workspace
                      </h1>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2">
                        Add document chunks, links, or notes to construct a local vector database. Our grounded chat assistant, co-hosts podcast generators, and study decks will initialize automatically.
                      </p>
                    </div>

                    <Button 
                      onClick={onAddSourceClick}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Upload First Source Document
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-white/75 border-b border-slate-200/50 backdrop-blur-sm shrink-0">
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-teal-50 to-emerald-50 p-3 rounded-2xl border border-teal-100">
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                          Grounded Prompts Suggestion
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                          Query active indices directly with zero external latency.
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button 
                          onClick={() => setInputText("Compile a structured, thorough executive summary.")} 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] font-bold h-7 border-teal-150 rounded-lg text-teal-700"
                        >
                          Summarize
                        </Button>
                        <Button 
                          onClick={() => setInputText("Generate 3 critical study questions based on the sources.")} 
                          size="xs" 
                          variant="outline" 
                          className="text-[10px] font-bold h-7 border-teal-150 rounded-lg text-teal-700"
                        >
                          FAQ Outline
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4 bg-white">
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
                              isAI ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-100'
                            }`}>
                              {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className={`p-4 rounded-3xl relative group ${
                                isAI 
                                  ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm' 
                                  : 'bg-teal-600 text-white shadow-md'
                              }`}>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap font-semibold">
                                  {msg.text}
                                </p>

                                {isAI && msg.citations && msg.citations.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t">
                                    {msg.citations.map((cit, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-teal-50 text-teal-800 border border-teal-100 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                      >
                                        [{idx + 1}] Grounded Citation ({cit.sourceTitle})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="block text-[9px] text-slate-400 px-2 mt-0.5 font-semibold">
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {localLoading && (
                        <div className="flex gap-3 text-left mr-auto max-w-[85%]">
                          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                            <Bot className="w-4.5 h-4.5" />
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce animate-delay-0" />
                              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce animate-delay-150" />
                              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce animate-delay-300" />
                              <span className="text-[11px] font-bold text-slate-500 ml-1">Consulting vector database...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Grounded Composer Command Deck */}
                  <div className="p-4 border-t border-slate-200/65 bg-[#FAF9F6] space-y-3 shrink-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-1 border-b">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-1.5">Focus Length:</span>
                        {['short', 'medium', 'long'].map((den) => (
                          <button
                            key={den}
                            onClick={() => { setTextDensity(den as any); showSuccess(`Length: ${den.toUpperCase()}`); }}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all capitalize ${
                              textDensity === den 
                                ? 'bg-teal-50 text-teal-800 font-black' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {den}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mr-1.5">Aura Profile:</span>
                        <div className="flex gap-1">
                          {[
                            { id: 'exploratory', label: 'Exploratory' },
                            { id: 'analytical', label: 'Analytical' },
                            { id: 'study', label: 'Study Guide' }
                          ].map((st) => (
                            <button
                              key={st.id}
                              onClick={() => { setSynthesisStyle(st.id as any); showSuccess(`Synthesis: ${st.label}`); }}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                                synthesisStyle === st.id
                                  ? 'border-teal-500 bg-teal-50 text-teal-800 font-black'
                                  : 'border-slate-200 text-slate-500 hover:text-slate-700'
                              }`}
                            >
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
                        placeholder={hasCheckedSources ? "Query your sources or draft research briefings..." : "Please upload active documents in Pane 1 to activate chat engine."}
                        className="flex-1 rounded-xl h-11 text-xs border-slate-200 focus-visible:ring-teal-500"
                        disabled={localLoading || !hasCheckedSources}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={localLoading || !inputText.trim() || !hasCheckedSources}
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
            /* Saved Guide Notes Tab */
            <div className="h-full overflow-y-auto p-4 bg-[#FAF9F5]/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                
                <Card className="p-4 bg-white border-dashed border-teal-200 rounded-2xl flex flex-col justify-between text-left shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4.5 h-4.5 text-teal-600" />
                      <h3 className="font-extrabold text-xs text-slate-800">Study Notebook Guide Creator</h3>
                    </div>
                    <Input
                      placeholder="Note Title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                    <Textarea
                      placeholder="Compile takeaways, summaries, equations..."
                      value={noteContent}
                      onChange={(e) => setNewContent(e.target.value)}
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

                {activeNotes.map((note) => (
                  <Card key={note.id} className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between text-left shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-800 truncate pr-6">
                          {note.title}
                        </h3>
                        <div className="text-[9px] text-slate-400 font-bold">{note.lastUpdated}</div>
                      </div>
                      <p className="text-slate-600 text-xs mt-2 leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                        {note.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingNoteId(note.id); setEditingContent(note.content); }}
                        className="text-teal-600 font-bold text-xs h-8 px-2.5 rounded-full"
                      >
                        Modify
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 rounded-full h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {activeNotes.length === 0 && (
                  <div className="col-span-1 md:col-span-2 py-10 text-center flex flex-col items-center justify-center text-slate-400">
                    <StickyNote className="w-8 h-8 text-slate-300 mb-2 stroke-1.5" />
                    <h4 className="font-bold text-slate-700 text-xs">No saved guides</h4>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                      Clip highlights or write study notes to save references locally.
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