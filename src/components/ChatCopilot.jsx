import { useState, useRef, useEffect } from 'react';
import './ChatCopilot.css';

export default function ChatCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isDarkBg, setIsDarkBg] = useState(true);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Listen for scroll to adapt button theme
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Threshold: 300px - above = dark bg (hero), below = light bg
      // Adjust threshold based on your hero section height
      const isDark = currentScrollY < 300;
      setIsDarkBg(isDark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const callOpenRouter = async (userMessage) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OpenRouter API key not found. Add VITE_OPENROUTER_API_KEY to .env');
      return 'API key not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.';
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are TourWeave AI, a helpful travel assistant for exploring India. Provide concise, friendly responses about Indian destinations, travel tips, and cultural insights. Keep responses brief and engaging.',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from API');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Get AI response
    const aiResponse = await callOpenRouter(userMessage);
    setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    setIsLoading(false);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-copilot-container">
      {/* Floating Action Button */}
      <button
        className={`chat-fab ${isOpen ? 'active' : ''} ${isDarkBg ? 'dark-bg' : 'light-bg'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open TourWeave AI Chat"
        title="Chat with TourWeave AI"
      >
        <span className="fab-text">TW</span>
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="chat-popup-wrapper">
          <div className="chat-popup">
            {/* Header */}
            <div className="chat-header">
              <div className="header-content">
                <div className="header-indicator"></div>
                <h3>TourWeave AI Copilot</h3>
              </div>
              <button
                className="chat-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

          {/* Messages Container */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p className="welcome-emoji">👋</p>
                <p className="welcome-title">Hi! I'm TourWeave AI</p>
                <p className="welcome-subtitle">Ask me about hidden gems, travel tips, cultural insights...</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant">
                <div className="message-content typing-message">
                  <span className="typing-text">TourWeave AI is typing</span>
                  <span className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask about travel, hidden gems..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
