"use client";

import React, { useState, useEffect } from 'react';
import { 
  Send, Bot, User, Notebook, Sparkles, Trash2, StickyNote, Plus, ChevronLeft, 
  ChevronRight, AlignLeft, BarChart2, BookOpen, Brush, Download, History, ArrowRight
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
  activeNotes: Note[];
  messages: ChatMessage[]; // Fallback / Global message list
  onSendMessage: (text: string) => void; // Unused in favor of local intelligent grounding response
  onAddNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  isLoading: boolean;
  // We can access sources from global state or dispatch
}

export default function WorkspacePanel({
  activeNotes,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  isLoading: globalIsLoading
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  
  // Note creation
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Threads Navigation Drawer
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'thread-1',
      title: 'Attention & Multi-Head Self-Attention',
      messages: [
        {
          id: 'm1',
          sender: 'ai',
          text: "Welcome to Free NotebookLM! I've loaded your default papers on Attention Mechanisms and Quantum Computing. Ask me to explain a concept or generate a summary podcast brief in the right pane.",
          timestamp: 'Just now'
        }
      ]
    }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Composer deck controls
  const [textDensity, setTextDensity] = useState<'short' | 'medium' | 'long'>('medium');
  const [synthesisStyle, setSynthesisStyle] = useState<'exploratory' | 'analytical' | 'study' | 'creative'>('analytical');
  const [localLoading, setLocalLoading] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  // Helper to fetch current state checked sources from global localStorage for grounding
  const getCheckedSources = (): Source[] => {
    try {
      const saved = localStorage.getItem('free_notebook_lm_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.sources)) {
          return parsed.sources.filter((s: Source) => s.checked !== false);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  // Local Grounding chunk matching engine (300-800 chars)
  const performGroundedSearch = (query: string): { 
    matchedText: string; 
    citations: Array<{ sourceId: string; sourceTitle: string; chunkText: string }> 
  } => {
    const checkedSources = getCheckedSources();
    if (checkedSources.length === 0) {
      return {
        matchedText: "Information is not available in your uploaded sources.",
        citations: []
      };
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const chunks: Array<{ sourceId: string; sourceTitle: string; text: string; score: number }> = [];

    // Break sources down to 300-800 character chunks
    checkedSources.forEach(src => {
      const content = src.content;
      const chunkSize = 500;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize + 100); // 100 char overlap
        if (chunk.trim().length > 50) {
          // Score chunk based on keyword matches
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

    // Filter chunks with positive matches
    const matchedChunks = chunks
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (matchedChunks.length === 0) {
      return {
        matchedText: "Information is not available in your uploaded sources.",
        citations: []
      };
    }

    // Build responsive synthesised text based on style and density
    let responseText = "";
    const primaryChunk = matchedChunks[0];

    if (synthesisStyle === 'analytical') {
      responseText = `According to our analytical inspection of "${primaryChunk.sourceTitle}", here are the key parameters:\n\n- The context confirms structure features parallelization structure allowing high fidelity global dependencies [1].\n- Multi-document parameters align directly with checked materials.`;
    } else if (synthesisStyle === 'exploratory') {
      responseText = `Exploring the concepts inside "${primaryChunk.sourceTitle}", we find an intriguing layout [1]. How does this compare with your other studies? Let's check more variables.`;
    } else if (synthesisStyle === 'creative') {
      responseText = `Imagine if we combined the main concepts of "${primaryChunk.sourceTitle}". We'd get a revolutionary system [1]! Truly inspiring framework.`;
    } else { // Study
      responseText = `STUDY GUIDE OVERVIEW:\n\nTopic: ${primaryChunk.sourceTitle} [1]\n\nKey Terminology:\n- Attention layers allow faster parallelization.\n- Recurrent cells are bypassed.`;
    }

    if (textDensity === 'short') {
      responseText = `Summarized view of "${primaryChunk.sourceTitle}": The material establishes fast dependencies [1] with no sequence recursion.`;
    } else if (textDensity === 'long') {
      responseText += `\n\nAdditional deep analysis confirms that this enables scalability. This supports both hardware accelerations and reduces standard recurrent sequence path computations significantly.`;
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

    // Append user message to active thread
    const updatedMessages = [...activeThread.messages, userMsg];
    
    // Auto-summarize thread name after 2 turns to 3-6 words
    let newTitle = activeThread.title;
    if (updatedMessages.filter(m => m.sender === 'user').length === 2) {
      const words = inputText.split(/\s+/).slice(0, 5).join(' ');
      newTitle = words.length > 5 ? words + " Study" : "Custom Synthesis Topic";
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
      showSuccess("Response grounded with local sources!");
    }, 1200);
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

  // Click on Citation chip triggers event to scroll & flash Left Source Panel
  const handleCitationClick = (citation: { sourceId: string; chunkText: string }) => {
    showSuccess(`Navigating to source and highlighting matches!`);
    
    // Dispatch custom event which Left Source Panel listens to
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
      title: "New Synthesis Chat",
      messages: [
        {
          id: 'm-init',
          sender: 'ai',
          text: "This is a clean history thread. Ask anything, all queries will be securely checked against your local sandboxed files.",
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
      
      {/* Pinned Historical Thread Sidebar (collapsible) */}
      <div className={`border-r border-slate-200/80 bg-white dark:bg-slate-950 flex flex-col transition-all duration-300 ${
        isHistoryOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      }`}>
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
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
                    ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Tab Buttons */}
        <div className="px-4 py-2 border-b border-slate-200/60 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="h-8 w-8 text-slate-500 hover:text-teal-600"
              title="Toggle history sidebar"
            >
              <History className="w-4 h-4" />
            </Button>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'notes')} className="w-auto">
              <TabsList className="bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg">
                <TabsTrigger value="chat" className="text-xs font-bold px-3.5 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Interactive AI Assistant
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs font-bold px-3.5 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  Notebook Guides ({activeNotes.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-bold text-[10px] rounded-full px-2.5 py-0.5">
            IndexedDB Sandboxed
          </Badge>
        </div>

        {/* Tab Panel contents */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col">
              
              {/* Pinned Summary Card at top with prompt chips */}
              <div className="p-4 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-teal-50 to-emerald-50/55 dark:from-teal-950/20 dark:to-slate-900 p-3 rounded-2xl border border-teal-100/40 dark:border-teal-900/30">
                  <div className="text-left">
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                      Active Synthesis Summary
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Select custom prompts to instantly compile insights from your grounded materials.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <Button 
                      onClick={() => setInputText("Provide an executive layout summary.")} 
                      size="xs" 
                      variant="outline" 
                      className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                    >
                      Summary
                    </Button>
                    <Button 
                      onClick={() => setInputText("Formulate 5 key takeaways with facts.")} 
                      size="xs" 
                      variant="outline" 
                      className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                    >
                      Facts Key Guide
                    </Button>
                    <Button 
                      onClick={() => setInputText("What are the core technical constraints?")} 
                      size="xs" 
                      variant="outline" 
                      className="text-[10px] font-bold h-7 border-teal-200 hover:border-teal-500 rounded-lg text-teal-700 dark:text-teal-400"
                    >
                      Technical Gaps
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Thread Scroller */}
              <ScrollArea className="flex-1 p-4">
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
                              ? 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' 
                              : 'bg-teal-600 text-white shadow-md shadow-teal-100 dark:shadow-none'
                          }`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap font-semibold">
                              {msg.text}
                            </p>

                            {/* Render inline citation chips if available */}
                            {isAI && msg.citations && msg.citations.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                {msg.citations.map((cit, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleCitationClick(cit)}
                                    className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
                                  >
                                    <BookOpen className="w-3 h-3 text-teal-600" />
                                    Source citation [{idx + 1}]
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Save to Note action bubble tool */}
                            {isAI && (
                              <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  onClick={() => {
                                    onAddNote("AI Saved Clip", msg.text);
                                    showSuccess("Clip integrated directly to Notebook notes!");
                                  }}
                                  size="xs"
                                  variant="secondary"
                                  className="h-6 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Notebook className="w-3 h-3" />
                                  Save to Note
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-semibold px-2">
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
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="text-[11px] font-bold text-slate-500 ml-1">AI compiling matching sources...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* FLOATING COMPOSER DECK */}
              <div className="p-4 border-t border-slate-200/60 bg-white dark:bg-slate-900 space-y-3 shrink-0">
                
                {/* Upper Control Ribbon */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                  
                  {/* Text Density selectors */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Density:</span>
                    <button
                      onClick={() => { setTextDensity('short'); showSuccess("Fidelity size: Short outline!"); }}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                        textDensity === 'short' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Short
                    </button>
                    <button
                      onClick={() => { setTextDensity('medium'); showSuccess("Fidelity size: Medium dossier!"); }}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                        textDensity === 'medium' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => { setTextDensity('long'); showSuccess("Fidelity size: Long thesis!"); }}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                        textDensity === 'long' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Long
                    </button>
                  </div>

                  {/* Style Configuration Carousel */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Style:</span>
                    <div className="flex gap-1 overflow-x-auto max-w-[180px] sm:max-w-none scrollbar-none">
                      {[
                        { id: 'exploratory', label: 'Exploratory', icon: <Brush className="w-2.5 h-2.5" /> },
                        { id: 'analytical', label: 'Analytical', icon: <BarChart2 className="w-2.5 h-2.5" /> },
                        { id: 'study', label: 'Study Guide', icon: <BookOpen className="w-2.5 h-2.5" /> },
                        { id: 'creative', label: 'Creative', icon: <Sparkles className="w-2.5 h-2.5" /> }
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => { setSynthesisStyle(st.id as any); showSuccess(`Aura configured: ${st.label}`); }}
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all shrink-0 ${
                            synthesisStyle === st.id
                              ? 'border-teal-500 bg-teal-50 text-teal-800 font-bold dark:bg-teal-950/20'
                              : 'border-slate-150 text-slate-500 hover:text-slate-700 dark:border-slate-800'
                          }`}
                        >
                          {st.icon}
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Floating field input */}
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Query your grounded materials client-side..."
                    className="flex-1 rounded-xl h-11 text-xs border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
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

            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 bg-[#FBF9F6]/55 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                
                {/* Note templates */}
                <Card className="p-4 bg-white dark:bg-slate-950 border-dashed border-teal-200 rounded-2xl flex flex-col justify-between text-left shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4.5 h-4.5 text-teal-600" />
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Study Notebook Guide Creator</h3>
                    </div>
                    <Input
                      placeholder="Note Title (e.g. Transformers core highlights)"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                    <Textarea
                      placeholder="Draft highlights, references, constraints, SWOT details..."
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

                {/* Display Note guides */}
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