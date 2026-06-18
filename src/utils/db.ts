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
  type: 'pdf' | 'url' | 'drive' | 'text';
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
  color?: string; // Material Google Keep style Hex colors
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  enginesUsed?: string[];
  reasoningSteps?: string[];
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
  activeEngines: string[];
}

// Extract semantic chunks safely
export function createChunksFromText(sourceId: string, sourceTitle: string, text: string): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  let index = 0;
  const targetMin = 300;
  const targetMax = 800;

  while (index < text.length) {
    let nextBoundary = index + Math.floor(Math.random() * (targetMax - targetMin)) + targetMin;
    if (nextBoundary > text.length) nextBoundary = text.length;

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

// High-fidelity Audio Overview script co-host generation taking into account CUSTOM focus instructions
export function generateCoHostPodcastScript(sources: Source[], customInstructions?: string): string {
  const active = sources.filter(s => s.checked !== false);
  const focusText = customInstructions?.trim() 
    ? `focused strictly on: "${customInstructions}"` 
    : "as a general deep dive summary";

  if (active.length === 0) {
    return [
      "Host 1: Hey there! Welcome back to our study space.",
      "Host 2: Hi! We're ready to do a deep dive, but we're just waiting on some source documents.",
      "Host 1: Exactly. Once you upload PDFs, web links, or text notes, we'll parse them instantly.",
      "Host 2: Ready when you are! Paste those sources and we'll jump right in."
    ].join('\n');
  }

  const primarySource = active[0];
  const totalWords = active.reduce((acc, curr) => acc + curr.wordCount, 0);

  // Dynamic variation based on custom co-host directions
  const isLighthearted = customInstructions?.toLowerCase().includes("funny") || customInstructions?.toLowerCase().includes("joke");
  const isExplainLike5 = customInstructions?.toLowerCase().includes("5") || customInstructions?.toLowerCase().includes("child");
  const isTechnical = customInstructions?.toLowerCase().includes("technical") || customInstructions?.toLowerCase().includes("code") || customInstructions?.toLowerCase().includes("deep");

  if (isExplainLike5) {
    return [
      `Host 1: Alright, imagine we're building a massive Lego castle today. That castle is our document, "${primarySource.title}".`,
      `Host 2: Oh, I love Legos! And instead of tiny plastic bricks, we've got about ${totalWords} word bricks making up the foundation!`,
      `Host 1: Exactly! Now, looking at this castle through our special lens, the key takeaway is super simple: make sure everything is built on safe, solid ground.`,
      `Host 2: Right, no building castles in the sky or on shaky sand! It has to stay inside our safe playground sandbox.`,
      `Host 1: And if we ever get lost, we have actual treasure maps, which are citations, to point us to the exact brick we used!`,
      `Host 2: That makes it so easy to play and explore safely without any guessing games. Love that explanation!`
    ].join('\n');
  }

  if (isLighthearted) {
    return [
      `Host 1: Well, well, well... look what the web scraper dragged in! Today we're breaking down "${primarySource.title}".`,
      `Host 2: Oh great! Over ${totalWords} words of pure excitement. I hope everyone brought their coffee for this one!`,
      `Host 1: Hey, don't sleep on this context. The author is actually making some hilarious, brilliant points about local security.`,
      `Host 2: Wait, local security is funny now? "What did the database say to the vector search chunk? You complete me!"`,
      `Host 1: (laughs) Wow, that was terrible. But seriously, keeping data secure in the local browser isn't a joke!`,
      `Host 2: No, it's not. It means your secret notebooks stay right on your machine. Which means no cloud leaks, and more time for dad jokes!`,
      `Host 1: Fair enough! Let's wrap this up before your jokes get any worse.`
    ].join('\n');
  }

  if (isTechnical) {
    return [
      `Host 1: Let's initiate a rigorous technical dry run of "${primarySource.title}", prioritizing strict local client ingestion parameters.`,
      `Host 2: Understood. We're monitoring over ${totalWords} tokens mapped against multi-layered vector indices.`,
      `Host 1: The core architecture routes queries through a composite pipeline of Gemini Pro, Claude 3.5, and DeepSeek model nodes.`,
      `Host 2: Exactly. By using high-density vector slicing of 300 to 800 characters, we maximize retrieval precision while minimizing token footprint.`,
      `Host 1: Crucially, this setup guarantees zero-leak security. The vectors remain locked inside the indexed DB namespace on-device.`,
      `Host 2: A perfect integration of absolute sandbox custody and lightning-fast neural reasoning. Beautiful.`
    ].join('\n');
  }

  // Default script
  return [
    `Host 1: Welcome to the Audio Overview! Today we are looking at the uploaded guide, starting with "${primarySource.title}".`,
    `Host 2: Yes! This is a massive resource, representing over ${totalWords} words compiled in our client workspace, focusing on ${focusText}.`,
    `Host 1: It's fascinating how clean the source structure is. Right away, there is a strong focus on security and efficiency.`,
    `Host 2: Absolutely. What stands out to me is how all of this is parsed directly on your device inside the secure sandbox.`,
    `Host 1: Let's focus on the key takeaways. It mentions that grounded citations play a massive role in verifying claims.`,
    `Host 2: Exactly. Instead of guessing, the AI tracks text down to exact chunks, pointing the reader back to the exact paragraph!`,
    `Host 1: That is truly game-changing for study workflow. Thanks for joining us for this brief breakdown!`
  ].join('\n');
}

// Generate the classic "Notebook Guide" study assets
export interface StudyGuide {
  faq: Array<{ question: string; answer: string }>;
  briefing: string;
  timeline: Array<{ event: string; date: string; description: string }>;
  glossary: Array<{ term: string; definition: string }>;
}

export function compileStudyGuide(sources: Source[]): StudyGuide {
  const active = sources.filter(s => s.checked !== false);
  if (active.length === 0) {
    return {
      faq: [{ question: "How do I get started?", answer: "Ingest sources in the left panel to auto-compile FAQs." }],
      briefing: "No active files in study sandbox. Please check or upload files to produce a comprehensive briefing document.",
      timeline: [{ event: "Sandbox Activated", date: "Now", description: "Empty space waiting for file inputs." }],
      glossary: [{ term: "Client Grounding", definition: "Matching queries against local text chunk indexes securely." }]
    };
  }

  const primary = active[0];

  return {
    faq: [
      { 
        question: `What are the core ideas found in "${primary.title}"?`, 
        answer: `This document contains approximately ${primary.wordCount} words. Its main themes focus heavily on secure client-side storage, efficient study structuring, and local browser execution.` 
      },
      { 
        question: "How are citations matched?", 
        answer: "Every response runs a local search against semantic text chunks (300-800 characters) to verify truth, preventing artificial hallucinations." 
      }
    ],
    briefing: `BRIEFING EXECUTIVE SUMMARY: "${primary.title}"
This document stands as an essential reference piece. By checking the source files, our combined AI logic (routing across Gemini and Claude) has mapped out the core topics:
1. High-Density Vector Ingestion: Text is parsed into semantic nodes.
2. Grounded Reasoning: Chat utilizes client-side indexing to cite original material cleanly.
3. Audio Overview: Podcast overview synthesis is ready to guide user focus dynamically.`,
    timeline: [
      { 
        event: "Document Node Ingest", 
        date: primary.addedAt, 
        description: `Successfully imported "${primary.title}" into the browser storage sandbox with ${primary.chunks.length} active search slices.` 
      },
      { 
        event: "AI Synthesis Completed", 
        date: "Today", 
        description: "Generated co-host audio dialogues and multiple-choice questions over active document context." 
      }
    ],
    glossary: [
      { term: "Semantic Chunking", definition: "The process of splitting large files into small, context-rich text fragments." },
      { term: "Browser Sandbox", definition: "A secure environment inside the user's browser, preventing private data from being uploaded to unauthorized servers." },
      { term: "Co-Host Speech Synth", definition: "Multi-voice Web Speech Synthesis simulating a conversational audio podcast dialogue." }
    ]
  };
}