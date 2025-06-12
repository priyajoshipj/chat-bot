'use client'

import { useState } from 'react'
import { AI_MODELS, tryNextModel, formatMessage, Message } from '@/utils/chat'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentModel, setCurrentModel] = useState(AI_MODELS[0])

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
      console.error(error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error with all available models. Please try again later.'
      }])
    } finally {
      setIsLoading(false)
      setInput('')
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
              disabled={isLoading}
            />
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
