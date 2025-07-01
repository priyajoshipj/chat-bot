'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AI_MODELS, tryNextModel, formatMessage, Message } from '@/utils/chat'

// Type declarations for Speech Recognition API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today? I can chat with you or generate images - just ask me to "generate an image" or "create an image" followed by your description!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentModel, setCurrentModel] = useState(AI_MODELS[0])
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const baseInputRef = useRef<string>('')
  const finalTranscriptRef = useRef<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Check if user wants to generate an image
      if (isImageRequest(userMessage)) {
        const imagePrompt = extractImagePrompt(userMessage)

        // Add loading message for image generation
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎨 Generating image for: "${imagePrompt}"`
        }])

        try {
          const imageBlob = await generateImage(imagePrompt)
          const imageUrl = URL.createObjectURL(imageBlob)

          // Replace loading message with image
          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: `Here's your generated image for "${imagePrompt}":`,
              imageUrl: imageUrl,
              imagePrompt: imagePrompt
            }
            return newMessages
          })
        } catch {
          // Replace loading message with error
          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: 'Sorry, I failed to generate the image. Please try again with a different prompt.'
            }
            return newMessages
          })
        }
      } else {
        // Normal chat functionality
        const response = await tryNextModel(userMessage, messages, 0, setCurrentModel)

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.'
      }])
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent
      handleSubmit(formEvent)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    autoResize(e.target)
  }

  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current)
    }
  }, [input, autoResize])

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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
          // finalTranscriptRef will be set when starting listening
          finalTranscriptRef.current = ''
        }

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          // Ensure final result is saved
          if (finalTranscriptRef.current) {
            setInput(() => (baseInputRef.current + finalTranscriptRef.current).trim())
          }
        }
      }
    }
  }, [autoResize])

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

  // Image generation function
  const generateImage = async (prompt: string) => {
    const HF_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN

    try {
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({ inputs: prompt }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Error generating image:', error)
      throw error
    }
  }

  // Check if user wants to generate an image
  const isImageRequest = (text: string): boolean => {
    const imageKeywords = [
      'generate an image', 'create an image', 'make an image', 'draw an image',
      'generate image', 'create image', 'make image', 'draw image',
      'image of', 'picture of', 'photo of', 'illustration of',
      'show me an image', 'show me a picture', 'visualize'
    ]

    const lowerText = text.toLowerCase()
    return imageKeywords.some(keyword => lowerText.includes(keyword))
  }

  // Extract image prompt from user input
  const extractImagePrompt = (text: string): string => {
    const lowerText = text.toLowerCase()

    // Remove common prefixes
    const prefixes = [
      'generate an image of', 'create an image of', 'make an image of', 'draw an image of',
      'generate image of', 'create image of', 'make image of', 'draw image of',
      'generate an image', 'create an image', 'make an image', 'draw an image',
      'generate image', 'create image', 'make image', 'draw image',
      'show me an image of', 'show me a picture of', 'visualize',
      'image of', 'picture of', 'photo of', 'illustration of'
    ]

    let prompt = text
    for (const prefix of prefixes) {
      if (lowerText.startsWith(prefix)) {
        prompt = text.substring(prefix.length).trim()
        break
      }
      if (lowerText.includes(prefix)) {
        const index = lowerText.indexOf(prefix)
        prompt = text.substring(index + prefix.length).trim()
        break
      }
    }

    return prompt || text
  }

  const renderMessage = (message: Message) => {
    const { content, imageUrl, imagePrompt } = message;

    // If message has an image, render it
    if (imageUrl) {
      return (
        <div>
          <p>{content}</p>
          <div className="image-container">
            <Image
              src={imageUrl}
              alt={imagePrompt || 'Generated image'}
              className="generated-image"
              width={400}
              height={400}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '400px' }}
            />
            <div className="image-actions">
              <a
                href={imageUrl}
                download={`generated-image-${Date.now()}.png`}
                className="download-button"
              >
                📥 Download Image
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Regular text message formatting
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
              {message.role === 'assistant' ? renderMessage(message) : message.content}
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
