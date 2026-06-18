"use client";

import { Source } from '@/components/SourcePanel';
import { Note, ChatMessage } from '@/components/WorkspacePanel';

const STORAGE_KEY = 'absolutely_free_notebook_lm_v2';

export interface NotebookState {
  notebookTitle: string;
  sources: Source[];
  notes: Note[];
  messages: ChatMessage[];
  researchMode: 'fast' | 'deep';
  language: string;
}

const DEFAULT_STATE: NotebookState = {
  notebookTitle: "My Clean Study Notebook",
  sources: [],
  notes: [],
  messages: [
    {
      id: 'm-init',
      sender: 'ai',
      text: "Welcome to absolutelyfreenotebooklm.com! Start by uploading your files, links, or notes in the left pane. All processing and indexing are done securely and privately inside your web browser.",
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

// Generate dynamic co-host conversation script from active sources
export function generateDynamicPodcastScript(sources: Source[]): string {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [
      "Host 1: Oh wow, it looks like we don't have any documents loaded into our study engine yet.",
      "Host 2: Right, exactly! We need the listener to upload some local files so we can dive deep."
    ].join('\n');
  }

  const topic = activeSources[0].title;
  const contentSnippet = activeSources[0].content.slice(0, 300).replace(/[^a-zA-Z0-9\s,.]/g, '');

  return [
    `Host 1: Welcome back to our research deep dive, today we are looking into a document titled ${topic}.`,
    `Host 2: Oh wow, yeah, and honestly, reading through these materials is super interesting, especially the parts about ${contentSnippet.slice(0, 120)}...`,
    `Host 1: Right! It really sets a solid foundation. But wait, tell me more about how that actually works in practice?`,
    `Host 2: Exactly! The source explains that everything runs directly in the client sandbox with zero server latency.`,
    `Host 1: Oh, that is wild. So it is completely private and secure?`,
    `Host 2: Exactly, yes! No external APIs or trackers required. It's beautiful.`
  ].join('\n');
}

// Generate dynamic flashcards
export function generateDynamicFlashcards(sources: Source[]): Array<{ id: string; question: string; answer: string }> {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [];
  }

  const cards: Array<{ id: string; question: string; answer: string }> = [];
  activeSources.forEach((src) => {
    const sentences = src.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);
    
    const sampleSentences = sentences.slice(0, 3);
    sampleSentences.forEach((sentence, idx) => {
      const words = sentence.split(/\s+/);
      const subject = words.slice(0, 3).join(" ");
      cards.push({
        id: `card-${src.id}-${idx}`,
        question: `What details does "${src.title}" mention regarding "${subject}..."?`,
        answer: sentence + "."
      });
    });
  });

  return cards;
}

// Generate dynamic quiz questions
export interface QuizQuestion {
  question: string;
  options: Array<{ id: string; text: string }>;
  correct: string;
}

export function generateDynamicQuizzes(sources: Source[]): QuizQuestion[] {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [];
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
        question: `According to "${src.title}", what does the statement "${keySnippet}..." refer to?`,
        options: [
          { id: 'a', text: `It leads directly to: ${answerSnippet}.` },
          { id: 'b', text: "It is an unconfirmed or empty reference." },
          { id: 'c', text: "It represents a deprecated parameter." }
        ],
        correct: 'a'
      });
    }
  });

  return quizzes;
}

// Generate dynamic presentation slides
export interface Slide {
  title: string;
  text: string;
}

export function generateDynamicSlides(sources: Source[]): Slide[] {
  const activeSources = sources.filter(s => s.checked !== false);
  if (activeSources.length === 0) {
    return [
      {
        title: "Pristine Workspace",
        text: "Your presentation deck is ready. Please ingest some sources in the left panel to populate slides automatically!"
      }
    ];
  }

  const slides: Slide[] = [];
  activeSources.forEach((src) => {
    const paragraphs = src.content
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    const slideContent = paragraphs.slice(0, 2);
    slideContent.forEach((para, idx) => {
      slides.push({
        title: `${src.title} - Core Insight ${idx + 1}`,
        text: para.length > 180 ? para.slice(0, 180) + "..." : para
      });
    });
  });

  return slides;
}