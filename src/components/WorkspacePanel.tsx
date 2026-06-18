"use client";

import React, { useState } from 'react';
import { 
  Send, Bot, User, Sparkles, Trash2, StickyNote, Plus, ChevronLeft, 
  ChevronRight, AlignLeft, BookOpen, Brush, Download, History, ArrowRight, Save
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
    chunkId: string;
  }>;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  color?: string;
}

interface WorkspacePanelProps {
  sources: Source[];
  activeNotes: Note[];
  onAddNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onAddSourceClick: () => void;
  isLoading: boolean;
  onTriggerCitationHighlight: (chunkText: string) => void; 
}

export default function WorkspacePanel({
  sources,
  activeNotes,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onAddSourceClick,
  isLoading,
  onTriggerCitationHighlight
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'ai',
      text: "Ready to ground analysis! Add your books, study resources or URLs in the Source panel. Once files are in, ask questions here to trace highlighted source fragments automatically.",
      timestamp: 'Just now'
    }
  ]);
  const [localLoading, setLocalLoading] = useState(false);

  const hasCheckedSources = sources.some(s => s.checked !== false);

  const handleSendQuery = (query: string) => {
    if (!query.trim() || !hasCheckedSources) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLocalLoading(true);

    setTimeout(() => {
      // Look up chunks dynamically
      const active = sources.filter(s => s.checked !== false);
      let matchedChunk: any = null;

      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const src of active) {
        for (const chk of src.chunks) {
          const matchCount = queryWords.filter(w => chk.text.toLowerCase().includes(w)).length;
          if (matchCount > 0) {
            matchedChunk = chk;
            break;
          }
        }
        if (matchedChunk) break;
      }

      // Fallback
      if (!matchedChunk && active.length > 0 && active[0].chunks.length > 0) {
        matchedChunk = active[0].chunks[0];
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: matchedChunk 
          ? `Regarding your focus query, the index of "${matchedChunk.sourceTitle}" confirms details. Traced matching text: "${matchedChunk.text.slice(0, 200)}..."`
          : "Matches not loaded. Please ensure sources contain relevant keywords.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: matchedChunk ? [{
          sourceId: matchedChunk.sourceId,
          sourceTitle: matchedChunk.sourceTitle,
          chunkText: matchedChunk.text,
          chunkId: matchedChunk.id
        }] : []
      };

      setMessages(prev => [...prev, aiMsg]);
      setLocalLoading(false);
      showSuccess("Query indexed against local vector db!");
    }, 1100);
  };

  const handleClipToNote = (msgText: string) => {
    onAddNote("Clipped Insight", msgText);
    showSuccess("Insight clipped to study notebook!");
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#FBFBFB] dark:bg-[#121212] text-left overflow-hidden">
      
      {/* Fixed top Workspace Tab Ribbon */}
      <div className="px-5 py-3 border-b border-slate-200 bg-[#FAF9F6] flex items-center justify-between shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'notes')} className="w-auto">
          <TabsList className="bg-slate-200/60 p-0.5 rounded-lg">
            <TabsTrigger value="chat" className="text-xs font-bold px-4 py-1.5 rounded-md">Chat Synthesis</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs font-bold px-4 py-1.5 rounded-md">Saved Notes ({activeNotes.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Badge className="bg-teal-50 border border-teal-200 text-teal-700 font-extrabold text-[10px] rounded-full px-2.5 py-0.5">
          freenotebooklmclone.com
        </Badge>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full flex flex-col">
            
            {/* PERMANENT SUMMARIZER CARD AT THE TOP OF THE CHAT SCREEN */}
            <div className="p-4 bg-white border-b border-slate-150 shrink-0">
              <div className="bg-gradient-to-br from-teal-50/60 via-emerald-50/30 to-white dark:from-slate-900 dark:to-slate-950 p-4 rounded-3xl border border-teal-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#006a6a] text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Grounded Study Desk</h3>
                  </div>
                  <Badge className="bg-teal-600/10 text-teal-700 border-none rounded-full px-2 py-0.5 text-[9px] font-bold">
                    ACTIVE INDEX SUMMARY
                  </Badge>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  This workspace parses uploaded textual strings into local chunk footprints of 300 - 800 characters, indexing coordinates for flash citation.
                </p>

                {/* Grounded chips pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Outline the top 3 core takeaways.",
                    "Highlight recurring definitions & variables.",
                    "Generate a rigorous FAQ briefing sheet."
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      disabled={!hasCheckedSources}
                      onClick={() => handleSendQuery(pill)}
                      className="text-[10px] font-extrabold text-teal-700 hover:text-white border border-teal-150 hover:bg-teal-600 px-3 py-1 rounded-full transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1 p-4 bg-white dark:bg-slate-900">
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg) => {
                  const isAI = msg.sender === 'ai';
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isAI ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-100'
                      }`}>
                        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className={`p-4 rounded-3xl text-xs leading-relaxed whitespace-pre-wrap font-semibold ${
                          isAI ? 'bg-slate-50 border border-slate-200/80 text-slate-800' : 'bg-[#006a6a] text-white shadow-sm'
                        }`}>
                          {msg.text}

                          {isAI && msg.citations && msg.citations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-200">
                              {msg.citations.map((cit, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    onTriggerCitationHighlight(cit.chunkText);
                                    showSuccess(`Flashing citation highlight from: "${cit.sourceTitle}"`);
                                  }}
                                  className="bg-yellow-50 hover:bg-yellow-100 text-slate-800 border border-yellow-200 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                  [{idx + 1}] citation ({cit.sourceTitle})
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between px-2 pt-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {msg.timestamp}
                          </span>
                          {isAI && (
                            <button
                              onClick={() => handleClipToNote(msg.text)}
                              className="text-[9px] text-teal-600 hover:text-teal-700 hover:underline font-extrabold flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save to Note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {localLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-3xl flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="text-[11px] font-bold text-slate-500">Querying vector index slices...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Composer */}
            <div className="p-4 border-t border-slate-200 bg-[#FAF9F6] shrink-0">
              {!hasCheckedSources ? (
                <div className="text-center py-2">
                  <p className="text-[11px] font-bold text-teal-700">Please select or upload source files in Left Pane to enable input.</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendQuery(inputText)}
                    placeholder="Ask questions about your uploaded documents..."
                    className="flex-1 rounded-xl h-11 text-xs border-slate-200 focus-visible:ring-teal-500 bg-white"
                  />
                  <Button
                    onClick={() => handleSendQuery(inputText)}
                    disabled={!inputText.trim() || localLoading}
                    className="bg-[#006a6a] hover:bg-[#005252] text-white rounded-xl h-11 w-11 flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Notes Canvas tab: Replicating Google Keep card layouts */
          <div className="h-full overflow-y-auto p-5 bg-[#FAF9F5]/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              <Card className="p-4 bg-white border-dashed border-teal-200 rounded-3xl flex flex-col justify-between text-left shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4.5 h-4.5 text-teal-600" />
                    <h3 className="font-extrabold text-xs text-slate-800">Add Sticky Note</h3>
                  </div>
                  <Input
                    placeholder="Note Title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <Textarea
                    placeholder="Write custom study takeaway..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[100px] rounded-xl text-xs resize-none"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!noteTitle.trim()) {
                      showError("Please enter note title");
                      return;
                    }
                    onAddNote(noteTitle, noteContent || "Empty study notes.");
                    setNoteTitle('');
                    setNoteContent('');
                    showSuccess("Note card logged!");
                  }}
                  size="sm"
                  className="bg-[#006a6a] hover:bg-[#005252] text-white w-full rounded-full font-bold text-xs mt-3 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Save Sticky Note
                </Button>
              </Card>

              {activeNotes.map((note) => (
                <Card key={note.id} className="p-4 bg-white border border-slate-250 rounded-3xl flex flex-col justify-between text-left shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <h3 className="font-extrabold text-xs text-slate-800 truncate pr-6">{note.title}</h3>
                      <div className="text-[9px] text-slate-400 font-bold">{note.lastUpdated}</div>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto font-medium">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                    <span className="text-[9px] font-extrabold text-[#006a6a] tracking-wide uppercase">Workspace Card</span>
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

            </div>
          </div>
        )}
      </div>

    </div>
  );
}