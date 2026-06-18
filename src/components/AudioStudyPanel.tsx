"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Headphones, Play, Pause, RotateCcw, Volume2, LayoutGrid, HelpCircle, 
  Map, FileText, Calendar, Compass, ChevronLeft, ChevronRight, Edit3, Check, CheckSquare, Settings2, Sliders, BookOpen
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
  const [activeTab, setActiveTab] = useState<'podcast' | 'studio-guides' | 'flashcards' | 'quiz' | 'slides'>('podcast');
  const [podcastInstructions, setPodcastInstructions] = useState("");
  const [appliedInstructions, setAppliedInstructions] = useState("");

  // Podcast state variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scriptText = React.useMemo(() => {
    return generateCoHostPodcastScript(sources, appliedInstructions);
  }, [sources, appliedInstructions]);

  const scriptLines = React.useMemo(() => {
    return scriptText
      .split('\n')
      .filter(line => line.startsWith('Host 1:') || line.startsWith('Host 2:'));
  }, [scriptText]);

  // Compile deep Study Guide assets
  const studyGuide = React.useMemo(() => {
    return compileStudyGuide(sources);
  }, [sources]);

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
    // Host 1: Male or standard US voice
    const host1Voice = voices.find(v => v.name.includes('Google US English') || v.lang.startsWith('en-US')) || voices[0];
    // Host 2: Female / British voice
    const host2Voice = voices.find(v => v.name.includes('Google UK English') || v.lang.startsWith('en-GB') || v.name.includes('Samantha') || v.name.includes('Zira')) || voices[1] || voices[0];

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

  const applyPodcastInstructions = () => {
    setAppliedInstructions(podcastInstructions);
    handleResetPodcast();
    showSuccess("Rebuilt audio overview using focus criteria!");
  };

  // Flashcards flip-matrix state
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
      showSuccess("Rewritten slide context successfully!");
    }
  };

  return (
    <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#161616] border-l border-slate-200/80 flex flex-col text-left overflow-hidden">
      
      {/* Studio Navigation Tab Ribbon */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 flex flex-wrap gap-1 items-center shrink-0">
        <button
          onClick={() => setActiveTab('podcast')}
          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
            activeTab === 'podcast' ? 'bg-[#006a6a] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Co-Hosts Audio
        </button>
        <button
          onClick={() => setActiveTab('studio-guides')}
          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
            activeTab === 'studio-guides' ? 'bg-[#006a6a] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Guides & FAQ
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
            activeTab === 'flashcards' ? 'bg-[#006a6a] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Cards ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
            activeTab === 'quiz' ? 'bg-[#006a6a] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Quizzes
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
            activeTab === 'slides' ? 'bg-[#006a6a] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Slides
        </button>
      </div>

      <ScrollArea className="flex-1 p-4">
        
        {/* PODCAST PANEL WITH FOCUS INPUTS */}
        {activeTab === 'podcast' && (
          <div className="space-y-4">
            <Card className="p-5 border-none shadow-sm bg-slate-900 text-white rounded-3xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <Badge className="bg-teal-500 text-slate-900 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase">
                  NATIVE BROWSER SPEECH SYNTHESIS
                </Badge>

                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">
                    {sources[0]?.title || "Workspace Overview"} Podcast
                  </h3>
                  <p className="text-slate-400 text-[10px] leading-normal mt-1">
                    Alternating Host 1 (Specialist) and Host 2 (Interviewer) with conversational dialog flow.
                  </p>
                </div>

                {/* Animated waves visualizer */}
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

                  <div className="flex items-center gap-1 text-teal-400 font-mono text-[10px]">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>LOCAL</span>
                  </div>
                </div>

              </div>
            </Card>

            {/* CUSTOM AUDIO INSTRUCTION WIDGET (NotebookLM New Feature!) */}
            <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#006a6a]" />
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Customize Audio Focus</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Direct the co-hosts! Try: <span className="font-bold">"explain like I am 5"</span>, <span className="font-bold">"make it funny"</span>, or <span className="font-bold">"deeply technical"</span>.
              </p>
              <div className="flex gap-2">
                <Input
                  value={podcastInstructions}
                  onChange={(e) => setPodcastInstructions(e.target.value)}
                  placeholder="Enter custom focus instructions..."
                  className="h-9 text-xs rounded-xl focus-visible:ring-[#006a6a] border-slate-200"
                />
                <Button 
                  onClick={applyPodcastInstructions}
                  className="bg-[#006a6a] hover:bg-[#005252] text-white text-xs font-bold rounded-xl h-9 px-3"
                >
                  Apply
                </Button>
              </div>
            </Card>

            {/* Dialog transcript script timeline */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                Dialogue Timeline Transcript
              </span>
              
              {scriptLines.map((line, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    idx === currentLineIndex && isPlaying
                      ? 'border-teal-500 bg-teal-50/20 shadow-sm'
                      : 'border-slate-200/60 bg-white'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-teal-700 block mb-0.5">
                    {line.startsWith('Host 1:') ? "Host 1 (Lead Specialist)" : "Host 2 (Interviewer)"}
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {line.replace(/^Host [12]:\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY GUIDES HUB */}
        {activeTab === 'studio-guides' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 tracking-wide uppercase">
              <BookOpen className="w-4 h-4 text-[#006a6a]" />
              Notebook Guide Studio
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              
              <AccordionItem value="faq" className="border border-slate-200 bg-white rounded-2xl px-4 py-1">
                <AccordionTrigger className="text-xs font-bold hover:no-underline text-slate-800">
                  📋 Dynamic FAQ Study Sheet
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100">
                  {studyGuide.faq.map((item, idx) => (
                    <div key={idx} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border">
                      <strong className="block text-slate-800 font-bold">Q: {item.question}</strong>
                      <p>A: {item.answer}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="brief" className="border border-slate-200 bg-white rounded-2xl px-4 py-1">
                <AccordionTrigger className="text-xs font-bold hover:no-underline text-slate-800">
                  📄 Comprehensive Briefing Document
                </AccordionTrigger>
                <AccordionContent className="pt-2 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-wrap font-medium">
                  {studyGuide.briefing}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="timeline" className="border border-slate-200 bg-white rounded-2xl px-4 py-1">
                <AccordionTrigger className="text-xs font-bold hover:no-underline text-slate-800">
                  ⏳ Chronological Milestone Timeline
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="relative border-l border-teal-200 pl-4 ml-1 space-y-4">
                    {studyGuide.timeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">{item.date}</span>
                        <strong className="block text-xs text-slate-800 font-bold mt-1">{item.event}</strong>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="glossary" className="border border-slate-200 bg-white rounded-2xl px-4 py-1">
                <AccordionTrigger className="text-xs font-bold hover:no-underline text-slate-800">
                  📖 Terminology Glossary
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
                  {studyGuide.glossary.map((g, idx) => (
                    <div key={idx} className="flex justify-between gap-4 p-2 bg-slate-50 rounded-lg border">
                      <strong className="text-teal-700 font-bold shrink-0">{g.term}</strong>
                      <span className="text-slate-600">{g.definition}</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        )}

        {/* 3D FLASHCARDS SYSTEM */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">STUDY FLASHCARDS</span>
              <div className="flex gap-2 text-[10px] font-bold">
                <Badge className="bg-emerald-50 text-emerald-700 border-none">Mastered: {cardStats.mastered}</Badge>
                <Badge className="bg-rose-50 text-rose-700 border-none">Review: {cardStats.reviewing}</Badge>
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
                    {/* Front */}
                    <Card className="absolute inset-0 w-full h-full p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm [backface-visibility:hidden]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-extrabold tracking-wider text-teal-600 uppercase">Flash Evaluator</span>
                        <p className="text-slate-800 font-bold text-xs leading-relaxed">
                          {activeCard.question}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 self-end">Click card to flip</span>
                    </Card>

                    {/* Back */}
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
              <Badge className="bg-teal-50 text-teal-700 text-[10px]">Score: {score}</Badge>
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
                    Next Questions
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}

        {/* CANVAS PRESENTATION SLIDES */}
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
                
                <span className="text-[10px] font-bold text-slate-400">Slide Canvas Control</span>

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
                  placeholder="Recommend slide rewrite ideas..."
                  className="text-xs h-8.5 rounded-lg border-slate-200 focus-visible:ring-teal-500"
                />
                <Button 
                  onClick={handleApplySlideFeedback}
                  size="sm" 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8.5 px-3 font-bold text-xs"
                >
                  Apply Rewrite
                </Button>
              </div>
            </div>
          </div>
        )}

      </ScrollArea>

    </div>
  );
}