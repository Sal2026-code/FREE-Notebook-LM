"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, FileText, ArrowRight, Library, Settings, Calendar, User, Search, Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';

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

  // Initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notebooklm_clone_all_notebooks_v1');
      if (saved) {
        setNotebooks(JSON.parse(saved));
      } else {
        const defaults: SimpleNotebook[] = [
          {
            id: 'n-1',
            title: "Web Engineering Master Syllabus",
            updatedAt: "Today",
            sourcesCount: 2,
            notesCount: 1
          },
          {
            id: 'n-2',
            title: "Product Launch Strategy Docs",
            updatedAt: "Yesterday",
            sourcesCount: 4,
            notesCount: 3
          }
        ];
        localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(defaults));
        setNotebooks(defaults);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCreateNotebook = () => {
    const title = newTitle.trim() || "Untitled Notebook";
    const fresh: SimpleNotebook = {
      id: `n-${Date.now()}`,
      title,
      updatedAt: "Just now",
      sourcesCount: 0,
      notesCount: 0
    };

    const updated = [fresh, ...notebooks];
    setNotebooks(updated);
    localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(updated));
    setNewTitle('');
    showSuccess("New workspace created successfully!");
    navigate(`/notebook/${fresh.id}`);
  };

  const handleDeleteNotebook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notebooks.filter(n => n.id !== id);
    setNotebooks(updated);
    localStorage.setItem('notebooklm_clone_all_notebooks_v1', JSON.stringify(updated));
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
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
            JD
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 flex-1">
        
        {/* Top welcome hero card */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalized Notebook Studio</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold leading-relaxed">
            Create structured notebooks, ingest study materials, and build client-side vector search mappings. All files stay fully secure on this device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* First card: Create New Notebook */}
          <Card className="p-6 bg-white border border-slate-250 rounded-2xl flex flex-col justify-between shadow-sm min-h-[190px]">
            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-widest text-[#1a73e8] uppercase">Instant Access</span>
              <h3 className="font-bold text-slate-800 text-sm">Add New Studio Workspace</h3>
              <Input
                placeholder="Study Guide / Project Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs h-9 rounded-xl border-slate-250 focus-visible:ring-blue-500"
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
              className="group cursor-pointer p-6 bg-white hover:bg-slate-50/50 border border-slate-250 rounded-2xl flex flex-col justify-between shadow-sm min-h-[190px] transition-all hover:shadow-md hover:border-slate-300 relative"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wide">
                    {notebook.sourcesCount} Source Files
                  </Badge>
                  <button 
                    onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-[#1a73e8] transition-colors">
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