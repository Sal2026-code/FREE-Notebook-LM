"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Headphones, Play, Pause, RotateCcw, Volume2, LayoutGrid, HelpCircle, 
  Map, FileText, Calendar, Compass, ChevronLeft, ChevronRight, Edit3, Check
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
import { QuizQuestion, Slide, generateCoHostPodcastScript } from '@/utils/db';

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

  // Podcast state variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scriptText = React.useMemo(() => {
    return generateCoHostPodcastScript(sources);
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
      showError("Text-to-Speech not supported inside this browser.");
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      showSuccess("Podcast briefing paused!");
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
      showSuccess("Podcast finished!");
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
    showSuccess("Podcast tracking reset.");
  };

  // Flashcards 3D flip-matrix state
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

  // Dynamic Quiz State
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
      showError("Incorrect. Keep study focus!");
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

  // Slides State
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
      showSuccess("Pencil UI: rewritten slide context successfully!");
    }
  };

  return (
    <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#161616] border-l border-slate-200/80 flex flex-col text-left overflow-hidden">
      
      {/* Studio Navigation Tab Ribbon */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 flex flex-wrap gap-1 items-center shrink-0">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'presets' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Study Presets
        </button>
        <button
          onClick={() => setActiveTab('podcast')}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'podcast' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Co-Hosts Podcast
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'flashcards' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Flashcards ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'quiz' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Live Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
            activeTab === 'slides' ? 'bg-teal-600 text-white' : 'text-slate-600'
          }`}
        >
          Canvas Slides
        </button>
      </div>

      <ScrollArea className="flex-1 p-4">
        
        {/* PRESET COMMAND GRID PANEL */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <LayoutGrid className="w-4 h-4 text-teal-600" />
              STUDIO PRESETS COMMAND GRID
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'accordion', label: "Study Accordions", icon: <Compass className="w-4 h-4" /> },
                { id: 'faq', label: "Dynamic FAQ Sheets", icon: <HelpCircle className="w-4 h-4" /> },
                { id: 'grid', label: "Guide Matrix Grids", icon: <LayoutGrid className="w-4 h-4" /> },
                { id: 'timeline', label: "Milestone Timelines", icon: <Calendar className="w-4 h-4" /> },
                { id: 'mindmap', label: "Interactive Mindmaps", icon: <Map className="w-4 h-4" /> },
                { id: 'report', label: "Dossier Summaries", icon: <FileText className="w-4 h-4" /> }
              ].map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setActivePreset(cmd.id);
                    showSuccess(`Loaded template preset: ${cmd.label}`);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                    activePreset === cmd.id
                      ? 'border-teal-500 bg-teal-50/40'
                      : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="text-teal-600 group-hover:scale-105 transition-transform">{cmd.icon}</div>
                  <span className="text-[11px] font-bold text-slate-700 mt-3 block">{cmd.label}</span>
                </button>
              ))}
            </div>

            {activePreset && (
              <Card className="p-4 border border-teal-100 bg-white dark:bg-slate-950 rounded-2xl mt-4">
                {sources.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No sources selected. Please ingest files in left panel first.</p>
                ) : (
                  <>
                    {activePreset === 'accordion' && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-none">
                          <AccordionTrigger className="text-xs font-bold py-1.5 hover:no-underline">Segmented Focus Detail</AccordionTrigger>
                          <AccordionContent className="text-[11px] text-slate-500 leading-relaxed">
                            {sources[0]?.content.slice(0, 250)}...
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {activePreset === 'faq' && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">Q: What is the footprint of this loaded source?</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">A: It comprises approximately {sources[0]?.wordCount} indexed words.</p>
                      </div>
                    )}

                    {activePreset === 'grid' && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <strong className="block mb-0.5">Title</strong>
                          {sources[0]?.title}
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <strong className="block mb-0.5">Slices</strong>
                          {sources[0]?.chunks.length} active chunks
                        </div>
                      </div>
                    )}

                    {activePreset === 'timeline' && (
                      <div className="space-y-3 relative pl-4 border-l border-teal-200">
                        <div>
                          <strong className="text-[11px] block">Checkpoint: Ingest Node</strong>
                          <span className="text-[10px] text-slate-500">Document parsed cleanly on {sources[0]?.addedAt}</span>
                        </div>
                      </div>
                    )}

                    {activePreset === 'mindmap' && (
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-teal-700">{sources[0]?.title}</div>
                        <div className="pl-4 border-l border-slate-200 text-[11px] space-y-1">
                          <div>├─ Core Vector Slices</div>
                          <div>└─ Local Highlights Timeline</div>
                        </div>
                      </div>
                    )}

                    {activePreset === 'report' && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-teal-600">Secure Audit Report</span>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          Secure database parsing checked for active index: {sources[0]?.title}.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}
          </div>
        )}

        {/* CO-HOST PODCAST PLAYBACK */}
        {activeTab === 'podcast' && (
          <div className="space-y-4">
            <Card className="p-5 border-none shadow-sm bg-slate-900 text-white rounded-3xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <Badge className="bg-teal-500 text-slate-900 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase">
                  NATIVE BROWSER SPEECH SYNTHESIS ENGINE
                </Badge>

                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">
                    {sources[0]?.title || "Workspace Overview"} Podcast
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-normal mt-1">
                    Alternating Host 1 (US Voice) and Host 2 (UK/Samantha Voice) with natural filler expressions, running entirely client-side.
                  </p>
                </div>

                <div className="h-10 flex items-end justify-center gap-1.5 py-1 bg-slate-950/40 rounded-xl px-2">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-teal-400 transition-all"
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

            {/* Alternating script script timeline */}
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
                      {line.startsWith('Host 1:') ? "Host 1 (Academic Specialist)" : "Host 2 (Interviewer)"}
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

        {/* 3D MATRIX FLASHCARDS SYSTEM */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">3D MATRIX FLASHCARDS</span>
              <div className="flex gap-2 text-[10px] font-bold">
                <Badge className="bg-emerald-50 text-emerald-700 border-none">Mastered: {cardStats.mastered}</Badge>
                <Badge className="bg-rose-50 text-rose-700 border-none">Reviewing: {cardStats.reviewing}</Badge>
              </div>
            </div>

            {flashcards.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                Upload custom sources to generate card evaluations automatically.
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
                    {/* Front slide */}
                    <Card className="absolute inset-0 w-full h-full p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm [backface-visibility:hidden]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Flash Evaluator</span>
                        <p className="text-slate-800 font-bold text-xs leading-relaxed">
                          {activeCard.question}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 self-end">Click card to flip</span>
                    </Card>

                    {/* Back slide */}
                    <Card className="absolute inset-0 w-full h-full p-5 bg-teal-600 text-white rounded-3xl flex flex-col justify-between shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-teal-200 uppercase font-mono">Answer Context</span>
                        <p className="text-white font-semibold text-xs leading-relaxed">
                          {activeCard.answer}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-teal-200 self-end">Click card to reset</span>
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

        {/* SELF EVALUATING MULTIPLE CHOICE QUIZZES */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Quiz Matrix Assessment</span>
              <Badge className="bg-teal-50 text-teal-700 text-[10px]">Footprint matches: {score}</Badge>
            </div>

            {quizzes.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                Incorporate custom files to compile assessment questions automatically.
              </div>
            ) : (
              <Card className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
                <h4 className="font-bold text-xs text-slate-800 leading-relaxed">
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
                        <Label htmlFor={opt.id} className="text-[11px] font-bold text-slate-700 cursor-pointer flex-1">
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
                    Next ASSESSMENT Question
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}

        {/* PRESENTATION SLIDES CANVAS WITH PENCIL FEEDBACK */}
        {activeTab === 'slides' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-700 block">Workspace Slide Decks</span>

            <Card className="p-6 bg-white border border-slate-200 rounded-3xl min-h-[160px] flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-teal-600 uppercase">Slide {currentSlideIndex + 1} of {slides.length}</span>
                <h3 className="font-bold text-xs text-slate-800">{activeSlide.title}</h3>
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
                
                <span className="text-[10px] font-bold text-slate-400">Pencil UI Slide Editor</span>

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
                Pencil Feedback: Rewrite current slide context
              </label>
              <div className="flex gap-2">
                <Input
                  value={pencilFeedback}
                  onChange={(e) => setPencilFeedback(e.target.value)}
                  placeholder="Recommend slide rewrite ideas..."
                  className="text-xs h-8.5 rounded-lg border-slate-200 focus-visible:ring-teal-500"
                />
                <Button 
                  onClick={handleApplySlideFeedback}
                  size="sm" 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8.5 px-3 font-bold text-xs"
                >
                  Rewrite Context
                </Button>
              </div>
            </div>
          </div>
        )}

      </ScrollArea>

    </div>
  );
}