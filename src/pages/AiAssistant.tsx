import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Paperclip, Mic, Image, MoreVertical, ChevronLeft, X, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import aiService from '../services/aiService';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Import types from service
import type { ChatMessage } from '../services/aiService';

// Define a clear interface for message objects
interface MessageFileInfo {
  name: string;
  type: string;
  size: string;
}

interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: Date;
  fileInfo?: MessageFileInfo; // Make fileInfo optional with ?
  hasBeenRead?: boolean; // Track if message has been read by voice
}

// Simple audio player with a stop and cleanup function
const audioElement = new Audio();

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your DiaFit AI assistant. I can help answer questions about diabetes management, nutrition, exercise, and healthy living. How can I assist you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([
    { role: 'system' as const, content: aiService.getDiabetesSystemPrompt() },
    { role: 'assistant' as const, content: "Hello! I'm your DiaFit AI assistant. I can help answer questions about diabetes management, nutrition, exercise, and healthy living. How can I assist you today?" }
  ]);

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Handle audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isSpeaking) {
      const nextAudio = audioQueue[0];
      const newQueue = [...audioQueue];
      newQueue.shift();
      setAudioQueue(newQueue);
      playAudio(nextAudio);
    }
  }, [audioQueue, isSpeaking]);

  // Initialize audio element
  useEffect(() => {
    // Set up audio element handlers
    audioElement.onplay = () => {
      console.log('Audio started playing');
      setIsSpeaking(true);
    };
    
    audioElement.onended = () => {
      console.log('Audio finished playing');
      setIsSpeaking(false);
      
      // Free up memory by releasing the audio source
      URL.revokeObjectURL(audioElement.src);
      audioElement.src = '';
    };
    
    audioElement.onerror = (e) => {
      console.error('Audio error:', e);
      setIsSpeaking(false);
      
      // Free up memory on error
      URL.revokeObjectURL(audioElement.src);
      audioElement.src = '';
    };
    
    // Cleanup
    return () => {
      stopSpeech();
      
      // Free up memory
      if (audioElement.src) {
        URL.revokeObjectURL(audioElement.src);
      }
    };
  }, []);

  // Update inputMessage with transcript when speech is detected
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  // Update UI listening state when recognition status changes
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);
  
  // Function to create speech and play it
  const speakText = async (text: string) => {
    // Clean text
    const cleanText = text
      .replace(/[*_~`#\[\]]/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[^\w\s.,?!:;'"()-]/g, '')
      .trim();
    
    try {
      // Split text into smaller chunks if it's too long
      const maxLength = 2000; // Microsoft TTS works well with chunks under 2000 chars
      const chunks = [];
      
      // Simple text chunking by sentences
      let currentChunk = '';
      const sentences = cleanText.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
          chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // Process chunk by chunk
      for (const chunk of chunks) {
        // Add to audio queue
        if (isSpeaking) {
          // If already speaking, add to queue
          setAudioQueue((prev) => [...prev, chunk]);
        } else {
          // If not speaking, play directly
          playAudio(chunk);
        }
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Try fallback to browser TTS
      fallbackSpeak(text);
    }
  };
  
  // Function to generate and play audio for a text chunk
  const playAudio = async (textChunk: string) => {
    try {
      // Make sure speech synthesis is initialized
      if (speechSynthesis.getVoices().length === 0) {
        // Wait briefly for voices to load if needed
        console.log('Waiting for voices to load...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Creating utterance for text:', textChunk.substring(0, 30) + '...');
      
      // Create a new utterance for this chunk
      const utterance = new SpeechSynthesisUtterance(textChunk);
      
      // Try to find a female voice - more aggressive approach
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      let femaleVoice = null;
      
      // First try exact matches for known female voices
      femaleVoice = voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('Female') ||
        voice.name.includes('woman') ||
        voice.name.includes('Jenny') ||
        voice.name.includes('Samantha') ||
        (voice.name.includes('Google') && voice.name.includes('US English') && !voice.name.includes('Male'))
      );
      
      // If no match, try to use any female-sounding voice based on name
      if (!femaleVoice && voices.length > 0) {
        // Try common female names in voice APIs
        const femaleNames = ['Joanna', 'Salli', 'Kimberly', 'Kendra', 'Ivy', 'Amy', 'Mary', 'Kate'];
        femaleVoice = voices.find(voice => femaleNames.some(name => voice.name.includes(name)));
        
        // Still no match? Use the first female voice by traditional naming conventions
        if (!femaleVoice) {
          femaleVoice = voices.find(voice => voice.name.endsWith('Female'));
        }
        
        // Last resort - use first available voice
        if (!femaleVoice && voices.length > 0) {
          femaleVoice = voices[0];
        }
      }
      
      if (femaleVoice) {
        console.log('Selected voice:', femaleVoice.name);
        utterance.voice = femaleVoice;
      } else {
        console.log('No specific voice selected, using default');
      }
      
      // Setup event handlers
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        
        // Clear any references to prevent memory leaks
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        
        // Cancel after completion to prevent repetition
        speechSynthesis.cancel();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
        
        // Clean up
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        speechSynthesis.cancel();
      };
      
      // Set properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Cancel any current speech first
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        // Small delay to ensure cancellation completes
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Speak
      speechSynthesis.speak(utterance);
      
      // Chrome-specific fix for long utterances cutting off
      if (navigator.userAgent.indexOf('Chrome') !== -1) {
        const intervalId = setInterval(() => {
          if (!speechSynthesis.speaking) {
            clearInterval(intervalId);
            return;
          }
          // This keeps speech alive in Chrome
          speechSynthesis.pause();
          speechSynthesis.resume();
        }, 5000);
        
        // Clear interval when speech ends
        utterance.onend = () => {
          clearInterval(intervalId);
          console.log('Speech ended');
          setIsSpeaking(false);
          
          // Clean up
          utterance.onstart = null;
          utterance.onend = null;
          utterance.onerror = null;
          
          // Cancel after completion to prevent repetition
          speechSynthesis.cancel();
        };
      }
    } catch (error) {
      console.error('Failed to play speech:', error);
      setIsSpeaking(false);
      
      // Attempt alternative method
      fallbackSpeak(textChunk);
    }
  };
  
  // Fallback using simpler approach
  const fallbackSpeak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set up minimal handlers
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          speechSynthesis.cancel();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          speechSynthesis.cancel();
        };
        
        // Cancel any previous speech
        speechSynthesis.cancel();
        
        // Speak
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Fallback speech failed:', error);
      setIsSpeaking(false);
    }
  };

  // Stop any ongoing speech
  const stopSpeech = () => {
    if (isSpeaking) {
      // Clear queue
      setAudioQueue([]);
      
      // Stop audio element
      if (audioElement.src) {
        audioElement.pause();
        audioElement.currentTime = 0;
        URL.revokeObjectURL(audioElement.src);
        audioElement.src = '';
      }
      
      // Also stop browser speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      
      setIsSpeaking(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // If we were listening, stop
    if (isListening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: "user",
      timestamp: new Date()
    };
    
    // Update messages state
    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation history for API
    const updatedConversation: ChatMessage[] = [
      ...conversation,
      { role: 'user' as const, content: inputMessage }
    ];
    setConversation(updatedConversation);
    
    // Clear input and show loading
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Call the OpenRouter API via our service
      const aiResponse = await aiService.sendMessage(updatedConversation);
      
      // Create bot message with the response
      const botResponse: Message = {
        id: messages.length + 2,
        content: aiResponse,
        sender: "bot",
        timestamp: new Date(),
        hasBeenRead: false // Initialize as not read
      };
      
      // Update conversation with bot response
      const newConversation: ChatMessage[] = [
        ...updatedConversation,
        { role: 'assistant' as const, content: aiResponse }
      ];
      setConversation(newConversation);
      
      // Update UI with bot response
      setMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Show error message if API fails
      const errorMessage: Message = {
        id: messages.length + 2,
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      // In a real app, you would handle file upload to server
      // For now, just acknowledge the file
      const fileMessage: Message = {
        id: messages.length + 1,
        content: `Attached file: ${file.name}`,
        sender: "user",
        timestamp: new Date(),
        fileInfo: {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)} KB`
        }
      };
      
      setMessages(prev => [...prev, fileMessage]);
      
      // Update conversation
      const fileConversation: ChatMessage[] = [
        ...conversation,
        { role: 'user' as const, content: `I'm attaching a file named ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB). Can you help me analyze it?` }
      ];
      setConversation(fileConversation);
      
      // Show loading indicator
      setIsLoading(true);
      
      // Send message to AI about the file
      setTimeout(async () => {
        try {
          const filePrompt = `The user has attached a file: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB).`;
          const updatedConvo: ChatMessage[] = [
            ...fileConversation,
            { role: 'user' as const, content: filePrompt }
          ];
          
          const aiResponse = await aiService.sendMessage(updatedConvo);
          
        const botResponse: Message = {
          id: messages.length + 2,
            content: aiResponse,
          sender: "bot",
            timestamp: new Date(),
            hasBeenRead: false
          };
          
          // Update conversation
          const newConvo: ChatMessage[] = [
            ...updatedConvo,
            { role: 'assistant' as const, content: aiResponse }
          ];
          setConversation(newConvo);
        
        setMessages(prev => [...prev, botResponse]);
          
        } catch (error) {
          console.error("Error handling file:", error);
          const errorMessage: Message = {
            id: messages.length + 2,
            content: "I'm sorry, I encountered an error processing your file. Please try again later.",
            sender: "bot",
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
        } finally {
        setIsLoading(false);
        }
      }, 1000);
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const resetConversation = () => {
    // Reset the conversation to initial state
    const initialMessage = {
      id: 1,
      content: "Hello! I'm your DiaFit AI assistant. I can help answer questions about diabetes management, nutrition, exercise, and healthy living. How can I assist you today?",
      sender: "bot",
      timestamp: new Date()
    };
    
    // If speaking, stop
    if (isSpeaking) {
      stopSpeech();
    }
    
    setMessages([initialMessage]);
    setConversation([
      { role: 'system' as const, content: aiService.getDiabetesSystemPrompt() },
      { role: 'assistant' as const, content: initialMessage.content }
    ]);
    
    // Reset speech recognition
    if (listening) {
      SpeechRecognition.stopListening();
    }
    resetTranscript();
    setInputMessage('');
  };

  // Show warning if browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    console.warn("Browser doesn't support speech recognition.");
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center">
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <Bot size={20} />
              </div>
              <h1 className="ml-2 text-lg font-semibold">DiaFit AI Assistant</h1>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={resetConversation}
              className="p-2 rounded-full hover:bg-gray-100 mr-2 flex items-center text-blue-600"
            >
              <RefreshCw size={18} className="mr-1" />
              <span className="text-sm">New Chat</span>
            </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreVertical size={20} />
          </button>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 messages-container">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-blue-500 ml-2' : 'bg-gray-300 mr-2'
                }`}>
                  {message.sender === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
                </div>
                <div>
                  <div 
                    className={`rounded-2xl px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                    }`}
                  >
                    {message.fileInfo ? (
                      <div className="flex items-center p-2 bg-gray-100 rounded mb-2">
                        <Paperclip size={16} className="text-gray-500 mr-2" />
                        <div className="text-sm">
                          <div className="font-medium">{message.fileInfo.name}</div>
                          <div className="text-gray-500">{message.fileInfo.size}</div>
                        </div>
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 flex items-center ${message.sender === 'user' ? 'justify-end' : 'justify-between'}`}>
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {message.sender === 'bot' && (
                      <button
                        onClick={() => {
                          // Make sure we stop any current speech first and clear the queue
                          stopSpeech();
                          
                          // Short delay to ensure previous speech is fully stopped
                          setTimeout(() => {
                            console.log('Starting speech for message:', message.id);
                            // Then speak this message
                            speakText(message.content);
                          }, 50);
                        }}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 text-blue-600"
                        title="Listen to this response"
                      >
                        <Volume2 size={14} className={isSpeaking ? "animate-pulse" : ""} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                  <Bot size={16} className="text-gray-600" />
                </div>
                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-200 px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 input-area">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {isListening && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <p className="text-sm text-blue-800">Listening... {transcript ? `"${transcript}"` : ""}</p>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-blue-700 hover:text-blue-900"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2">
            <button 
              type="button" 
              onClick={handleFileUpload}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button 
              type="button" 
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <Image size={20} />
            </button>
            <button 
              type="button" 
              onClick={toggleListening}
              className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Mic size={20} />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder={isListening ? "Listening..." : "Ask about diabetes, nutrition, exercise..."}
              className="flex-1 mx-2 py-2 px-3 outline-none"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading}
              className={`p-2 rounded-full ${inputMessage.trim() && !isLoading ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">
            I'm a healthcare AI assistant by DiaFit. My responses are for informational purposes only and should not replace professional medical advice.
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;