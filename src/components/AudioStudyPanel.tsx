"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Headphones, Play, Pause, RotateCcw, Volume2, HelpCircle, 
  Map, FileText, Calendar, Compass, ChevronLeft, ChevronRight, Edit3, Check, CheckSquare, 
  Settings2, Sliders, BookOpen, Clock, Activity, MessageSquare, ListFilter, Copy, Star, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';
import { QuizQuestion, Slide, generateCoHostPodcastScript, compileStudyGuide, Source } from '@/utils/db';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface AudioStudyPanelProps {
  onGenerateAudio: () => void;
  isGeneratingAudio: boolean;
  hasAudio: boolean;
  flashcards: Flashcard[];
  quizzes: any[];
  slides: Slide[];
  sources: Source[];
  onGenerateFlashcards: () => void;
  isGeneratingFlashcards: boolean;
  onUpdateSlides: (newSlides: Slide[]) => void;
}

export default function AudioStudyPanel({
  onGenerateAudio,
  isGeneratingAudio,
  hasAudio,
  flashcards,
  quizzes,
  slides,
  sources,
  onGenerateFlashcards,
  isGeneratingFlashcards,
  onUpdateSlides
}: AudioStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<'podcast' | 'briefing' | 'faq' | 'timeline' | 'glossary' | 'flashcards' | 'quiz' | 'slides'>('podcast');
  
  // Audio state
  const [podcastInstructions, setPodcastInstructions] = useState("");
  const [appliedInstructions, setAppliedInstructions] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.05);

  // Premium NotebookLM Voice Selector configurations
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedHost1Voice, setSelectedHost1Voice] = useState<string>("");
  const [selectedHost2Voice, setSelectedHost2Voice] = useState<string>("");

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if we have active grounded source documents
  const hasActiveSources = sources.length > 0 && sources.some(s => s.checked !== false);

  const scriptText = React.useMemo(() => {
    return generateCoHostPodcastScript(sources, appliedInstructions);
  }, [sources, appliedInstructions]);

  const scriptLines = React.useMemo(() => {
    return scriptText
      .split('\n')
      .filter(line => line.startsWith('Host 1:') || line.startsWith('Host 2:'));
  }, [scriptText]);

  // Load study guide compilations
  const studyGuide = React.useMemo(() => {
    return compileStudyGuide(sources);
  }, [sources]);

  // Populate Web Speech synthesis premium voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Find premium high-quality natural voice nodes for Host 1 (US Male-leaning)
        const host1 = voices.find(v => 
          v.name.includes("Natural") && v.lang.startsWith("en-US") ||
          v.name.includes("Google US English") ||
          v.name.includes("David") ||
          v.lang.startsWith("en-US")
        );
        if (host1) setSelectedHost1Voice(host1.name);

        // Find premium high-quality natural voice nodes for Host 2 (UK or Warm Female-leaning)
        const host2 = voices.find(v => 
          v.name.includes("Natural") && v.lang.startsWith("en-GB") ||
          v.name.includes("Google UK English Female") ||
          v.name.includes("Samantha") ||
          v.name.includes("Zira") ||
          v.lang.startsWith("en-GB")
        );
        if (host2) setSelectedHost2Voice(host2.name);
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSpeakPodcast = () => {
    if (!synthRef.current) {
      showError("Local Speech Synthesis is not supported in this browser.");
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      showSuccess("Speech paused!");
      return;
    }

    setIsPlaying(true);
    speakLine(currentLineIndex);
  };

  const speakLine = (index: number) => {
    if (!synthRef.current || index >= scriptLines.length) {
      setIsPlaying(false);
      setCurrentLineIndex(0);
      setPodcastProgress(100);
      showSuccess("Co-Hosts finished briefing successfully!");
      return;
    }

    setCurrentLineIndex(index);
    setPodcastProgress(Math.floor((index / scriptLines.length) * 100));

    const line = scriptLines[index];
    const isHost1 = line.startsWith('Host 1:');
    const cleanedText = line.replace(/^Host [12]:\s*/i, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Apply premium selected voices
    const h1VoiceObj = availableVoices.find(v => v.name === selectedHost1Voice);
    const h2VoiceObj = availableVoices.find(v => v.name === selectedHost2Voice);

    if (isHost1) {
      if (h1VoiceObj) utterance.voice = h1VoiceObj;
      utterance.pitch = 0.95; // Premium male pitch simulation
      utterance.rate = playbackRate;
    } else {
      if (h2VoiceObj) utterance.voice = h2VoiceObj;
      utterance.pitch = 1.12; // Premium female pitch simulation
      utterance.rate = playbackRate * 0.95; // Slightly slower pacing for natural interaction
    }

    utterance.onend = () => {
      speakLine(index + 1);
    };

    synthRef.current.speak(utterance);
  };

  const handleResetPodcast = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setPodcastProgress(0);
    showSuccess("Audio overview timeline reset.");
  };

  const applyPodcastInstructions = () => {
    setAppliedInstructions(podcastInstructions);
    handleResetPodcast();
    showSuccess("Re-synthesized dialogue co-hosts using custom focus instructions!");
  };

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStats, setCardStats] = useState({ mastered: 0, reviewing: 0 });

  const activeCard = flashcards[currentCardIndex] || {
    question: "No flashcards compiled.",
    answer: "Please upload and select at least one active source document to compile flashcards!"
  };

  const handleFlashScore = (type: 'mastered' | 'reviewing') => {
    setCardStats(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setIsFlipped(false);
    if (currentCardIndex + 1 < flashcards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      showSuccess("Flashcard deck fully reviewed!");
      setCurrentCardIndex(0);
    }
  };

  // Quiz state
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const activeQuiz = quizzes[activeQuizIndex] || {
    question: "Upload sources to unlock live test quiz evaluation.",
    options: [{ id: 'a', text: "Waiting..." }],
    correct: 'a'
  };

  const handleQuizSubmit = () => {
    if (!selectedAnswer) return;
    setQuizSubmitted(true);
    if (selectedAnswer === activeQuiz.correct) {
      setScore(prev => prev + 1);
      showSuccess("Correct study validation!");
    } else {
      showError("Incorrect. Review your grounded citations.");
    }
  };

  const handleNextQuiz = () => {
    setQuizSubmitted(false);
    setSelectedAnswer(null);
    if (activeQuizIndex + 1 < quizzes.length) {
      setActiveQuizIndex(activeQuizIndex + 1);
    } else {
      showSuccess("Study evaluation quiz finished!");
      setActiveQuizIndex(0);
    }
  };

  // Slides state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [pencilFeedback, setPencilFeedback] = useState("");

  const activeSlide = slides[currentSlideIndex] || {
    title: "Empty Workspace",
    text: "Please add documents to compile slides."
  };

  const handleApplySlideFeedback = () => {
    if (!pencilFeedback.trim()) return;
    const updated = [...slides];
    if (updated[currentSlideIndex]) {
      updated[currentSlideIndex].text = pencilFeedback;
      onUpdateSlides(updated);
      setPencilFeedback("");
      showSuccess("Rewritten slide context successfully!");
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  return (
    <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#161616] border-l border-slate-200/80 flex flex-col text-left overflow-hidden">
      
      {/* Studio Premium Header Navigation Bar */}
      <div className="p-4 border-b border-slate-200 bg-white dark:bg-slate-900 shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
          <h2 className="font-extrabold text-[11px] tracking-wider uppercase text-slate-800 dark:text-slate-100">
            Notebook Study Guide Studio
          </h2>
        </div>

        {/* Scrollable Ribbon listing EVERY SINGLE STUDIO TOOL */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          <button
            onClick={() => hasActiveSources && setActiveTab('podcast')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'podcast' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎧 Co-Hosts Overview
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('briefing')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'briefing' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📄 Briefing Document
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('faq')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'faq' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 FAQ Sheet
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('timeline')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'timeline' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⏳ Timeline Tool
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('glossary')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'glossary' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📖 Glossary terms
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('flashcards')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'flashcards' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ✨ Study Cards ({flashcards.length})
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('quiz')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'quiz' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎯 Matrix Quiz
          </button>
          <button
            onClick={() => hasActiveSources && setActiveTab('slides')}
            disabled={!hasActiveSources}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shrink-0 transition-all ${
              !hasActiveSources 
                ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-60'
                : activeTab === 'slides' ? 'bg-[#006a6a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📺 Canvas Slides
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        
        {!hasActiveSources ? (
          /* PREVENTATIVE LOCK SCREEN WHEN NO SOURCES ARE UPLOADED */
          <div className="py-24 px-6 text-center flex flex-col items-center justify-center space-y-5">
            <div className="p-4 rounded-full bg-teal-50 dark:bg-slate-900 text-teal-600 animate-pulse border border-teal-100">
              <Lock className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Studio Tools Locked</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto font-semibold">
                Please upload PDFs, webpage links, or custom text notes in the left column and make sure they are checked active to unlock the Study Guide Studio.
              </p>
            </div>
            
            <div className="pt-4 border-t w-full max-w-[200px] text-center">
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block mb-1">UNLOCKED ASSETS</span>
              <div className="flex justify-center gap-1.5 text-[10px] text-slate-600 font-bold">
                <span>0 Briefings</span> • <span>0 Flashcards</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TOOL 1: AUDIO PODCAST CO-HOST OVERVIEW (with premium voices & speeds) */}
            {activeTab === 'podcast' && (
              <div className="space-y-4">
                <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl relative overflow-hidden">
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-teal-500 text-slate-900 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase">
                        NotebookLM Audio Engine
                      </Badge>
                      <div className="flex items-center gap-1.5 text-teal-400 font-mono text-[9px]">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>PREMIUM DUAL-HOSTS</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                        <Headphones className="w-4.5 h-4.5 text-teal-400" />
                        Deep-Dive Overview Dialogue
                      </h3>
                      <p className="text-slate-400 text-[10px] leading-relaxed mt-1">
                        Alternating Host 1 (Lead Specialist) and Host 2 (Interviewer) utilizing your browser's premium high-fidelity voices.
                      </p>
                    </div>

                    {/* Animated waves visualizer */}
                    <div className="h-11 flex items-end justify-center gap-1 bg-slate-950/40 rounded-2xl px-3 py-1.5">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 rounded-full bg-teal-400 transition-all duration-150"
                          style={{
                            height: isPlaying ? `${Math.floor(Math.random() * 28) + 4}px` : '4px'
                          }}
                        />
                      ))}
                    </div>

                    {/* Speed rate configuration slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Host Playback Cadence Speed</span>
                        <span>{playbackRate}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.5"
                        step="0.05"
                        value={playbackRate}
                        onChange={(e) => {
                          setPlaybackRate(parseFloat(e.target.value));
                          if (isPlaying) {
                            synthRef.current?.cancel();
                            speakLine(currentLineIndex);
                          }
                        }}
                        className="w-full accent-teal-400 bg-slate-800 rounded-lg h-1"
                      />
                    </div>

                    {/* Dynamic Speech Selectors */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 block">Host 1 Premium Voice</label>
                        <select
                          value={selectedHost1Voice}
                          onChange={(e) => setSelectedHost1Voice(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-800 text-[9px] rounded-lg p-1.5 text-slate-200"
                        >
                          {availableVoices.map(v => (
                            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 block">Host 2 Premium Voice</label>
                        <select
                          value={selectedHost2Voice}
                          onChange={(e) => setSelectedHost2Voice(e.target.value)}
                          className="w-full bg-slate-850 border border-slate-800 text-[9px] rounded-lg p-1.5 text-slate-200"
                        >
                          {availableVoices.map(v => (
                            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Progress value={podcastProgress} className="h-1.5 bg-slate-800 accent-teal-400" />

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Line {currentLineIndex + 1} of {scriptLines.length}</span>
                      <span>{podcastProgress}%</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleResetPodcast}
                        className="text-white hover:bg-white/10 rounded-full h-9 w-9"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={handleSpeakPodcast}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-full text-xs shadow-md flex items-center gap-1.5"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? "Pause Overview" : "Play Overview"}
                      </Button>

                      <Badge className="bg-teal-950 text-teal-400 border border-teal-800 font-extrabold text-[8px]">
                        ACTIVE SYNTH
                      </Badge>
                    </div>

                  </div>
                </Card>

                {/* Custom Focus Directions Widget */}
                <Card className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-teal-600" />
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Customize Co-Host Pacing</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Direct the discussion focus dynamically. Try: <span className="font-bold">"explain it like I am 5"</span>, <span className="font-bold">"deeply technical breakdown"</span>, or <span className="font-bold">"lighthearted jokes"</span>.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={podcastInstructions}
                      onChange={(e) => setPodcastInstructions(e.target.value)}
                      placeholder="Focus target guidelines..."
                      className="h-9 text-xs rounded-xl focus-visible:ring-teal-600 border-slate-200"
                    />
                    <Button 
                      onClick={applyPodcastInstructions}
                      className="bg-[#006a6a] hover:bg-[#005252] text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </Card>

                {/* Live Conversation Transcript */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                    Dialogue Timeline Transcript
                  </span>
                  
                  {scriptLines.map((line, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        idx === currentLineIndex && isPlaying
                          ? 'border-teal-500 bg-teal-50/25 shadow-sm scale-[1.01]'
                          : 'border-slate-200/60 bg-white'
                      }`}
                    >
                      <span className="text-[9px] font-extrabold text-teal-700 block mb-0.5">
                        {line.startsWith('Host 1:') ? "Host 1 (Lead Specialist)" : "Host 2 (Interviewer)"}
                      </span>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                        {line.replace(/^Host [12]:\s*/i, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL 2: BRIEFING DOCUMENT GENERATOR */}
            {activeTab === 'briefing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <FileText className="w-4.5 h-4.5 text-teal-600" />
                    Briefing Document Tool
                  </div>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    className="h-7 text-[10px] rounded-lg"
                    onClick={() => handleCopyToClipboard(studyGuide.briefing)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Memo
                  </Button>
                </div>

                <Card className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-4 shadow-sm text-left">
                  <div className="border-b pb-3 space-y-1">
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">EXECUTIVE SUMMATION REPORT</span>
                    <h3 className="font-extrabold text-slate-800 text-sm">Grounded Key Takeaways</h3>
                  </div>
                  
                  <div className="text-[11.5px] text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap font-medium">
                    {studyGuide.briefing}
                  </div>

                  <div className="pt-3 border-t flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Core Study Guidelines</span>
                    <div className="flex flex-col gap-1.5 text-[10px] text-slate-600 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        Cross-verify every metric back to grounded citations.
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        Utilize multiple model reasoning consensus logs safely.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TOOL 3: FAQ SHEETS MODULE */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                  <HelpCircle className="w-4.5 h-4.5 text-teal-600" />
                  Dynamic FAQ Sheet Tool
                </div>

                <div className="space-y-3">
                  {studyGuide.faq.map((item, idx) => (
                    <Card key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-teal-50 text-teal-700 border-none shrink-0 font-bold text-[9px] mt-0.5">Q #{idx + 1}</Badge>
                        <h4 className="font-extrabold text-[11.5px] text-slate-800 leading-snug">{item.question}</h4>
                      </div>
                      <div className="pl-8 text-[11px] text-slate-600 leading-relaxed font-semibold border-l-2 border-teal-100">
                        {item.answer}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL 4: MILESTONE TIMELINE TOOL */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                  <Clock className="w-4.5 h-4.5 text-teal-600" />
                  Chronological Timeline Tool
                </div>

                <div className="relative border-l border-teal-200 pl-4 ml-2.5 space-y-6 pt-2">
                  {studyGuide.timeline.map((item, idx) => (
                    <div key={idx} className="relative space-y-1.5 text-left">
                      {/* Milestones Node Indicator Dot */}
                      <div className="absolute -left-[21.5px] top-1.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white animate-pulse" />
                      
                      <div className="flex items-center justify-between">
                        <Badge className="bg-teal-50 text-teal-700 font-bold text-[9px] px-2.5 py-0.5 rounded-full border-none">
                          {item.date}
                        </Badge>
                      </div>

                      <strong className="block text-xs font-extrabold text-slate-800">{item.event}</strong>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL 5: TERMINOLOGY GLOSSARY */}
            {activeTab === 'glossary' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                  <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                  Terminology Glossary Tool
                </div>

                <div className="space-y-2">
                  {studyGuide.glossary.map((g, idx) => (
                    <Card key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between gap-2.5 shadow-sm text-left">
                      <div className="sm:w-[30%] shrink-0">
                        <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50/60 px-2 py-0.5 rounded-lg">
                          {g.term}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold sm:w-[70%]">
                        {g.definition}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL 6: 3D STUDY CARDS FLASHCARD GRADER */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <Star className="w-4.5 h-4.5 text-teal-600" />
                    Dynamic Flashcard Tool
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none">Mastered: {cardStats.mastered}</Badge>
                    <Badge className="bg-rose-50 text-rose-700 border-none">Review: {cardStats.reviewing}</Badge>
                  </div>
                </div>

                {flashcards.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                    Incorporate study documents to compile custom study cards automatically.
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="relative w-full h-56 cursor-pointer [perspective:1000px]"
                    >
                      <div 
                        className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${
                          isFlipped ? '[transform:rotateY(180deg)]' : ''
                        }`}
                      >
                        {/* Front card styling */}
                        <Card className="absolute inset-0 w-full h-full p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm [backface-visibility:hidden]">
                          <div className="space-y-2">
                            <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Flash Evaluator Card #{currentCardIndex + 1}</span>
                            <p className="text-slate-800 font-extrabold text-xs leading-relaxed">
                              {activeCard.question}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 self-end">Click card to flip answer context</span>
                        </Card>

                        {/* Back card styling */}
                        <Card className="absolute inset-0 w-full h-full p-5 bg-teal-600 text-white rounded-3xl flex flex-col justify-between shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                          <div className="space-y-2">
                            <span className="text-[9px] font-extrabold tracking-wider text-teal-200 uppercase">Grounded Verification</span>
                            <p className="text-white font-semibold text-xs leading-relaxed">
                              {activeCard.answer}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-teal-200 self-end">Click card to reset to question</span>
                        </Card>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleFlashScore('reviewing')}
                        variant="outline"
                        className="border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs h-10 font-bold"
                      >
                        Flag Review
                      </Button>
                      <Button
                        onClick={() => handleFlashScore('mastered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-10 font-bold"
                      >
                        Correct Mastered
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TOOL 7: INTERACTIVE ASSESSMENT MATRIX QUIZZES */}
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase">Self-Evaluation Quiz Tool</span>
                  <Badge className="bg-teal-50 text-teal-700 text-[10px]">Consolidated Score: {score}</Badge>
                </div>

                {quizzes.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                    Incorporate custom documents to compile assessment questions automatically.
                  </div>
                ) : (
                  <Card className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-xs text-slate-800 leading-relaxed">
                      {activeQuiz.question}
                    </h4>

                    <RadioGroup 
                      value={selectedAnswer || ""} 
                      onValueChange={(val) => !quizSubmitted && setSelectedAnswer(val)}
                      className="space-y-2"
                    >
                      {activeQuiz.options.map((opt: any) => {
                        let style = "border-slate-200";
                        if (quizSubmitted) {
                          if (opt.id === activeQuiz.correct) {
                            style = "border-emerald-500 bg-emerald-50 text-emerald-800";
                          } else if (opt.id === selectedAnswer) {
                            style = "border-rose-500 bg-rose-50 text-rose-800";
                          }
                        } else if (selectedAnswer === opt.id) {
                          style = "border-teal-500 bg-teal-50/20";
                        }

                        return (
                          <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${style}`}>
                            <RadioGroupItem value={opt.id} id={opt.id} className="text-teal-600" />
                            <Label htmlFor={opt.id} className="text-[11px] font-extrabold text-slate-700 cursor-pointer flex-1">
                              {opt.text}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>

                    {!quizSubmitted ? (
                      <Button 
                        onClick={handleQuizSubmit}
                        disabled={!selectedAnswer}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs h-10"
                      >
                        Assess Response
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNextQuiz}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs h-10"
                      >
                        Next Question
                      </Button>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* TOOL 8: CANVAS PRESENTATION SLIDES WITH EDIT DIALOG */}
            {activeTab === 'slides' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-700 block uppercase">Presentation Slides Tool</span>

                <Card className="p-6 bg-white border border-slate-200 rounded-3xl min-h-[170px] flex flex-col justify-between shadow-sm text-left">
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-teal-600 uppercase">Slide Deck {currentSlideIndex + 1} of {slides.length}</span>
                    <h3 className="font-extrabold text-xs text-slate-800">{activeSlide.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{activeSlide.text}</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t mt-4">
                    <Button 
                      disabled={currentSlideIndex === 0} 
                      onClick={() => setCurrentSlideIndex(prev => prev - 1)} 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-slate-500 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-[10px] font-bold text-slate-400">Canvas Navigation</span>

                    <Button 
                      disabled={currentSlideIndex + 1 >= slides.length} 
                      onClick={() => setCurrentSlideIndex(prev => prev + 1)} 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-slate-500 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-700 block">
                    Pencil UI Slide Editor
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={pencilFeedback}
                      onChange={(e) => setPencilFeedback(e.target.value)}
                      placeholder="Recommend slide rewrite edits..."
                      className="text-xs h-9 rounded-lg border-slate-200 focus-visible:ring-teal-500"
                    />
                    <Button 
                      onClick={handleApplySlideFeedback}
                      size="sm" 
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 px-3 font-bold text-xs"
                    >
                      Apply Rewrite
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </ScrollArea>

    </div>
  );
}