import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';


import { toast } from 'sonner';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

interface AISearchAssistantProps {
  onSearchSuggestion?: (query: string, location?: string) => void;
  onClose?: () => void;
}

export function AISearchAssistant({ onSearchSuggestion, onClose }: AISearchAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI restaurant assistant 🍽️ I can help you find the perfect restaurant based on your mood, occasion, dietary preferences, or any specific craving. What are you in the mood for today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition failed. Please try again.');
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if user is asking for real-time info
      const isRealTimeQuery = currentMessage.toLowerCase().includes('current') || 
                             currentMessage.toLowerCase().includes('hours') || 
                             currentMessage.toLowerCase().includes('open') ||
                             currentMessage.toLowerCase().includes('latest') ||
                             currentMessage.toLowerCase().includes('recent') ||
                             currentMessage.toLowerCase().includes('now');

      let aiMessage: Message;

      if (isRealTimeQuery) {
        // Use Perplexity for real-time information
        const { data: perplexityData, error: perplexityError } = await supabase.functions.invoke('perplexity-restaurant-info', {
          body: {
            restaurantName: 'restaurants',
            city: 'current location',
            infoType: 'custom',
            additionalContext: currentMessage
          }
        });

        if (!perplexityError && perplexityData) {
          aiMessage = {
            id: Date.now().toString() + '-ai-perplexity',
            type: 'ai',
            content: `🌐 **Real-time Information (Powered by Perplexity):**\n\n${perplexityData.generatedInfo}`,
            suggestions: ['Find restaurants near me', 'Current restaurant hours', 'Popular restaurants now'],
            timestamp: new Date()
          };
        } else {
          throw new Error('Perplexity lookup failed');
        }
      } else {
        // Use OpenAI for general assistance
        const { data, error } = await supabase.functions.invoke('ai-restaurant-assistant', {
          body: {
            message: currentMessage,
            context: 'restaurant search',
            userPreferences: {}
          }
        });

        if (error) throw error;

        aiMessage = {
          id: Date.now().toString() + '-ai-openai',
          type: 'ai',
          content: `🤖 ${data.response}`,
          suggestions: data.suggestions || [],
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast.error('Unable to get AI response. Please try again.');
      
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        type: 'ai',
        content: "Sorry, I'm having trouble right now. Try searching for restaurants directly using the search bar above!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSearchSuggestion) {
      onSearchSuggestion(suggestion);
      onClose?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MIcon name="smart_toy" className="text-base text-primary" />
            AI Restaurant Assistant
            <MIcon name="auto_awesome" className="text-sm text-secondary" />
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {message.type === 'user' ? <MIcon name="person" className="text-sm" /> : <MIcon name="smart_toy" className="text-sm" />}
                  </div>
                  <div className="space-y-2">
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Try searching for:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <MIcon name="smart_toy" className="text-sm" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what you're craving..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                  isListening ? 'text-destructive' : 'text-muted-foreground'
                }`}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MIcon name="mic_off" className="text-sm" /> : <MIcon name="mic" className="text-sm" />}
              </Button>
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <MIcon name="send" className="text-sm" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-destructive/50 rounded-full animate-pulse"></div>
              Listening... Speak now
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}