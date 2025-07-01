'use client'

import { useState, useRef, useEffect } from 'react'
import { AI_MODELS, tryNextModel, formatMessage, Message } from '@/utils/chat'

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentModel, setCurrentModel] = useState(AI_MODELS[0])
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseInputRef = useRef<string>('')
  const finalTranscriptRef = useRef<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setIsLoading(true)

    try {
      const response = await tryNextModel(input, messages, 0, setCurrentModel)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error with all available models. Please try again later.'
      }])
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    autoResize(e.target)
  }

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current)
    }
  }, [input])

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          // Update textarea with base input + final transcript + interim transcript
          const fullText = baseInputRef.current + finalTranscriptRef.current + interimTranscript
          setInput(fullText.trim())

          // Auto-resize textarea
          if (textareaRef.current) {
            autoResize(textareaRef.current)
          }
        }

        recognitionRef.current.onstart = () => {
          // Store the current input as base when starting
          baseInputRef.current = input + (input ? ' ' : '')
          finalTranscriptRef.current = ''
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          // Ensure final result is saved
          if (finalTranscriptRef.current) {
            setInput(prev => (baseInputRef.current + finalTranscriptRef.current).trim())
          }
        }
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Initialize refs before starting
      baseInputRef.current = input + (input ? ' ' : '')
      finalTranscriptRef.current = ''
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const renderMessage = (content: string) => {
    const formatted = formatMessage(content);
    if (Array.isArray(formatted)) {
      return (
        <div>
          {formatted.map((line, index) => {
            const isNumberedItem = /^\d+\./.test(line);
            if (isNumberedItem) {
              return (
                <li key={index} className="list-item">
                  {line}
                </li>
              );
            } else if (line === '') {
              return <br key={index} />;
            } else {
              return <p key={index}>{line}</p>;
            }
          })}
        </div>
      );
    }
    return content;
  };

  return (
    <main>
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="avatar">
            <span className="emoji">🤖</span>
          </div>
          <div className="header-text">
            <h1>AI Assistant - Your Personalized ChatGPT-like Experience</h1>
            <p>Using: {currentModel.split('/')[0]}</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'message-user' : 'message-bot'}`}
            >
              {message.role === 'assistant' ? renderMessage(message.content) : message.content}
            </div>
          ))}
          {isLoading && (
            <div className="message message-bot">
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or use voice... (Press Enter to send, Shift+Enter for new line)"
                className="chat-input"
                disabled={isLoading}
                rows={1}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`voice-button ${isListening ? 'listening' : ''}`}
                  disabled={isLoading}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  )}
                </button>
              )}
            </div>
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || !input.trim()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
