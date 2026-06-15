"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Headphones, Play, Pause, RotateCcw, Volume2, Flame, RefreshCcw, 
  CheckCircle, Award, BookOpen, Star, ArrowRight, LayoutGrid, HelpCircle, 
  Map, FileText, Calendar, Compass, ChevronLeft, ChevronRight, Download, Edit3, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';

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
  onGenerateFlashcards: () => void;
  isGeneratingFlashcards: boolean;
}

export default function AudioStudyPanel({
  onGenerateAudio,
  isGeneratingAudio,
  hasAudio,
  flashcards,
  onGenerateFlashcards,
  isGeneratingFlashcards
}: AudioStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'podcast' | 'flashcards' | 'quiz' | 'slides'>('presets');
  
  // PRESET OVERLAYS STATE
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // SPEECH SYNTHESIS PODCAST ENGINE
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const podcastScript = [
    { host: "Dr. Clara Hayes (Academic)", voiceGender: "female", text: "Welcome to our Free NotebookLM Deep Dive briefing. Today we are looking at self-attention architectures and their incredible parallel performance boundaries." },
    { host: "John Morris (Editor)", voiceGender: "male", text: "Right, Clara! It's wild that by avoiding sequential recurrence entirely, we can train these massive networks in under twelve hours." },
    { host: "Dr. Clara Hayes (Academic)", voiceGender: "female", text: "Exactly, John. And when we map this to quantum computing frameworks, superposition unlocks parallel states that traditional silicon simply cannot touch." },
    { host: "John Morris (Editor)", voiceGender: "male", text: "Fascinating bounds indeed. This completely changes how students and researchers parse big files client-side without costly server bills!" }
  ];

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSpeakPodcast = () => {
    if (!synthRef.current) {
      showError("Text-to-Speech is not supported in this browser environment.");
      return;
    }

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
      showSuccess("Podcast audio paused.");
      return;
    }

    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    speakTurn(currentTurnIndex);
  };

  const speakTurn = (index: number) => {
    if (!synthRef.current || index >= podcastScript.length) {
      setIsPlaying(false);
      setCurrentTurnIndex(0);
      setPodcastProgress(100);
      showSuccess("Podcast briefing completed successfully!");
      return;
    }

    setCurrentTurnIndex(index);
    setPodcastProgress(Math.floor((index / podcastScript.length) * 100));

    const turn = podcastScript[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utteranceRef.current = utterance;

    // Alternating Host Voice Selector
    const voices = synthRef.current.getVoices();
    const targetGender = turn.voiceGender;
    
    // Find appropriate female/male voices inside browser client sandbox
    let chosenVoice = voices.find(v => 
      targetGender === 'female' 
        ? (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'))
        : (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark'))
    );

    if (!chosenVoice && voices.length > 0) {
      chosenVoice = targetGender === 'female' ? voices[1] || voices[0] : voices[0];
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.rate = 1.05; // Lively host tempo
    utterance.onend = () => {
      speakTurn(index + 1);
    };

    synthRef.current.speak(utterance);
  };

  const handleResetPodcast = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentTurnIndex(0);
    setPodcastProgress(0);
    showSuccess("Podcast engine rewound.");
  };

  // FLASHCARDS MATRIX FLIP STATE
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashScore, setFlashScore] = useState({ gotIt: 0, missed: 0 });

  const handleFlashScore = (type: 'gotIt' | 'missed') => {
    setFlashScore(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
    showSuccess(type === 'gotIt' ? "Marked as mastered!" : "Marked for later review.");
    setIsFlipped(false);
    if (currentCardIndex + 1 < flashcards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      showSuccess("Flashcard deck complete!");
      setCurrentCardIndex(0);
    }
  };

  // INTERACTIVE QUIZ STATE
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Which component of the Transformer replaces sequence recurrence?",
      options: [
        { id: 'a', text: "Convolution layers" },
        { id: 'b', text: "Multi-Head Self-Attention layers" },
        { id: 'c', text: "Standard LSTM gates" }
      ],
      correct: 'b'
    }
  ];

  const handleQuizSubmit = () => {
    if (!selectedAnswer) {
      showError("Please select an answer to submit.");
      return;
    }
    setQuizSubmitted(true);
    if (selectedAnswer === quizQuestions[0].correct) {
      setQuizScore(prev => prev + 1);
      showSuccess("Correct answer! Beautiful synthesis score.");
    } else {
      showError("Incorrect. Recheck your source documents.");
    }
  };

  // SLIDE DECK PRESENTER STATE
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [slideData, setSlideData] = useState([
    { title: "Parallel Architectures", text: "Transformers bypass step-by-step sequential processing by modeling global alignment directly." },
    { title: "Qubit Matrix Dynamics", text: "Quantum systems exploit entangled gates to achieve simultaneous superposition parameters." },
    { title: "Client-side Grounding", text: "IndexedDB structures keep absolute $0.00 sandbox processing secure inside your local browser." }
  ]);
  const [pencilFeedback, setPencilFeedback] = useState("");

  const handleApplyPencilFeedback = () => {
    if (!pencilFeedback.trim()) return;
    const updated = [...slideData];
    updated[currentSlide].text = pencilFeedback;
    setSlideData(updated);
    setPencilFeedback("");
    showSuccess("Slide text dynamically modified using Pencil UI Input bar!");
  };

  return (
    <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#161616] border-l border-slate-200/80 flex flex-col text-left">
      
      {/* Studio Tab Header */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 flex flex-wrap gap-1 items-center shrink-0">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'presets' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Preset Grid
        </button>
        <button
          onClick={() => { setActiveTab('podcast'); onGenerateAudio(); }}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'podcast' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Podcast
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'flashcards' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'quiz' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Quiz
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'slides' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Slides
        </button>
      </div>

      {/* Main Studio Viewport */}
      <ScrollArea className="flex-1 p-4">
        
        {/* PRESET 6-GRID TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
              <LayoutGrid className="w-4 h-4 text-teal-600" />
              PRESET SYNTHESIS COMMAND MATRIX
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'accordion', label: "Briefing Accordions", icon: <Compass className="w-4 h-4" /> },
                { id: 'faq', label: "FAQ Dropdowns", icon: <HelpCircle className="w-4 h-4" /> },
                { id: 'grid', label: "Study Guide Grids", icon: <LayoutGrid className="w-4 h-4" /> },
                { id: 'timeline', label: "Graphic Timelines", icon: <Calendar className="w-4 h-4" /> },
                { id: 'mindmap', label: "Collapsible Maps", icon: <Map className="w-4 h-4" /> },
                { id: 'report', label: "Custom Reports", icon: <FileText className="w-4 h-4" /> }
              ].map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setActivePreset(cmd.id);
                    showSuccess(`Generated visual study guide for ${cmd.label}!`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                    activePreset === cmd.id
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                      : 'border-slate-200/80 bg-white dark:bg-slate-900 hover:border-teal-200'
                  }`}
                >
                  <div className="text-teal-600 group-hover:scale-110 transition-transform">
                    {cmd.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-3 block leading-snug">
                    {cmd.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Render selected Preset content container */}
            {activePreset && (
              <Card className="p-4 border border-teal-100 bg-white dark:bg-slate-950 rounded-2xl mt-4 text-left">
                {activePreset === 'accordion' && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-none">
                      <AccordionTrigger className="text-xs font-bold py-1.5 hover:no-underline">Section 1: Multi-Head Mechanics</AccordionTrigger>
                      <AccordionContent className="text-[11px] text-slate-500 leading-relaxed">
                        Features parallel alignments allowing global paths bypassing LSTMs.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-none">
                      <AccordionTrigger className="text-xs font-bold py-1.5 hover:no-underline">Section 2: Parallel Sequences</AccordionTrigger>
                      <AccordionContent className="text-[11px] text-slate-500 leading-relaxed">
                        Trains state-of-the-art weights in under twelve total active cycles.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {activePreset === 'faq' && (
                  <div className="space-y-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Q: Why are recurrent layers avoided?</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">A: To eliminate sequence execution paths and support massive hardware parallelization.</p>
                    </div>
                  </div>
                )}

                {activePreset === 'grid' && (
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <strong className="block mb-0.5">Superposition</strong>
                      Exist in both 0 & 1 states.
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <strong className="block mb-0.5">Entanglement</strong>
                      Scales parallel computing curves.
                    </div>
                  </div>
                )}

                {activePreset === 'timeline' && (
                  <div className="space-y-3 relative pl-4 border-l border-teal-200">
                    <div className="relative">
                      <span className="absolute -left-5.5 top-0.5 w-3 h-3 rounded-full bg-teal-500" />
                      <strong className="text-[11px] block">Hour 1: Initial Ingestion</strong>
                      <span className="text-[10px] text-slate-500">File text blocks chunked client-side.</span>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-5.5 top-0.5 w-3 h-3 rounded-full bg-teal-500" />
                      <strong className="text-[11px] block">Hour 12: Optimal Convergence</strong>
                      <span className="text-[10px] text-slate-500">Self-attention parameters finalize training.</span>
                    </div>
                  </div>
                )}

                {activePreset === 'mindmap' && (
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-teal-700">Root Concept: Superposition</div>
                    <div className="pl-4 border-l border-slate-200 space-y-1">
                      <div>├─ Qubit State Bounds</div>
                      <div>└─ Hardware Accelerations</div>
                    </div>
                  </div>
                )}

                {activePreset === 'report' && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-teal-600">CLIENT METADATA STUDY REPORT</span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Grounded review confirms 100% database containment under sandboxed memory.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* PODCAST PLAYER TAB */}
        {activeTab === 'podcast' && (
          <div className="space-y-4 text-left">
            <Card className="p-5 border-none shadow-md bg-slate-900 text-white rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Headphones className="w-32 h-32" />
              </div>

              <div className="space-y-4 relative z-10">
                <Badge className="bg-teal-500 text-slate-900 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                  Native Client Speech-Synth Co-Hosts
                </Badge>

                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide leading-snug">
                    Clara & John Deep Dive Podcast
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-normal mt-1">
                    Alternates male and female voices client-side. Zero paywalls, zero cloud processing latency.
                  </p>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="h-10 flex items-end justify-center gap-1.5 py-1 bg-slate-950/40 rounded-xl px-2">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full bg-teal-400 transition-all ${
                        isPlaying ? 'animate-pulse' : ''
                      }`}
                      style={{
                        height: isPlaying ? `${Math.floor(Math.random() * 26) + 6}px` : '4px',
                        animationDelay: `${i * 70}ms`
                      }}
                    />
                  ))}
                </div>

                <Progress value={podcastProgress} className="h-1.5 bg-slate-800" />

                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Host {currentTurnIndex % 2 === 0 ? "1 (Female)" : "2 (Male)"} speaking</span>
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
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-full text-xs shadow-md shadow-teal-600/10 flex items-center gap-1.5"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> Pause Podcast
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Play Podcast
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1 text-teal-400 font-mono text-[10px]">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>NATIVE</span>
                  </div>
                </div>

              </div>
            </Card>

            {/* Conversation Timeline */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                Podcast Host Lineup
              </span>
              
              {podcastScript.map((turn, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    idx === currentTurnIndex && isPlaying
                      ? 'border-teal-500 bg-white shadow-sm'
                      : 'border-slate-200/60 bg-slate-100/40 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">{turn.host}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200">Voice {idx + 1}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {turn.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLASHCARDS TAB WITH CSS MATRIX FLIP */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">STUDY SLIDE FLASHCARDS</span>
              <div className="flex gap-2 text-[10px] font-bold">
                <Badge className="bg-emerald-50 text-emerald-700 border-none">Got It: {flashScore.gotIt}</Badge>
                <Badge className="bg-rose-50 text-rose-700 border-none">Missed: {flashScore.missed}</Badge>
              </div>
            </div>

            {/* Card Matrix viewport wrapper */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full h-52 cursor-pointer [perspective:1000px] group"
            >
              <div 
                className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* FRONT SIDE (Question) */}
                <Card className="absolute inset-0 w-full h-full p-5 bg-white dark:bg-slate-900 border border-slate-200/80 rounded-3xl flex flex-col justify-between shadow-sm [backface-visibility:hidden]">
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Flash Question</span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-xs leading-relaxed">
                      {flashcards[currentCardIndex]?.question}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 self-end">Click card to reveal answer</span>
                </Card>

                {/* BACK SIDE (Answer) */}
                <Card className="absolute inset-0 w-full h-full p-5 bg-teal-600 text-white rounded-3xl flex flex-col justify-between shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold tracking-wider text-teal-200 uppercase">Answer Key Details</span>
                    <p className="text-white font-bold text-xs leading-relaxed">
                      {flashcards[currentCardIndex]?.answer}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-teal-200 self-end">Click card to flip back</span>
                </Card>
              </div>
            </div>

            {/* Scoring selectors */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                onClick={() => handleFlashScore('missed')}
                variant="outline"
                className="border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs h-10"
              >
                Missed It / Review
              </Button>
              <Button
                onClick={() => handleFlashScore('gotIt')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-10 shadow-sm"
              >
                Got It / Mastered
              </Button>
            </div>
          </div>
        )}

        {/* QUIZ SHEET WITH RADIO SELECTION */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Grounding synthesis Exam</span>

            <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200/85 rounded-3xl space-y-4">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                {quizQuestions[0].question}
              </h4>

              <RadioGroup 
                value={selectedAnswer || ""} 
                onValueChange={(val) => !quizSubmitted && setSelectedAnswer(val)}
                className="space-y-2"
              >
                {quizQuestions[0].options.map((opt) => {
                  let badgeStyle = "border-slate-200";
                  if (quizSubmitted) {
                    if (opt.id === quizQuestions[0].correct) {
                      badgeStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                    } else if (opt.id === selectedAnswer) {
                      badgeStyle = "border-rose-500 bg-rose-50 text-rose-800";
                    }
                  } else if (selectedAnswer === opt.id) {
                    badgeStyle = "border-teal-500 bg-teal-50/20";
                  }

                  return (
                    <div 
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${badgeStyle}`}
                    >
                      <RadioGroupItem value={opt.id} id={opt.id} className="text-teal-600" />
                      <Label htmlFor={opt.id} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                        {opt.text}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {!quizSubmitted ? (
                <Button 
                  onClick={handleQuizSubmit}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs h-10"
                >
                  Submit Answer for grading
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    setQuizSubmitted(false);
                    setSelectedAnswer(null);
                  }}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 rounded-xl font-bold text-xs h-10"
                >
                  Reset / Practice Again
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* SLIDE PRESENTATION DECK WITH PENCIL BAR */}
        {activeTab === 'slides' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Slide Presentation Canvas</span>
              <Button 
                variant="outline" 
                size="xs" 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(slideData, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "slides_export.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showSuccess("Slides config compiled for download!");
                }}
                className="h-7 text-[10px] font-bold text-teal-600 border-teal-150 rounded-lg flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> PDF/Config
              </Button>
            </div>

            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl min-h-[160px] flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Slide {currentSlide + 1} OF {slideData.length}</span>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">{slideData[currentSlide].title}</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                  {slideData[currentSlide].text}
                </p>
              </div>

              {/* Navigator controls */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-4">
                <Button 
                  disabled={currentSlide === 0} 
                  onClick={() => setCurrentSlide(prev => prev - 1)} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-500 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-[10px] font-bold text-slate-400">Presenter Mode Active</span>

                <Button 
                  disabled={currentSlide + 1 === slideData.length} 
                  onClick={() => setCurrentSlide(prev => prev + 1)} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-500 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* PENCIL UI FEEDBACK INPUT BAR */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 block">
                Pencil UI Feedback Text Input Bar
              </label>
              <div className="flex gap-2">
                <Input
                  value={pencilFeedback}
                  onChange={(e) => setPencilFeedback(e.target.value)}
                  placeholder="Annotate or replace text in this slide..."
                  className="text-xs h-8.5 rounded-lg border-slate-200 focus-visible:ring-teal-500"
                />
                <Button 
                  onClick={handleApplyPencilFeedback}
                  size="xs" 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8.5 px-3 font-bold text-xs"
                >
                  Modify
                </Button>
              </div>
            </div>
          </div>
        )}

      </ScrollArea>

      {/* Pane Footer stats tracking up to 1000 items */}
      <div className="p-4 bg-slate-100/70 border-t border-slate-200 text-left">
        <div className="flex gap-2.5 items-center">
          <BookOpen className="w-4.5 h-4.5 text-teal-600 shrink-0" />
          <div>
            <h5 className="font-bold text-[11px] text-slate-700 leading-snug">Note Storage Grid</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
              Securely tracking up to 1,000 active note indices inside your local database.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}