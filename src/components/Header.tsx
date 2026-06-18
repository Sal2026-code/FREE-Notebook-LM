"use client";

import React, { useState } from 'react';
import { 
  Share2, Globe, Sun, Moon, Database, Edit3, Check, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';
import NotebookLMLogo from '@/components/NotebookLMLogo';

interface HeaderProps {
  title: string;
  onRenameTitle: (newTitle: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  exportDatabase: () => void;
  importDatabase: (data: string) => void;
  activeSourceCount: number;
}

export default function Header({
  title,
  onRenameTitle,
  language,
  onLanguageChange,
  exportDatabase,
  importDatabase,
  activeSourceCount
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [importText, setImportText] = useState("");
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onRenameTitle(tempTitle.trim());
      setIsEditing(false);
      showSuccess("Workspace renamed successfully!");
    } else {
      showError("Title cannot be empty.");
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    const root = window.document.documentElement;
    if (!isDarkMode) {
      root.classList.add('dark');
      showSuccess("Dark mode activated!");
    } else {
      root.classList.remove('dark');
      showSuccess("Light mode activated!");
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess("Platform link copied!");
  };

  const handleImport = () => {
    if (!importText.trim()) {
      showError("Please paste a valid session backup.");
      return;
    }
    importDatabase(importText);
    setIsBackupOpen(false);
    setImportText("");
  };

  return (
    <header className="h-[56px] fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-[#FFFFFF]/90 dark:bg-[#121212]/90 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <NotebookLMLogo className="w-9 h-9" />
        
        <div className="flex items-center gap-3 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="h-8 py-0.5 px-3 text-xs font-bold w-48 border-teal-500 focus-visible:ring-teal-500 rounded-lg"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:bg-teal-50" onClick={handleSaveTitle}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span 
                onClick={() => {
                  setTempTitle(title);
                  setIsEditing(true);
                }}
                className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate hover:bg-slate-150/40 dark:hover:bg-slate-850 px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-2"
              >
                {title}
                <Edit3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </span>
            </div>
          )}

          <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 font-bold text-[10px] rounded-full px-2.5 py-0.5 shrink-0">
            freenotebooklmclone.com
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-[110px] sm:w-[130px]">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-full">
              <Globe className="h-3.5 w-3.5 mr-1 text-slate-500" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="es">Español (ES)</SelectItem>
              <SelectItem value="fr">Français (FR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isBackupOpen} onOpenChange={setIsBackupOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-full border-slate-200 dark:border-slate-800 hover:text-teal-600 hover:bg-teal-50 text-xs font-semibold flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">Backup Storage</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" /> Local Client Sandbox Backup
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Your study guides are indexed and kept fully local within the browser engine. Export or load backup states seamlessly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="flex gap-2">
                <Button 
                  onClick={exportDatabase} 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Backup JSON
                </Button>
                <Button 
                  onClick={handleCopyShare}
                  variant="outline" 
                  className="flex-1 border-slate-200 rounded-xl text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-300"
                >
                  <Share2 className="w-4 h-4 text-teal-600" /> Share Clone Link
                </Button>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Restore session payload</label>
                <Input
                  placeholder="Paste export backup JSON string..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsBackupOpen(false)} className="rounded-full text-xs">Close</Button>
              <Button onClick={handleImport} className="bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-bold">Restore Backup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full border-slate-200 dark:border-slate-800 hover:text-teal-600 hover:bg-teal-50"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-teal-600" />}
        </Button>

      </div>
    </header>
  );
}