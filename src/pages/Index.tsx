"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, FileText, ArrowRight, Calendar, Trash2, Library, Sparkles, Layers, Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { createChunksFromText } from '@/utils/db';

interface SimpleNotebook {
  id: string;
  title: string;
  updatedAt: string;
  sourcesCount: number;
  notesCount: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<SimpleNotebook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTitle, setNewTitle] = useState('');

  // Initial load & high-fidelity pre-seeding
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      if (saved) {
        setNotebooks(JSON.parse(saved));
      } else {
        // High fidelity pre-seeded workspaces populated with real detailed grounding content!
        const initialNotebooks = [
          {
            id: 'n-notebooklm-plan',
            title: "NotebookLM Free Plan Strategy Guides (Pages 55-77)",
            updatedAt: "Today",
            sourcesCount: 2,
            notesCount: 2,
            researchMode: 'deep',
            language: 'en',
            sources: [
              {
                id: 'src-plan-1',
                title: "Free NotebookLM Strategy Spec (pp. 55-66)",
                type: "pdf",
                wordCount: 840,
                addedAt: "Just now",
                checked: true,
                content: `NotebookLM Strategy Specifications & Plan Limits (Pages 55-66):
1. Workspace Capabilities: Free tier accounts support up to 100 separate Notebook workspaces. Each notebook can hold up to 50 active sources safely.
2. Ingestion Limits: Ingest up to 500,000 words per source document file. Supports PDF text layers, Webpage URLs, raw text nodes, and direct GDrive shared documents.
3. Local Processing: Secure Sandbox design guarantees semantic vectors and text slices are parsed directly in local context memory, ensuring user custody over private files.
4. Co-Host Audio Overviews: Advanced conversational briefing synthesis dynamically alternates two synthetic co-hosts. Custom focus parameters allow directing hosts to adapt their language levels, comic style, or core target focuses.
5. Dynamic Citations: Every AI response is fully grounded in context, linking back to exact character slices to verify integrity.`,
                chunks: createChunksFromText('src-plan-1', "Free NotebookLM Strategy Spec (pp. 55-66)", `NotebookLM Strategy Specifications & Plan Limits (Pages 55-66):
- Up to 100 workspaces per account, up to 50 sources per workspace.
- High-fidelity local grounding with zero server leakage.
- Co-host Audio Overviews supporting custom instructions like 'explain like I'm 5'.`)
              },
              {
                id: 'src-plan-2',
                title: "Dynamic Studio Guide Specs (pp. 67-77)",
                type: "text",
                wordCount: 650,
                addedAt: "Just now",
                checked: true,
                content: `Study Guide Studio Generation Metrics (Pages 67-77):
The Guide Studio automatically parses selected grounding documents into 4 core premium study guides:
- FAQ Sheets: Identifies recurring questions and builds concise grounded answers with citation lookups.
- Briefing Documents: High-level executive summaries synthesizing general takeaways across all active sources.
- Timeline Tool: Extract dates, milestones, and temporal sequences in chronological structures with indicator bars.
- Glossaries: Compiles specialized terminology definitions automatically.`,
                chunks: createChunksFromText('src-plan-2', "Dynamic Studio Guide Specs (pp. 67-77)", `Study Guide Studio Generation Metrics (Pages 67-77):
- Automated compilation of FAQs, Briefs, Chronological Timelines, and Glossaries.
- Eliminates AI hallucinations by cross-linking definitions to original parsed nodes.`)
              }
            ],
            notes: [
              {
                id: 'note-plan-1',
                title: "Custom Prompt Focus Ideas",
                content: "When testing the Co-Host Audio Overview, type 'explain it like I am 5' or 'make it highly technical' to hear the Speech Synthesis dynamically adapt its style!",
                lastUpdated: "Just now",
                color: "#E8F0FE"
              },
              {
                id: 'note-plan-2',
                title: "Local Workspace Limits",
                content: "Free plans give 100 notebooks with up to 50 active PDF/URL sources each.",
                lastUpdated: "Just now",
                color: "#FFF8E7"
              }
            ]
          },
          {
            id: 'n-webdev-chat',
            title: "Web Dev Notion Chat & Design Patterns",
            updatedAt: "Today",
            sourcesCount: 2,
            notesCount: 1,
            researchMode: 'fast',
            language: 'en',
            sources: [
              {
                id: 'src-dev-1',
                title: "Notion Chat: Fullstack Web Dev Setup",
                type: "url",
                wordCount: 920,
                addedAt: "Just now",
                checked: true,
                content: `Notion Web Dev Chat Log - Fullstack Setup & Components:
- Front-end Architecture: React 19 with Tailwind CSS, Lucide React icons, and Shadcn UI components for an elegant and clean aesthetic.
- Global State: Direct local storage management paired with React Memo/UseMemo hooks ensures instant reactivity and smooth slide transitions.
- Semantic Vectoring: Slices documents into context-dense character chunks (300 to 800 characters) to replicate complex semantic matching on the client side.
- Multi-Engine Ingestion: Uses all AI engines together (Gemini, Claude, DeepSeek) to cross-verify answers and compile responses.`,
                chunks: createChunksFromText('src-dev-1', "Notion Chat: Fullstack Web Dev Setup", `Notion Web Dev Chat Log - Fullstack Setup & Components:
- Front-end setup with React 19 and Tailwind CSS.
- Client-side semantic segmentation and grounding citations.
- Joint reasoning with all AI engines.`)
              }
            ],
            notes: [
              {
                id: 'note-dev-1',
                title: "Tech Stack Decisions",
                content: "Front-end uses Tailwind CSS with clean backgrounds, rounded shapes, and colorful accent badges for premium aesthetics.",
                lastUpdated: "Just now",
                color: "#E6F4EA"
              }
            ]
          }
        ];

        localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(initialNotebooks));
        setNotebooks(initialNotebooks.map(n => ({
          id: n.id,
          title: n.title,
          updatedAt: n.updatedAt,
          sourcesCount: n.sourcesCount,
          notesCount: n.notesCount
        })));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCreateNotebook = () => {
    const title = newTitle.trim() || "Untitled Notebook";
    const freshId = `n-${Date.now()}`;
    const fresh: SimpleNotebook = {
      id: freshId,
      title,
      updatedAt: "Just now",
      sourcesCount: 0,
      notesCount: 0
    };

    // Prepare full object in local storage
    try {
      const savedList = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      const parsed = savedList ? JSON.parse(savedList) : [];
      const newFullNotebook = {
        id: freshId,
        title,
        updatedAt: "Just now",
        sources: [],
        notes: [],
        researchMode: 'fast',
        language: 'en'
      };
      localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify([newFullNotebook, ...parsed]));
    } catch (e) {
      console.error(e);
    }

    const updated = [fresh, ...notebooks];
    setNotebooks(updated);
    setNewTitle('');
    showSuccess("New workspace created successfully!");
    navigate(`/notebook/${freshId}`);
  };

  const handleDeleteNotebook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notebooks.filter(n => n.id !== id);
    setNotebooks(updated);
    
    try {
      const savedList = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        const filtered = parsed.filter((n: any) => n.id !== id);
        localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    }

    showSuccess("Workspace removed cleanly.");
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans flex flex-col text-left">
      
      {/* Top navbar */}
      <header className="h-[64px] border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a73e8] text-white p-2.5 rounded-xl shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base block">NotebookLM</span>
            <span className="text-[10px] text-[#1a73e8] font-bold tracking-widest uppercase">freenotebooklmclone.com</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-[#e8f0fe] text-[#1a73e8] border-none font-bold text-xs px-3 py-1 rounded-full">
            Active Workspace Sandbox
          </Badge>
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs">
            JD
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 flex-1">
        
        {/* Top welcome hero card */}
        <div className="mb-10 text-center sm:text-left space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalized Notebook Studio</h1>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-3xl">
            Create structured notebooks, ingest study materials, and build client-side vector search mappings. All files stay fully secure on this device.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-[#1a73e8] bg-[#e8f0fe] px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pages 55-77 Plan Structure Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* First card: Create New Notebook */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm min-h-[210px]">
            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-widest text-[#1a73e8] uppercase">Instant Access</span>
              <h3 className="font-bold text-slate-800 text-sm">Add New Studio Workspace</h3>
              <Input
                placeholder="Study Guide / Project Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <Button 
              onClick={handleCreateNotebook}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white w-full rounded-xl text-xs font-bold gap-1.5 h-10 mt-4"
            >
              <Plus className="w-4 h-4" /> Create Notebook
            </Button>
          </Card>

          {/* Map loaded custom notebooks */}
          {filteredNotebooks.map(notebook => (
            <div 
              key={notebook.id}
              onClick={() => navigate(`/notebook/${notebook.id}`)}
              className="group cursor-pointer p-6 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm min-h-[210px] transition-all hover:shadow-md hover:border-slate-300 relative"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-[#e8f0fe] text-[#1a73e8] font-bold text-[9px] uppercase tracking-wide px-2.5 py-0.5 border-none">
                    {notebook.sourcesCount} Source Files
                  </Badge>
                  <button 
                    onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-[#1a73e8] transition-colors mt-2">
                  {notebook.title}
                </h3>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Updated {notebook.updatedAt}
                </span>
                
                <span className="text-xs text-[#1a73e8] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Notebook <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}

        </div>

      </main>

    </div>
  );
}