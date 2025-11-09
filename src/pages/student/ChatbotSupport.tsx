import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Send, 
  SmartToy, 
  Person,
  School,
  Schedule,
  Quiz,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  Support as SupportIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'suggestion'
}

const ChatbotSupport: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI learning assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const quickActions = [
    { text: 'Help with homework', icon: <School />, action: 'homework' },
    { text: 'Schedule a session', icon: <Schedule />, action: 'schedule' },
    { text: 'Find a tutor', icon: <Person />, action: 'tutor' },
    { text: 'Study tips', icon: <Quiz />, action: 'tips' }
  ]

  const suggestions = [
    'How do I book a tutoring session?',
    'What subjects are available?',
    'How do I track my progress?',
    'Can I reschedule a session?',
    'How do I contact my tutor?'
  ]

  // Removed auto-scroll functionality

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('book') || lowerInput.includes('schedule')) {
      return 'To book a tutoring session, go to the "Book Session" page and follow these steps: 1) Select a tutor, 2) Choose date & time, 3) Fill session details, 4) Complete payment. Would you like me to guide you through any specific step?'
    }
    
    if (lowerInput.includes('subject') || lowerInput.includes('math') || lowerInput.includes('physics')) {
      return 'We offer tutoring in Mathematics, Physics, Chemistry, Biology, Computer Science, and English. You can search for tutors by subject on the "Search Tutors" page. What subject are you interested in?'
    }
    
    if (lowerInput.includes('progress') || lowerInput.includes('track')) {
      return 'You can view your learning progress on the "View Progress" page. It shows your overall progress, subject-wise performance, recent sessions, and achievements. Would you like to know more about any specific aspect?'
    }
    
    if (lowerInput.includes('reschedule') || lowerInput.includes('cancel')) {
      return 'To reschedule or cancel a session, go to your session details and click "Reschedule" or "Cancel". Please note that cancellations within 24 hours may incur a fee. Is there a specific session you need to modify?'
    }
    
    if (lowerInput.includes('contact') || lowerInput.includes('tutor')) {
      return 'You can contact your tutor through the messaging system in your session details, or by using the "Chat" feature during live sessions. Would you like help finding your tutor\'s contact information?'
    }
    
    return 'I understand you\'re looking for help. Could you be more specific about what you need assistance with? I can help with booking sessions, finding tutors, tracking progress, and more!'
  }

  const handleQuickAction = (action: string) => {
    let message = ''
    switch (action) {
      case 'homework':
        message = 'I need help with my homework'
        break
      case 'schedule':
        message = 'How do I schedule a session?'
        break
      case 'tutor':
        message = 'I want to find a tutor'
        break
      case 'tips':
        message = 'Give me some study tips'
        break
    }
    setInputText(message)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Sticky */}
        <div className={`w-full lg:w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} lg:block`}>
          <div className="p-6">
            {/* Logo */}
            <div 
              className="flex items-center mb-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/student')}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Chat Status */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                CHAT STATUS
              </h3>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    AI Assistant Online
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ready to help with your learning journey
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                QUICK ACTIONS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/student')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        AI Learning Assistant
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Get instant help with your learning journey
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Messages */}
            <div className="lg:col-span-2">
              <Card 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Chat with AI Assistant
                  </h3>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Online
                    </span>
                  </div>
                </div>

                {/* Messages Container */}
                <div className={`h-96 overflow-y-auto p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                {messages.map((message) => (
                    <div
                    key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`flex items-start max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${message.sender === 'user' ? 'ml-3 mr-0 bg-blue-600' : 'bg-gray-400'}`} style={{ minWidth: '32px', minHeight: '32px' }}>
                          {message.sender === 'user' ? <Person className="w-4 h-4 text-white" /> : <SmartToy className="w-4 h-4 text-white" />}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : `${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${theme === 'dark' ? 'border-gray-500' : 'border-gray-200'}`
                        }`}>
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center mr-3 flex-shrink-0" style={{ minWidth: '32px', minHeight: '32px' }}>
                          <SmartToy className="w-4 h-4 text-white" />
                        </div>
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${theme === 'dark' ? 'border-gray-500' : 'border-gray-200'}`}>
                          <p className="text-sm">AI is typing...</p>
                        </div>
                      </div>
                    </div>
                )}
                </div>

              {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className={`px-4 py-2 rounded-lg ${
                      inputText.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
          </Card>
            </div>

        {/* Quick Actions & Suggestions */}
            <div className="space-y-6">
              {/* Quick Actions */}
          <Card
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
              {quickActions.map((action, index) => (
                    <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <span className="mr-3">{action.icon}</span>
                  {action.text}
                    </button>
              ))}
                </div>
          </Card>

              {/* Common Questions */}
          <Card
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Common Questions
                </h3>
                <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                    <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <span className="text-sm">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Help & Support */}
              <Card 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Need More Help?
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/student/book')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <SupportIcon className="mr-3 w-4 h-4" />
                    Contact Support
                  </button>
                  <button 
                    onClick={() => navigate('/student/progress')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <BarChartIcon className="mr-3 w-4 h-4" />
                    View Progress
                  </button>
                </div>
          </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
                  </div>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    HCMUT
                  </span>
                </div>
                <button
                  onClick={handleDrawerToggle}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Chat Status */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  CHAT STATUS
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      AI Assistant Online
                    </span>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ready to help with your learning journey
                  </p>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/student/book')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CheckCircleIcon className="mr-3 w-4 h-4" />
                  Book Session
                </button>
                <button 
                  onClick={() => {
                    navigate('/student/search')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChartIcon className="mr-3 w-4 h-4" />
                  Find Tutors
                </button>
                <button 
                  onClick={() => {
                    navigate('/student/progress')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChartIcon className="mr-3 w-4 h-4" />
                  View Progress
                </button>
                <button 
                  onClick={() => {
                    navigate('/student')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatbotSupport
