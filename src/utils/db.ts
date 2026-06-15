"use client";

// Simple state persistence layer for our 100% Free NotebookLM
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
  notebookTitle: "My First Quantum & AI Notebook",
  sources: [
    {
      id: '1',
      title: 'Attention Is All You Need Paper Abstract',
      type: 'pdf',
      content: 'We propose Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for only twelve hours.',
      wordCount: 56,
      addedAt: '2025-05-15'
    },
    {
      id: '2',
      title: 'Quantum Computing Overview MIT Lecture',
      type: 'text',
      content: 'Quantum computing leverages quantum mechanics principles to compute in fundamentally unique ways. Superposition allows quantum bits (qubits) to exist in multiple states simultaneously, and Entanglement links qubit states to enable massive computational power breakthroughs.',
      wordCount: 38,
      addedAt: '2025-05-16'
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Attention Mechanism summary',
      content: 'Key idea: Replaces standard LSTM/RNN cells with multi-head self-attention, permitting faster global training runtimes.',
      lastUpdated: '10 mins ago'
    }
  ],
  messages: [
    {
      id: 'm1',
      sender: 'ai',
      text: "Welcome to Free NotebookLM! I've loaded your default papers on Attention Mechanisms and Quantum Computing. Ask me to explain a concept or generate a summary podcast brief in the right pane.",
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
      return JSON.parse(saved);
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