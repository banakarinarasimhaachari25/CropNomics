import React, { useState, useRef, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface GeminiAISuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'voice' | 'transcribe' | 'chat' | 'maps' | 'search' | 'video';
  currentUser?: any;
}

export const GeminiAISuiteModal: React.FC<GeminiAISuiteModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'voice',
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'transcribe' | 'chat' | 'maps' | 'search' | 'video'>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // ==========================================
  // 1. VOICE CONVERSATIONS (gemini-3.8-live)
  // ==========================================
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const startLiveConversation = async () => {
    try {
      setLiveStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      ws.onopen = async () => {
        setLiveConnected(true);
        setLiveStatus('listening');

        // Setup microphone capture at 16kHz
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert to 16-bit PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            // Base64 encode
            const bytes = new Uint8Array(pcm16.buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Audio = btoa(binary);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'text' && msg.text) {
            setLiveTranscript((prev) => [...prev, `AI: ${msg.text}`]);
          }
          if (msg.type === 'audio' && msg.audio) {
            setLiveStatus('speaking');
            playAudioChunk(msg.audio);
          }
          if (msg.type === 'interrupted') {
            audioQueueRef.current = [];
            setLiveStatus('listening');
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onclose = () => {
        stopLiveConversation();
      };

      ws.onerror = (e) => {
        console.error('Live WS error:', e);
        stopLiveConversation();
      };
    } catch (err: any) {
      console.error('Failed to start Live API:', err);
      setLiveStatus('idle');
      alert(`Could not access microphone: ${err.message}`);
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) return;
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const ctx = outputAudioCtxRef.current;
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      sourceNode.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      sourceNode.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
          setLiveStatus('listening');
        }
      };
    } catch (e) {
      console.error('Error playing chunk:', e);
    }
  };

  const stopLiveConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setLiveConnected(false);
    setLiveStatus('idle');
  };

  // ==========================================
  // 2. AUDIO TRANSCRIPTION (gemini-3.5-transcribe)
  // ==========================================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone permission error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const sendAudioForTranscription = async (blob: Blob) => {
    try {
      setIsTranscribing(true);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm',
          }),
        });
        const data = await res.json();
        if (data.text) {
          setTranscribedText(data.text);
        } else {
          setTranscribedText('No spoken text detected or could not transcribe.');
        }
        setIsTranscribing(false);
      };
    } catch (err: any) {
      setIsTranscribing(false);
      alert(`Transcription failed: ${err.message}`);
    }
  };

  // ==========================================
  // 3. MULTI-TURN GEMINI CHATBOT
  // ==========================================
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content:
        'Namaskaram! I am your CropNomics Agricultural AI Assistant. Ask me about mandi prices across AP, harvest timing, crop diseases, or logistics arbitrage.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [chatRole, setChatRole] = useState<'mandi_economist' | 'agronomist' | 'cold_chain' | 'trader'>('mandi_economist');

  const roleInstructions: Record<string, string> = {
    mandi_economist:
      'You are the Lead Agricultural Economist for Andhra Pradesh & Telangana APMC Mandis. Provide exact rate analysis, seasonal arbitrage, and MSP guidance.',
    agronomist:
      'You are a Rythu Bharosa Agronomist. Advise farmers on pest management, soil health, fertilizer scheduling, and weather defense.',
    cold_chain:
      'You are an AgroDirect Cold Chain & Express Logistics Specialist. Advise on shelf-life extension, reefer transit, and post-harvest spoilage reduction.',
    trader:
      'You are an APMC Wholesale Grain & Spice Trader. Help negotiate lots, calculate gross and net margins, and navigate trade terms.',
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          model: chatModel,
          systemInstruction: roleInstructions[chatRole],
        }),
      });
      const data = await res.json();
      if (data.text) {
        setChatMessages([...updatedMessages, { role: 'model', content: data.text }]);

        // Persist to Firestore if user logged in
        if (currentUser && auth.currentUser) {
          try {
            await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), {
              userId: auth.currentUser.uid,
              userMessage: userMessage.content,
              aiResponse: data.text,
              model: chatModel,
              createdAt: serverTimestamp(),
            });
          } catch (fireErr) {
            handleFirestoreError(fireErr, OperationType.CREATE, 'chats');
          }
        }
      } else {
        setChatMessages([
          ...updatedMessages,
          { role: 'model', content: data.error || 'Apologies, failed to retrieve an answer.' },
        ]);
      }
    } catch (err: any) {
      setChatMessages([
        ...updatedMessages,
        { role: 'model', content: `Error communicating with AI: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ==========================================
  // 4. GOOGLE MAPS GROUNDING (gemini-3.5-flash)
  // ==========================================
  const [mapsQuery, setMapsQuery] = useState('Guntur Mirchi Yard and nearby cold storage');
  const [mapsLocation, setMapsLocation] = useState('Andhra Pradesh, India');
  const [mapsResult, setMapsResult] = useState<{ text: string; groundingMetadata?: any } | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);

  const handleMapsLookup = async () => {
    if (!mapsQuery.trim() || mapsLoading) return;
    setMapsLoading(true);
    setMapsResult(null);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mapsQuery,
          location: mapsLocation,
        }),
      });
      const data = await res.json();
      setMapsResult(data);
    } catch (err: any) {
      setMapsResult({ text: `Failed to fetch maps data: ${err.message}` });
    } finally {
      setMapsLoading(false);
    }
  };

  // ==========================================
  // 5. GOOGLE SEARCH GROUNDING (gemini-3.5-flash)
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('Latest Chilli and Paddy mandi prices Andhra Pradesh today MSP');
  const [searchResult, setSearchResult] = useState<{ text: string; groundingMetadata?: any } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearchLookup = async () => {
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      setSearchResult({ text: `Failed to fetch search data: ${err.message}` });
    } finally {
      setSearchLoading(false);
    }
  };

  // ==========================================
  // 6. VEO IMAGE-TO-VIDEO GENERATION (veo-3.1-fast-generate-preview)
  // ==========================================
  const [videoImage, setVideoImage] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('Cinematic aerial drone shot of golden paddy harvest fields in sunlight with farmers loading bags on trucks');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatusMsg, setVideoStatusMsg] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoImage) {
      alert('Please upload or select an image to animate into video.');
      return;
    }
    setVideoLoading(true);
    setVideoError(null);
    setVideoStatusMsg('Initiating Veo video synthesis (model: veo-3.1-fast-generate-preview)...');

    try {
      const startRes = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: videoImage,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (startData.error) {
        setVideoError(startData.error);
        setVideoLoading(false);
        return;
      }

      const operationName = startData.operationName;
      setVideoStatusMsg('Video rendering in progress. Polling server status...');

      // Polling loop
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 30) {
        attempts++;
        await new Promise((r) => setTimeout(r, 8000));
        setVideoStatusMsg(`Synthesizing animation frames (check #${attempts})...`);

        const pollRes = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const pollData = await pollRes.json();

        if (pollData.done) {
          completed = true;
          setVideoStatusMsg('Downloading completed video stream...');
          const dlRes = await fetch('/api/gemini/video-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });
          const blob = await dlRes.blob();
          const localUrl = URL.createObjectURL(blob);
          setGeneratedVideoUrl(localUrl);
          setVideoStatusMsg('Video generated successfully!');
          break;
        }
      }

      if (!completed) {
        setVideoStatusMsg('Video generation taking longer than expected. Please check back later.');
      }
    } catch (err: any) {
      setVideoError(err?.message || 'Video generation failed');
    } finally {
      setVideoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden text-on-surface animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-title-lg font-bold text-lg text-on-surface">
                  CropNomics AI Intelligence Hub
                </h3>
                <span className="bg-primary/10 text-primary text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-body-sm">
                Real-time voice, speech-to-text, maps grounding, search data & Veo video generator
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLiveConversation();
              stopRecording();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-outline-variant/30 bg-surface-container-lowest px-4 py-2 gap-2 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
            <span>Live Voice API</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded font-mono">3.8-live</span>
          </button>

          <button
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transcribe'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
            <span>Transcribe Audio</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded font-mono">3.5-transcribe</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>Gemini Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'maps'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span>Maps Grounding</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Search Grounding</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">movie</span>
            <span>Veo Video</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded font-mono">veo-3.1</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: LIVE VOICE */}
          {activeTab === 'voice' && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto py-4">
              <div className="relative mb-6">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    liveConnected
                      ? liveStatus === 'speaking'
                        ? 'bg-emerald-500/20 text-emerald-600 scale-110 ring-4 ring-emerald-500/30 animate-pulse'
                        : 'bg-secondary/20 text-secondary scale-105 ring-4 ring-secondary/30'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[44px]">
                    {liveStatus === 'speaking' ? 'volume_up' : liveStatus === 'listening' ? 'mic' : 'mic_off'}
                  </span>
                </div>
                {liveConnected && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <h4 className="text-xl font-bold font-title-lg">
                {liveConnected
                  ? liveStatus === 'speaking'
                    ? 'AI is Speaking...'
                    : 'Listening to your voice...'
                  : 'Real-Time Voice Assistant (gemini-3.8-live)'}
              </h4>
              <p className="text-xs text-on-surface-variant mt-1.5 mb-6 max-w-md">
                Talk directly with the AI about mandi arrivals, prices, or storage. Low-latency bidirectional audio with interruption handling.
              </p>

              {!liveConnected ? (
                <button
                  type="button"
                  onClick={startLiveConversation}
                  className="bg-secondary text-white hover:bg-secondary/90 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                  <span>Start Live Conversation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveConversation}
                  className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">call_end</span>
                  <span>End Conversation</span>
                </button>
              )}

              {liveTranscript.length > 0 && (
                <div className="mt-6 w-full text-left bg-surface-container p-3 rounded-xl border border-outline-variant/30 max-h-48 overflow-y-auto text-xs font-mono">
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Live Feed</div>
                  {liveTranscript.map((t, i) => (
                    <div key={i} className="py-0.5 text-on-surface">
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRANSCRIBE AUDIO */}
          {activeTab === 'transcribe' && (
            <div className="max-w-xl mx-auto py-4">
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold font-title-lg text-on-surface">
                  Audio Speech-to-Text Transcription
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Using model <span className="font-mono font-bold text-secondary">gemini-3.5-transcribe</span>. Speak in Telugu, Hindi, or English to transcribe crop lots or mandi requirements.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-surface-container rounded-2xl border border-outline-variant/40 mb-5">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all mb-4 ${
                    isRecording
                      ? 'bg-red-500/20 text-red-600 ring-4 ring-red-500/30 animate-pulse'
                      : 'bg-secondary/10 text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px]">
                    {isRecording ? 'mic' : 'mic_none'}
                  </span>
                </div>

                {isRecording ? (
                  <div className="text-center">
                    <span className="text-red-600 font-mono font-bold text-sm block">
                      Recording: {recordingDuration}s
                    </span>
                    <button
                      onClick={stopRecording}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">stop</span>
                      <span>Stop & Transcribe</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                    <span>Start Recording Microphone</span>
                  </button>
                )}

                {isTranscribing && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-mono text-secondary animate-pulse">
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Transcribing with gemini-3.5-transcribe...</span>
                  </div>
                )}
              </div>

              {transcribedText && (
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-on-surface-variant uppercase">
                      Transcribed Output
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transcribedText);
                        alert('Copied to clipboard!');
                      }}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span>Copy Text</span>
                    </button>
                  </div>
                  <p className="text-sm text-on-surface font-body-md whitespace-pre-wrap">
                    {transcribedText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GEMINI CHATBOT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px]">
              {/* Controls: Model & Role Selection */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface-variant">Advisor Role:</span>
                  <select
                    value={chatRole}
                    onChange={(e) => setChatRole(e.target.value as any)}
                    className="bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/50 text-xs font-semibold text-on-surface"
                  >
                    <option value="mandi_economist">Mandi Price Economist</option>
                    <option value="agronomist">Agronomist & Soil Specialist</option>
                    <option value="cold_chain">Cold Chain & Logistics</option>
                    <option value="trader">Wholesale Trader & Margins</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface-variant">Model:</span>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value as any)}
                    className="bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/50 text-xs font-mono font-semibold text-on-surface"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
                  </select>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'model' && (
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-secondary text-white rounded-tr-xs'
                          : 'bg-surface-container text-on-surface rounded-tl-xs border border-outline-variant/30'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 items-center text-xs text-on-surface-variant animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    </div>
                    <span>Gemini is formulating response...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="pt-3 border-t border-outline-variant/30 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about harvest rates, mandi arbitrage, or MSP rules..."
                  className="flex-1 bg-surface-container px-3.5 py-2.5 rounded-xl border border-outline-variant/50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-secondary/30 text-on-surface"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE MAPS GROUNDING */}
          {activeTab === 'maps' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold font-title-lg text-on-surface">
                  Google Maps Grounding with Gemini 3.5 Flash
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Grounded with real Google Maps data to locate APMC mandis, Rythu Bazars, cold chains, and optimal highway depots.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  placeholder="Search mandi, cold storage, or transport hub..."
                  className="flex-1 bg-surface-container px-3.5 py-2.5 rounded-xl border border-outline-variant/50 text-xs sm:text-sm text-on-surface"
                />
                <input
                  type="text"
                  value={mapsLocation}
                  onChange={(e) => setMapsLocation(e.target.value)}
                  placeholder="Location context"
                  className="w-full sm:w-48 bg-surface-container px-3.5 py-2.5 rounded-xl border border-outline-variant/50 text-xs sm:text-sm text-on-surface"
                />
                <button
                  onClick={handleMapsLookup}
                  disabled={mapsLoading}
                  className="bg-secondary text-white hover:bg-secondary/90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {mapsLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  )}
                  <span>Search Maps</span>
                </button>
              </div>

              {mapsResult && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 space-y-3">
                  <div className="text-xs font-mono uppercase font-bold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                    <span>Maps Grounded Response</span>
                  </div>
                  <div className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {mapsResult.text}
                  </div>

                  {mapsResult.groundingMetadata?.groundingChunks && (
                    <div className="pt-2 border-t border-outline-variant/30">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
                        Map Grounding References:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {mapsResult.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                          <div key={i} className="text-[11px] bg-surface-container px-2 py-1 rounded text-secondary font-mono">
                            {chunk.web?.title || chunk.web?.uri || `Reference #${i + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GOOGLE SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold font-title-lg text-on-surface">
                  Google Search Grounding with Gemini 3.5 Flash
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Access live market prices, official MSP notices, weather forecasts, and export regulations verified via Google Search.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter crop, mandi commodity, or government scheme query..."
                  className="flex-1 bg-surface-container px-3.5 py-2.5 rounded-xl border border-outline-variant/50 text-xs sm:text-sm text-on-surface"
                />
                <button
                  onClick={handleSearchLookup}
                  disabled={searchLoading}
                  className="bg-secondary text-white hover:bg-secondary/90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {searchLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                  )}
                  <span>Search Live Data</span>
                </button>
              </div>

              {searchResult && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 space-y-3">
                  <div className="text-xs font-mono uppercase font-bold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Search Grounded Intelligence</span>
                  </div>
                  <div className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {searchResult.text}
                  </div>

                  {searchResult.groundingMetadata?.webSearchQueries && (
                    <div className="pt-2 border-t border-outline-variant/30">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">
                        Queries Evaluated:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResult.groundingMetadata.webSearchQueries.map((q: string, i: number) => (
                          <span key={i} className="text-[11px] bg-surface-container px-2 py-0.5 rounded text-on-surface font-mono">
                            🔍 {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VEO VIDEO GENERATION */}
          {activeTab === 'video' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center">
                <h4 className="text-base font-bold font-title-lg text-on-surface">
                  Animate Photos into Video (Veo)
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Upload a photo of your harvest, field, or produce lot and generate cinematic video using model <span className="font-mono font-bold text-secondary">veo-3.1-fast-generate-preview</span>.
                </p>
              </div>

              {/* Upload image */}
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container/50">
                {videoImage ? (
                  <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden mb-3">
                    <img src={videoImage} alt="Crop" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setVideoImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <span className="material-symbols-outlined text-[36px] text-secondary mb-1">upload_file</span>
                    <span className="text-xs font-bold text-on-surface">Click to select photo</span>
                    <span className="text-[11px] text-on-surface-variant">JPEG or PNG format</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Prompt and Aspect Ratio */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">Animation Prompt</label>
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/50 text-xs text-on-surface"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-on-surface-variant">Aspect Ratio:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ar"
                      value="16:9"
                      checked={videoAspectRatio === '16:9'}
                      onChange={() => setVideoAspectRatio('16:9')}
                    />
                    <span>16:9 (Landscape)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ar"
                      value="9:16"
                      checked={videoAspectRatio === '9:16'}
                      onChange={() => setVideoAspectRatio('9:16')}
                    />
                    <span>9:16 (Portrait)</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={videoLoading || !videoImage}
                className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {videoLoading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">movie_filter</span>
                )}
                <span>Generate Video with Veo</span>
              </button>

              {videoStatusMsg && (
                <div className="p-3 bg-surface-container rounded-xl text-xs font-mono text-center text-on-surface border border-outline-variant/30">
                  {videoStatusMsg}
                </div>
              )}

              {videoError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold block mb-1">Notice:</span>
                  {videoError}
                </div>
              )}

              {generatedVideoUrl && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-on-surface block mb-2">Generated Video Result:</span>
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-xl border border-outline-variant/40"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
