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
  notebookTitle: "My Custom Study Notebook",
  sources: [],
  notes: [],
  messages: [
    {
      id: 'm-init',
      sender: 'ai',
      text: "Welcome to your secure local Notebook! Please click '+ Add Source' on the left to upload any custom text documents, articles, transcripts, or specifications. All data is parsed and stored entirely inside your local browser sandbox.",
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
      if (parsed && Array.isArray(parsed.sources)) {
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

// Client-side heuristic parser to generate dynamic flashcards from any loaded source text
export function generateDynamicFlashcards(sources: Source[]): Array<{ id: string; question: string; answer: string }> {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [
      {
        id: 'no-source-1',
        question: "How do I generate interactive flashcards?",
        answer: "Please upload and check at least one source file in the left panel to automatically extract key concepts!"
      }
    ];
  }

  const cards: Array<{ id: string; question: string; answer: string }> = [];
  activeSources.forEach((src, sIdx) => {
    const sentences = src.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);
    
    // Pick up to 3 interesting sentences to form flashcards
    const sampleSentences = sentences.slice(0, 3);
    sampleSentences.forEach((sentence, idx) => {
      // Create a basic concept question
      const words = sentence.split(/\s+/);
      const subject = words.slice(0, 3).join(" ");
      cards.push({
        id: `card-${src.id}-${idx}`,
        question: `Based on "${src.title}", what can you tell us about "${subject}..."?`,
        answer: sentence + "."
      });
    });
  });

  return cards;
}

// Client-side heuristic parser to generate dynamic quiz questions
export interface QuizQuestion {
  question: string;
  options: Array<{ id: string; text: string }>;
  correct: string;
}

export function generateDynamicQuizzes(sources: Source[]): QuizQuestion[] {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [
      {
        question: "Are there any study documents active for your test?",
        options: [
          { id: 'a', text: "No, please upload source files first." },
          { id: 'b', text: "Yes, but they are unchecked." }
        ],
        correct: 'a'
      }
    ];
  }

  const quizzes: QuizQuestion[] = [];
  activeSources.forEach((src) => {
    const sentences = src.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 40);

    if (sentences.length > 0) {
      const sentence = sentences[0];
      const words = sentence.split(/\s+/);
      const keySnippet = words.slice(0, Math.min(5, words.length)).join(" ");
      const answerSnippet = words.slice(Math.max(0, words.length - 8)).join(" ");

      quizzes.push({
        question: `According to "${src.title}", complete this statement: "${keySnippet} ... ?"`,
        options: [
          { id: 'a', text: `... ${answerSnippet}.` },
          { id: 'b', text: "... is not mentioned in the context." },
          { id: 'c', text: "... is fully deprecated in the specification." }
        ],
        correct: 'a'
      });
    }
  });

  return quizzes.length > 0 ? quizzes : [
    {
      question: "Are there any study documents active for your test?",
      options: [
        { id: 'a', text: "No, please upload source files first." },
        { id: 'b', text: "Yes, but they are unchecked." }
      ],
      correct: 'a'
    }
  ];
}

// Client-side heuristic parser to generate dynamic presentation slides
export interface Slide {
  title: string;
  text: string;
}

export function generateDynamicSlides(sources: Source[]): Slide[] {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [
      {
        title: "Welcome Slide",
        text: "Please add your custom sources on the left. The slide presentation engine will automatically extract key concepts into a structured summary presentation!"
      }
    ];
  }

  const slides: Slide[] = [];
  activeSources.forEach((src) => {
    const paragraphs = src.content
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 50);

    const slideContent = paragraphs.slice(0, 2);
    slideContent.forEach((para, idx) => {
      slides.push({
        title: `${src.title} - Highlight Part ${idx + 1}`,
        text: para.length > 180 ? para.slice(0, 180) + "..." : para
      });
    });
  });

  return slides.length > 0 ? slides : [
    {
      title: "Active Document Summary",
      text: `We have loaded your custom document "${activeSources[0].title}". Explore the interactive chat panel, study guides, or co-host podcast briefings to synthesize your data.`
    }
  ];
}