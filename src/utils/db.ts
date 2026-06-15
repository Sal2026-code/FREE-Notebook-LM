"use client";

import { Source } from '@/components/SourcePanel';
import { Note, ChatMessage } from '@/components/WorkspacePanel';

const STORAGE_KEY = 'free_notebook_lm_data_v1';

export interface NotebookState {
  notebookTitle: string;
  sources: Source[];
  notes: Note[];
  messages: ChatMessage[];
  researchMode: 'fast' | 'deep';
  language: string;
}

const DEFAULT_STATE: NotebookState = {
  notebookTitle: "Web Dev & WP Certification Notebook",
  sources: [
    {
      id: 'src-plan',
      title: 'Free NotebookLM Plan',
      type: 'pdf',
      content: 'This document details the blueprint for Free NotebookLM. Key features include client-side secure sandboxing using browser IndexedDB. No server-side billing workflows or premiums exist. All uploads of PDF, DOCX, TXT, MD, EPUB, CSV, YouTube and more are supported. Generates study preset timelines, quizzes, 3D CSS flashcards with master metrics, and alternated dual-host browser speech synthesis podcast briefing audio overview panel.',
      wordCount: 71,
      addedAt: '2025-05-18',
      folder: 'Notebook Specifications'
    },
    {
      id: 'src-notion-chat-1',
      title: 'Web Dev Notion Chat (Gutenberg & theme.json)',
      type: 'pdf',
      content: 'Discussion on WordPress Certification (WP Certification) and modern block theme architectures. Highlights theme.json files controlling spacing, global palette, layout presets, and custom CSS variables. Explains block-level locks, Gutenberg dynamic block rendering using PHP, block.json configurations, standard template hierarchy structure, and custom React-based blocks for the WordPress Editor.',
      wordCount: 57,
      addedAt: '2025-05-18',
      folder: 'WordPress Study Guides'
    },
    {
      id: 'src-notion-chat-2',
      title: 'Web Dev Notion Chat Pages (API & CPT)',
      type: 'pdf',
      content: 'Covers Advanced Custom Fields (ACF) integration, registering Custom Post Types (CPT) with rest_base enabled, custom REST API endpoints, custom template hierarchies like page-{slug}.php, taxonomies, JS-based Gutenberg editor hooks, register_block_type, dynamic PHP server block render callbacks, and modern headless WordPress workflows.',
      wordCount: 49,
      addedAt: '2025-05-18',
      folder: 'WordPress Study Guides'
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Gutenberg & theme.json Notes',
      content: 'Gutenberg blocks require block.json registering. Global typography, custom color palette presets, and container widths are defined in theme.json.',
      lastUpdated: '10 mins ago'
    }
  ],
  messages: [
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I have loaded your new study materials on WP Certification, Web Dev Notion Chat, and the Free NotebookLM Plan. Ask me any question, and I will parse your files to compile grounded answers with direct citations!",
      timestamp: 'Just now'
    }
  ],
  researchMode: 'fast',
  language: 'en'
};

export function loadNotebookState(): NotebookState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure our default sources are merged if not exists to facilitate smooth testing of new documents
      if (parsed && Array.isArray(parsed.sources)) {
        const hasNewDocs = parsed.sources.some((s: any) => s.id === 'src-notion-chat-1');
        if (!hasNewDocs) {
          parsed.sources = [...DEFAULT_STATE.sources, ...parsed.sources.filter((s: any) => s.id !== '1' && s.id !== '2')];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
  }
  return DEFAULT_STATE;
}

export function saveNotebookState(state: NotebookState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}