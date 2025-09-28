'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { aiAPI } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  generatedContent?: {
    platform: string;
    content: string;
    hashtags?: string[];
    mediaType?: 'text' | 'image' | 'video';
  };
}

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags?: string[];
  mediaType?: 'text' | 'image' | 'video';
}

const suggestedPrompts = [
  "Generate a tweet about a new product launch for my coffee shop",
  "Create a LinkedIn post about productivity tips for remote work",
  "Write an Instagram caption for a travel photo",
  "Draft a Facebook post about a company milestone",
  "Create content for a seasonal promotion"
];

export default function CreateContentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI content assistant. I can help you create engaging posts for any social media platform. What would you like to create today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call real AI API for content generation
      const response = await aiAPI.generateContent(userMessage.content, 'general');
      
      if (response.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Here\'s some great content for you! I\'ve crafted something engaging that should resonate well with your audience.',
          timestamp: new Date(),
          generatedContent: {
            platform: response.data.platform || 'General',
            content: response.data.content,
            hashtags: response.data.hashtags || [],
            mediaType: 'text'
          }
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(response.message || 'Failed to generate content');
      }
      
    } catch (error) {
      console.error('Error generating content:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleSaveAsDraft = (content: GeneratedContent | undefined) => {
    if (!content) return;
    // TODO: Implement save as draft functionality
    alert('Content saved as draft! (This would save to your drafts in a real app)');
  };

  const handleAddToCalendar = (content: GeneratedContent | undefined) => {
    if (!content) return;
    // TODO: Implement add to calendar functionality
    alert('Redirecting to calendar to schedule this post! (This would open the calendar in a real app)');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/Dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Create Content</h1>
              <p className="text-sm text-gray-400">AI-Powered Content Generation</p>
            </div>
          </div>
          <div className="text-2xl">🤖</div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  {message.type === 'ai' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-blue-400">🤖</span>
                      <span className="text-xs text-gray-400">AI Assistant</span>
                    </div>
                  )}
                  
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Generated Content Display */}
                  {message.generatedContent && (
                    <div className="mt-4 p-4 bg-gray-600 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-400 font-medium">
                          Generated for {message.generatedContent.platform}
                        </span>
                        <span className="text-xs text-gray-400">
                          {message.generatedContent.mediaType}
                        </span>
                      </div>
                      
                      <div className="bg-gray-800 p-3 rounded text-sm text-gray-100 mb-3">
                        {message.generatedContent.content}
                      </div>
                      
                      {message.generatedContent.hashtags && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">Suggested Hashtags:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.generatedContent.hashtags.map((tag, index) => (
                              <span key={index} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveAsDraft(message.generatedContent)}
                          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-xs hover:bg-gray-600 transition-colors"
                        >
                          💾 Save as Draft
                        </button>
                        <button
                          onClick={() => handleAddToCalendar(message.generatedContent)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          📅 Add to Calendar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs opacity-75 mt-2">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 bg-gray-700 text-gray-100 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-400">🤖</span>
                    <span className="text-xs text-gray-400">AI Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-300">Generating content...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (show when no messages or only initial message) */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-400 mb-3">💡 Try these prompts:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-xs bg-gray-700 text-gray-300 px-3 py-2 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex space-x-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what kind of content you'd like to create..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors self-end"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '📤'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}