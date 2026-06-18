"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Headphones, Play, Pause, RotateCcw, Volume2, LayoutGrid, HelpCircle, 
  Map, FileText, Calendar, Compass, ChevronLeft, ChevronRight, Download, Edit3, Check
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
import { QuizQuestion, Slide, generateDynamicPodcastScript } from '@/utils/db';

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
  quizzes: QuizQuestion[];
  slides: Slide[];
  sources: any[];
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
  const [activeTab, setActiveTab] = useState<'presets' | 'podcast' | 'flashcards' | 'quiz' | 'slides'>('presets');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Podcast Dialogue script states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Compute dynamic podcast script
  const scriptText = React.useMemo(() => {
    return generateDynamicPodcastScript(sources);
  }, [sources]);

  const scriptLines = React.useMemo(() => {
    return scriptText
      .split('\n')
      .filter(line => line.startsWith('Host 1:') || line.startsWith('Host 2:'));
  }, [scriptText]);

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
      showError("Text-to-Speech not supported in this browser.");
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      showSuccess("Podcast audio paused.");
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
      showSuccess("Podcast briefing finished!");
      return;
    }

    setCurrentLineIndex(index);
    setPodcastProgress(Math.floor((index / scriptLines.length) * 100));

    const line = scriptLines[index];
    const isHost1 = line.startsWith('Host 1:');
    const cleanedText = line.replace(/^Host [12]:\s*/i, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    const voices = synthRef.current.getVoices();
    
    // Select distinct voice characteristics client side
    const host1Voice = voices.find(v => v.name.includes('Google US English') || v.lang.startsWith('en-US')) || voices[0];
    const host2Voice = voices.find(v => v.name.includes('Google UK English') || v.lang.startsWith('en-GB') || v.name.includes('Samantha')) || voices[1] || voices[0];

    if (isHost1) {
      if (host1Voice) utterance.voice = host1Voice;
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
    } else {
      if (host2Voice) utterance.voice = host2Voice;
      utterance.rate = 0.98;
      utterance.pitch = 1.1;
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
    showSuccess("Podcast player rewound.");
  };

  // Flashcards Flipping System
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashScore, setFlashScore] = useState({ gotIt: 0, missed: 0 });

  const activeCard = flashcards[currentCardIndex] || {
    question: "No flashcards generated.",
    answer: "Please upload and select at least one active source document to generate study flashcards!"
  };

  const handleFlashScore = (type: 'gotIt' | 'missed') => {
    setFlashScore(prev => ({ ...prev, [type]: prev[type] + 1 }));
    showSuccess(type === 'gotIt' ? "Card mastered!" : "Marked for review.");
    setIsFlipped(false);
    if (currentCardIndex + 1 < flashcards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      showSuccess("Flashcard deck fully reviewed!");
      setCurrentCardIndex(0);
    }
  };

  // Interactive Quiz System
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const activeQuiz = quizzes[activeQuizIndex] || {
    question: "Awaiting source upload...",
    options: [{ id: 'a', text: "No active quizzes." }],
    correct: 'a'
  };

  const handleQuizSubmit = () => {
    if (!selectedAnswer) {
      showError("Please pick an option first.");
      return;
    }
    setQuizSubmitted(true);
    if (selectedAnswer === activeQuiz.correct) {
      setQuizScore(prev => prev + 1);
      showSuccess("Correct synthesis!");
    } else {
      showError("Incorrect. Re-evaluate study guide.");
    }
  };

  const handleNextQuiz = () => {
    setQuizSubmitted(false);
    setSelectedAnswer(null);
    if (activeQuizIndex + 1 < quizzes.length) {
      setActiveQuizIndex(activeQuizIndex + 1);
    } else {
      showSuccess("Quiz completed successfully!");
      setActiveQuizIndex(0);
    }
  };

  // Slide Canvas
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pencilFeedback, setPencilFeedback] = useState("");

  const activeSlide = slides[currentSlide] || {
    title: "Empty Workspace",
    text: "Please add documents to populate presentation slides."
  };

  const handleApplyPencilFeedback = () => {
    if (!pencilFeedback.trim()) return;
    const updated = [...slides];
    if (updated[currentSlide]) {
      updated[currentSlide].text = pencilFeedback;
      onUpdateSlides(updated);
      setPencilFeedback("");
      showSuccess("Slide canvas edited successfully!");
    }
  };

  return (
    <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#161616] border-l border-slate-200/80 flex flex-col text-left">
      
      {/* Dynamic Tab Ribbon */}
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
          Podcast Studio
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'flashcards' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Flashcards ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'quiz' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Study Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'slides' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Slides Canvas
        </button>
      </div>

      <ScrollArea className="flex-1 p-4">
        
        {/* ACTION GRID PRESET TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
              <LayoutGrid className="w-4 h-4 text-teal-600" />
              DYNAMIC COMMAND MATRIX
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
                    showSuccess(`Loaded visual template: ${cmd.label}`);
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

            {/* Generated Preset Layout Container */}
            {activePreset && (
              <Card className="p-4 border border-teal-100 bg-white dark:bg-slate-950 rounded-2xl mt-4 text-left">
                {sources.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No sources loaded. Please ingest dynamic files in Pane 1 first.</p>
                ) : (
                  <>
                    {activePreset === 'accordion' && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-none">
                          <AccordionTrigger className="text-xs font-bold py-1.5 hover:no-underline">Section 1: Active Focus</AccordionTrigger>
                          <AccordionContent className="text-[11px] text-slate-500 leading-relaxed">
                            {slides[0]?.text || "Study variables populated from local database."}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {activePreset === 'faq' && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">Q: What is summarized in the current index?</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">A: {slides[0]?.text || "Your uploaded content chunks."}</p>
                      </div>
                    )}

                    {activePreset === 'grid' && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <strong className="block mb-0.5">Primary Target</strong>
                          {sources[0]?.title || "Awaiting upload"}
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <strong className="block mb-0.5">Length Index</strong>
                          {sources[0]?.wordCount || 0} words
                        </div>
                      </div>
                    )}

                    {activePreset === 'timeline' && (
                      <div className="space-y-3 relative pl-4 border-l border-teal-200">
                        <div className="relative">
                          <span className="absolute -left-5.5 top-0.5 w-3 h-3 rounded-full bg-teal-500" />
                          <strong className="text-[11px] block">Checkpoint 1: Initial Parsing</strong>
                          <span className="text-[10px] text-slate-500">{sources[0]?.title} integrated.</span>
                        </div>
                      </div>
                    )}

                    {activePreset === 'mindmap' && (
                      <div className="space-y-1.5 text-xs">
                        <div className="font-bold text-teal-700">{sources[0]?.title}</div>
                        <div className="pl-4 border-l border-slate-200 space-y-0.5 text-[11px]">
                          <div>├─ Core Segment Mapping</div>
                          <div>└─ Local Grounded Citations</div>
                        </div>
                      </div>
                    )}

                    {activePreset === 'report' && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-teal-600">CLIENT METRIC REPORT</span>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          Secure database indexation complete for study session of {sources[0]?.title}.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}
          </div>
        )}

        {/* DYNAMIC TWO-HOST PODCAST PLAYER */}
        {activeTab === 'podcast' && (
          <div className="space-y-4 text-left">
            <Card className="p-5 border-none shadow-md bg-slate-900 text-white rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Headphones className="w-32 h-32" />
              </div>

              <div className="space-y-4 relative z-10">
                <Badge className="bg-teal-500 text-slate-900 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                  Native Browser Co-Hosts Dialogue
                </Badge>

                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide leading-snug">
                    {sources[0]?.title || "Workspace Overview"} Podcast
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-normal mt-1">
                    Alternating Host 1 (US Voice) and Host 2 (UK/Local Voice). Uses natural filler expressions completely locally.
                  </p>
                </div>

                {/* Animated Audio Waveform bar visualization */}
                <div className="h-10 flex items-end justify-center gap-1.5 py-1 bg-slate-950/40 rounded-xl px-2">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full bg-teal-400 transition-all`}
                      style={{
                        height: isPlaying ? `${Math.floor(Math.random() * 26) + 6}px` : '4px',
                        transitionDuration: '150ms'
                      }}
                    />
                  ))}
                </div>

                <Progress value={podcastProgress} className="h-1.5 bg-slate-800" />

                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Speaking: Line {currentLineIndex + 1} of {scriptLines.length}</span>
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
                    {isPlaying ? "Pause Briefing" : "Play Briefing"}
                  </Button>

                  <div className="flex items-center gap-1 text-teal-400 font-mono text-[10px]">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>LOCAL</span>
                  </div>
                </div>

              </div>
            </Card>

            {/* Alternating Script Dialogue Timeline */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                Dialogue Timeline Transcript
              </span>
              
              {scriptLines.map((line, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    idx === currentLineIndex && isPlaying
                      ? 'border-teal-500 bg-white dark:bg-slate-900 shadow-sm'
                      : 'border-slate-200/60 bg-slate-100/40 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">
                      {line.startsWith('Host 1:') ? "Host 1 (Academic)" : "Host 2 (Interviewer)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {line.replace(/^Host [12]:\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3D MATRIX FLASHCARDS TAB */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">MATRIX FLASHCARDS</span>
              <div className="flex gap-2 text-[10px] font-bold">
                <Badge className="bg-emerald-50 text-emerald-700 border-none">Got It: {flashScore.gotIt}</Badge>
                <Badge className="bg-rose-50 text-rose-700 border-none">Missed: {flashScore.missed}</Badge>
              </div>
            </div>

            {flashcards.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                Upload dynamic sources to generate flashcards deck automatically.
              </div>
            ) : (
              <>
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative w-full h-52 cursor-pointer [perspective:1000px]"
                >
                  <div 
                    className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${
                      isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    {/* FRONT CARD */}
                    <Card className="absolute inset-0 w-full h-full p-5 bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm [backface-visibility:hidden]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Flash Question</span>
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-xs leading-relaxed">
                          {activeCard.question}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 self-end">Click card to reveal answer</span>
                    </Card>

                    {/* BACK CARD */}
                    <Card className="absolute inset-0 w-full h-full p-5 bg-teal-600 text-white rounded-3xl flex flex-col justify-between shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-teal-200 uppercase">Answer Sheet</span>
                        <p className="text-white font-bold text-xs leading-relaxed">
                          {activeCard.answer}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-teal-200 self-end">Click to flip back</span>
                    </Card>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleFlashScore('missed')}
                    variant="outline"
                    className="border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs h-10 font-bold"
                  >
                    Review Later
                  </Button>
                  <Button
                    onClick={() => handleFlashScore('gotIt')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-10 font-bold"
                  >
                    Mastered
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* DYNAMIC QUIZ FRAMEWORK */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Interactive Quiz Deck</span>
              <Badge className="bg-teal-50 text-teal-700 text-[10px]">Score: {quizScore}</Badge>
            </div>

            {quizzes.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                Incorporate custom documents to spin up interactive multiple choice questions.
              </div>
            ) : (
              <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl space-y-4">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                  {activeQuiz.question}
                </h4>

                <RadioGroup 
                  value={selectedAnswer || ""} 
                  onValueChange={(val) => !quizSubmitted && setSelectedAnswer(val)}
                  className="space-y-2"
                >
                  {activeQuiz.options.map((opt) => {
                    let badgeStyle = "border-slate-200 dark:border-slate-800";
                    if (quizSubmitted) {
                      if (opt.id === activeQuiz.correct) {
                        badgeStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-400";
                      } else if (opt.id === selectedAnswer) {
                        badgeStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/25 text-rose-800 dark:text-rose-400";
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
                    Submit Option
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

        {/* PRESENTATION SLIDES CANVAS */}
        {activeTab === 'slides' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Presentation Editor</span>
            </div>

            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl min-h-[160px] flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Slide {currentSlide + 1} of {slides.length}</span>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">{activeSlide.title}</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                  {activeSlide.text}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-150 mt-4">
                <Button 
                  disabled={currentSlide === 0} 
                  onClick={() => setCurrentSlide(prev => prev - 1)} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-500 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-[10px] font-bold text-slate-400">Pencil UI Slide Editor</span>

                <Button 
                  disabled={currentSlide + 1 >= slides.length} 
                  onClick={() => setCurrentSlide(prev => prev + 1)} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-500 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Pencil UI Feedback text input block */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 block">
                Pencil Feedback: Rewrite Slide Context
              </label>
              <div className="flex gap-2">
                <Input
                  value={pencilFeedback}
                  onChange={(e) => setPencilFeedback(e.target.value)}
                  placeholder="Insert slide rewrite recommendations..."
                  className="text-xs h-8.5 rounded-lg border-slate-200 focus-visible:ring-teal-500"
                />
                <Button 
                  onClick={handleApplyPencilFeedback}
                  size="xs" 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8.5 px-3 font-bold text-xs"
                >
                  Rewrite
                </Button>
              </div>
            </div>
          </div>
        )}

      </ScrollArea>

      <div className="p-4 bg-slate-100/70 border-t border-slate-200 text-left shrink-0">
        <h5 className="font-bold text-[10px] text-slate-700">absolutelyfreenotebooklm.com</h5>
        <p className="text-[9px] text-slate-500 mt-0.5">Secure client browser sandbox tracking up to 1,000 document slices.</p>
      </div>

    </div>
  );
}