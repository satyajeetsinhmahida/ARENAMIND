import React, { useEffect, useState, useRef } from 'react';

interface VoiceInputProps {
  onTranscriptComplete: (text: string) => void;
  language: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptComplete,
  language
}) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Detect Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Match language code
      rec.lang = language === 'ar' ? 'ar-SA' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscriptComplete(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  if (!supported) return null; // Graceful degradation

  return (
    <button
      onClick={toggleListening}
      className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-200 ${
        isListening
          ? 'bg-red-500 text-white animate-pulse shadow-lg scale-105'
          : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/8'
      }`}
      type="button"
      aria-label={isListening ? "Stop voice listening recognition" : "Start speech voice recognition input"}
      aria-pressed={isListening}
    >
      {isListening ? (
        // Pulsing mic dot
        <div className="w-3.5 h-3.5 rounded-full bg-white relative">
          <div className="absolute inset-0 rounded-full bg-white animate-ping" />
        </div>
      ) : (
        // Microphone SVG icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      )}
    </button>
  );
};
