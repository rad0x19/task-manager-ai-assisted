'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Minimize2, Send, MessageCircle, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { PlanProposal } from './PlanProposal';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  title: string | null;
  status: string;
  plan?: any;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [planProposal, setPlanProposal] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation?.id,
          content: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversation
      if (data.conversation) {
        setCurrentConversation({
          id: data.conversation.id,
          title: data.conversation.title,
          status: data.conversation.status,
          plan: data.conversation.plan,
        });
      }

      // Replace temp message with real one and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          {
            id: data.userMessage.id,
            role: 'USER' as const,
            content: data.userMessage.content,
            createdAt: data.userMessage.createdAt,
          },
          {
            id: data.aiMessage.id,
            role: 'ASSISTANT' as const,
            content: data.aiMessage.content,
            createdAt: data.aiMessage.createdAt,
            metadata: data.aiMessage.metadata,
          },
        ];
      });

      // Plan proposal is now handled via message metadata, but keep state for legacy support
      if (data.planProposal) {
        setPlanProposal(data.planProposal);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'ASSISTANT',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Open AI Chat Assistant"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        'bottom-6 right-6',
        'md:bottom-6 md:right-6',
        isMinimized ? 'h-16' : 'h-[600px]',
        'w-[calc(100vw-3rem)] md:w-[380px]',
        'max-h-[calc(100vh-3rem)]'
      )}
    >
      <Card className="h-full flex flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">
                    Start a conversation to create tasks and habits!
                  </p>
                </div>
              )}

              {messages.map((message) => {
                // Check if this message has a plan proposal in metadata
                const messagePlan = message.metadata?.planProposal;
                return (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                    {messagePlan && message.role === 'ASSISTANT' && (
                      <div className="mt-2">
                        <PlanProposal
                          plan={messagePlan}
                          conversationId={currentConversation?.id}
                          onApprove={() => {
                            // Remove plan from this message's metadata after approval
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === message.id
                                  ? { ...m, metadata: { ...m.metadata, planProposal: null } }
                                  : m
                              )
                            );
                          }}
                          onReject={() => {
                            // Remove plan from this message's metadata after rejection
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === message.id
                                  ? { ...m, metadata: { ...m.metadata, planProposal: null } }
                                  : m
                              )
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}

              {/* Legacy support for planProposal state (can be removed after testing) */}
              {planProposal && !messages.some(m => m.metadata?.planProposal) && (
                <PlanProposal
                  plan={planProposal}
                  conversationId={currentConversation?.id}
                  onApprove={() => setPlanProposal(null)}
                  onReject={() => setPlanProposal(null)}
                />
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
