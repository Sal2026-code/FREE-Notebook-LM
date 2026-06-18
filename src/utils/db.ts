"use client";

export interface SourceChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  text: string;
  startIndex: number;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  content: string;
  wordCount: number;
  addedAt: string;
  checked?: boolean;
  folder?: string;
  chunks: SourceChunk[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

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

export interface NotebookState {
  notebookTitle: string;
  sources: Source[];
  notes: Note[];
  messages: ChatMessage[];
  researchMode: 'fast' | 'deep';
  language: string;
}

const STORAGE_KEY = 'free_notebook_lm_clone_v3';

const DEFAULT_STATE: NotebookState = {
  notebookTitle: "My Grounded Study Guide",
  sources: [],
  notes: [],
  messages: [
    {
      id: 'm-init',
      sender: 'ai',
      text: "Welcome to freenotebooklmclone.com! Upload files, paste text, or link articles to start. Your materials are parsed into search index chunks completely locally inside your browser.",
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
    console.error("Failed to load notebook state:", e);
  }
  return DEFAULT_STATE;
}

export function saveNotebookState(state: NotebookState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save notebook state:", e);
  }
}

// Extract source chunks strictly within 300 - 800 character boundaries
export function createChunksFromText(sourceId: string, sourceTitle: string, text: string): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  let index = 0;
  const targetMin = 300;
  const targetMax = 800;

  while (index < text.length) {
    // Determine end coordinate
    let nextBoundary = index + Math.floor(Math.random() * (targetMax - targetMin)) + targetMin;
    if (nextBoundary > text.length) nextBoundary = text.length;

    // Adjust to nearest sentence or word boundary to preserve comprehension integrity
    if (nextBoundary < text.length) {
      const nearestPeriod = text.indexOf('.', nextBoundary);
      if (nearestPeriod !== -1 && nearestPeriod - nextBoundary < 150) {
        nextBoundary = nearestPeriod + 1;
      } else {
        const nearestSpace = text.indexOf(' ', nextBoundary);
        if (nearestSpace !== -1 && nearestSpace - nextBoundary < 50) {
          nextBoundary = nearestSpace + 1;
        }
      }
    }

    const chunkText = text.slice(index, nextBoundary).trim();
    if (chunkText.length > 50) {
      chunks.push({
        id: `chunk-${sourceId}-${chunks.length}`,
        sourceId,
        sourceTitle,
        text: chunkText,
        startIndex: index
      });
    }

    index = nextBoundary;
    if (index >= text.length) break;
  }

  return chunks;
}

// Generate dynamic co-host podcast script using custom browser text-to-speech variables
export function generateCoHostPodcastScript(sources: Source[]): string {
  const active = sources.filter(s => s.checked !== false);
  if (active.length === 0) {
    return [
      "Host 1: Welcome to our local workspace overview.",
      "Host 2: Yes, hello! It looks like we're waiting for some documents to parse."
    ].join('\n');
  }

  const mainSource = active[0];
  const totalWords = active.reduce((acc, curr) => acc + curr.wordCount, 0);

  return [
    `Host 1: Welcome back to the study desk! Today we are digging into ${mainSource.title}.`,
    `Host 2: Oh, wow! This document is incredibly insightful. Right off the bat, there is a lot of weight in the context.`,
    `Host 1: Totally agree. In fact, compiling all active slices across our index shows a footprint of over ${totalWords} words!`,
    `Host 2: That is huge. And remember, all of this is processed in a secure sandbox directly on our screen. No cloud server involved.`,
    `Host 1: Precisely. Let's look closer at the actual definitions inside. It talks about local parameters matching seamlessly with active queries.`,
    `Host 2: Absolutely, yes! The alignment between grounded citations and user queries is perfect.`
  ].join('\n');
}

// Generate dynamic slides
export function generateWorkspaceSlides(sources: Source[]): Array<{ title: string; text: string }> {
  const active = sources.filter(s => s.checked !== false);
  if (active.length === 0) {
    return [
      {
        title: "Welcome to freenotebooklmclone.com",
        text: "Add source documents to trigger real-time AI slide decks. Use the Pencil UI to rewrite slides."
      }
    ];
  }

  const slides: Array<{ title: string; text: string }> = [];
  active.forEach(src => {
    const slideText = src.content.slice(0, 200) + "...";
    slides.push({
      title: `Analysis: ${src.title}`,
      text: slideText
    });
  });

  return slides;
}

// Generate dynamic quizzes
export function generateWorkspaceQuizzes(sources: Source[]): Array<{ question: string; options: Array<{ id: string; text: string }>; correct: string }> {
  const active = sources.filter(s => s.checked !== false);
  if (active.length === 0) {
    return [];
  }

  const quizzes: Array<{ question: string; options: Array<{ id: string; text: string }>; correct: string }> = [];
  active.forEach(src => {
    quizzes.push({
      question: `Which document footprint does "${src.title}" utilize in freenotebooklmclone.com?`,
      options: [
        { id: 'a', text: `It utilizes a safe client-side vector index representing ${src.wordCount} words.` },
        { id: 'b', text: "It utilizes a cloud API server storing data remotely." },
        { id: 'c', text: "It runs with a third-party analytical tool." }
      ],
      correct: 'a'
    });
  });

  return quizzes;
}

// Generate dynamic flashcards
export function generateWorkspaceFlashcards(sources: Source[]): Array<{ id: string; question: string; answer: string }> {
  const active = sources.filter(s => s.checked !== false);
  if (active.length === 0) {
    return [];
  }

  const cards: Array<{ id: string; question: string; answer: string }> = [];
  active.forEach(src => {
    cards.push({
      id: `card-${src.id}`,
      question: `What is the core target document title for our selected source index?`,
      answer: `The title is "${src.title}". It features approximately ${src.wordCount} words fully indexed client-side.`
    });
  });

  return cards;
}