import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Rating,
  Avatar
} from '@mui/material'
import { 
  School, 
  Person,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  RateReview as RateReviewIcon,
  ThumbUpAlt as ThumbUpAltIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../lib/api'

const EvaluateSession: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null)
  const [overallRating, setOverallRating] = useState(0)
  const [tutorRating, setTutorRating] = useState(0)
  const [contentRating, setContentRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [recommend, setRecommend] = useState(false)
  const [improvements, setImprovements] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const loadSessionData = async () => {
      if (!id) {
        navigate('/student/evaluate')
        return
      }

      try {
        setLoading(true)
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          navigate('/login')
          return
        }
        
        const user = JSON.parse(userStr)
        
        // Fetch session details
        const sessionResponse = await api.sessions.get(id)
        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data)
          
          // Fetch tutor details
          const tutorResponse = await api.users.get(sessionResponse.data.tutorId)
          if (tutorResponse.success && tutorResponse.data) {
            setTutor(tutorResponse.data)
          }
          
          // Check if already evaluated
          const evaluationsResponse = await api.evaluations.list({
            sessionId: id,
            studentId: user.id || user.userId
          })
          
          if (evaluationsResponse.success && evaluationsResponse.data && evaluationsResponse.data.data.length > 0) {
            const evaluation = evaluationsResponse.data.data[0]
            setExistingEvaluation(evaluation)
            setOverallRating(evaluation.rating)
            setTutorRating(evaluation.aspects?.knowledge || 0)
            setContentRating(evaluation.aspects?.helpfulness || 0)
            setCommunicationRating(evaluation.aspects?.communication || 0)
            setFeedback(evaluation.comment || '')
            setRecommend(evaluation.recommend || false)
            setImprovements(evaluation.improvements || [])
            setIsSubmitted(true)
          }
        } else {
          console.error('Session not found')
          navigate('/student/evaluate')
        }
      } catch (error) {
        console.error('Failed to load session data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [id, navigate])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const improvementOptions = [
    'More practice problems',
    'Clearer explanations',
    'Better pacing',
    'More visual aids',
    'Interactive activities',
    'Homework assignments',
    'Follow-up materials'
  ]

  const handleImprovementChange = (improvement: string) => {
    setImprovements(prev => 
      prev.includes(improvement) 
        ? prev.filter(item => item !== improvement)
        : [...prev, improvement]
    )
  }

  const handleSubmit = async () => {
    if (!id || !session) return

    if (overallRating === 0) {
      alert('Please provide an overall rating before submitting.')
      return
    }

    try {
      setSubmitting(true)
      
      const evaluationData = {
        sessionId: id,
        rating: overallRating,
        comment: feedback,
        aspects: {
          knowledge: tutorRating,
          helpfulness: contentRating,
          communication: communicationRating,
          punctuality: 5 // default value
        },
        improvements: improvements,
        recommend: recommend
      }

      const response = await api.evaluations.create(evaluationData)

      if (response.success) {
        setIsSubmitted(true)
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/student/evaluate')
        }, 2000)
      } else {
        alert('Failed to submit evaluation: ' + (response.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to submit evaluation:', error)
      alert('Failed to submit evaluation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time
  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading session details...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !tutor) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Session not found
            </p>
            <Button 
              onClick={() => navigate('/student/evaluate')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
    )
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

            {/* Session Info */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                SESSION INFO
              </h3>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <Person className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tutor?.name || 'Loading...'}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {session.subject}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    📅 {new Date(session.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ⏰ {new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    📚 {session.topic}
                  </p>
                </div>
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
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {existingEvaluation ? 'Your Evaluation' : 'Evaluate Session'}
                  </h1>
                  {existingEvaluation && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Submitted
                    </span>
                  )}
                </div>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {existingEvaluation ? 'Review your submitted feedback' : 'Share your feedback about the tutoring session'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <RateReviewIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Session #{id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Session Summary */}
            <div>
          <Card
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Session Summary
                </h3>
                <div className="flex items-center mb-4">
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: getAvatarColor(tutor?.name || 'Unknown'),
                      fontSize: '1.125rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getInitials(tutor?.name || 'Unknown')}
                  </Avatar>
                  <div className="ml-3">
                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tutor?.name || 'Loading...'}
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {session.subject}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{new Date(session.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Time:</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Topic:</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{session.topic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{session.duration} mins</span>
                  </div>
                </div>
          </Card>
            </div>

        {/* Evaluation Form */}
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
                    Session Evaluation
                  </h3>
              <Button 
                onClick={existingEvaluation ? () => navigate('/student/evaluate') : handleSubmit}
                disabled={!existingEvaluation && overallRating === 0}
                style={{
                  backgroundColor: existingEvaluation ? '#10b981' : (overallRating > 0 ? '#2563eb' : (theme === 'dark' ? '#374151' : '#d1d5db')),
                  color: (existingEvaluation || overallRating > 0) ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: existingEvaluation ? '#10b981' : (overallRating > 0 ? '#2563eb' : (theme === 'dark' ? '#374151' : '#d1d5db')),
                  textTransform: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (existingEvaluation) {
                    e.currentTarget.style.backgroundColor = '#059669'
                  } else if (overallRating > 0) {
                    e.currentTarget.style.backgroundColor = '#1d4ed8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (existingEvaluation) {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  } else if (overallRating > 0) {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }
                }}
              >
                {existingEvaluation ? 'Back to Sessions' : 'Submit Evaluation'}
              </Button>
                </div>

                <div className="space-y-6">
              {/* Overall Rating */}
                  <div>
                    <h4 className={`text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Overall Session Rating
                    </h4>
                    <div className="flex items-center mb-4">
                  <Rating
                    value={overallRating}
                        onChange={(_, newValue) => setOverallRating(newValue || 0)}
                    size="large"
                        readOnly={!!existingEvaluation}
                        sx={{
                          '& .MuiRating-iconEmpty': {
                            color: theme === 'dark' ? '#6b7280' : '#d1d5db',
                          },
                          '& .MuiRating-iconFilled': {
                            color: '#fbbf24',
                          },
                          '& .MuiRating-iconHover': {
                            color: '#f59e0b',
                          }
                        }}
                  />
                      <span className={`ml-3 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {overallRating > 0 ? `${overallRating}/5` : 'Rate this session'}
                      </span>
                    </div>
                  </div>

              {/* Detailed Ratings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <Person className="w-4 h-4 text-blue-600 mr-2" />
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Tutor Performance
                        </span>
                      </div>
                <Rating
                  value={tutorRating}
                        onChange={(_, newValue) => setTutorRating(newValue || 0)}
                        readOnly={!!existingEvaluation}
                        sx={{
                          '& .MuiRating-iconEmpty': {
                            color: theme === 'dark' ? '#6b7280' : '#d1d5db',
                          },
                          '& .MuiRating-iconFilled': {
                            color: '#fbbf24',
                          },
                          '& .MuiRating-iconHover': {
                            color: '#f59e0b',
                          }
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <School className="w-4 h-4 text-blue-600 mr-2" />
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Content Quality
                        </span>
                      </div>
                <Rating
                  value={contentRating}
                        onChange={(_, newValue) => setContentRating(newValue || 0)}
                        readOnly={!!existingEvaluation}
                        sx={{
                          '& .MuiRating-iconEmpty': {
                            color: theme === 'dark' ? '#6b7280' : '#d1d5db',
                          },
                          '& .MuiRating-iconFilled': {
                            color: '#fbbf24',
                          },
                          '& .MuiRating-iconHover': {
                            color: '#f59e0b',
                          }
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <ThumbUpAltIcon className="w-4 h-4 text-blue-600 mr-2" />
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Communication
                        </span>
                      </div>
                <Rating
                  value={communicationRating}
                        onChange={(_, newValue) => setCommunicationRating(newValue || 0)}
                        readOnly={!!existingEvaluation}
                        sx={{
                          '& .MuiRating-iconEmpty': {
                            color: theme === 'dark' ? '#6b7280' : '#d1d5db',
                          },
                          '& .MuiRating-iconFilled': {
                            color: '#fbbf24',
                          },
                          '& .MuiRating-iconHover': {
                            color: '#f59e0b',
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      checked={recommend}
                      onChange={(e) => setRecommend(e.target.checked)}
                        disabled={!!existingEvaluation}
                        className="w-4 h-4 text-blue-600 rounded mr-2"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Would you recommend this tutor?
                      </span>
                    </div>
                  </div>

              {/* Feedback */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Additional Comments
                    </label>
                    <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts about the session..."
                      rows={4}
                      readOnly={!!existingEvaluation}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${existingEvaluation ? 'cursor-not-allowed opacity-75' : ''}`}
                    />
                  </div>

              {/* Improvements */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  What could be improved? (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                  {improvementOptions.map((option) => (
                        <button
                      key={option}
                      onClick={() => !existingEvaluation && handleImprovementChange(option)}
                          disabled={!!existingEvaluation}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            improvements.includes(option)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : theme === 'dark'
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          } ${existingEvaluation ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
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

              {/* Mobile Session Info */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  SESSION INFO
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <Person className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {tutor?.name || 'Loading...'}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {session.subject}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📅 {new Date(session.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      ⏰ {new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📚 {session.topic}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
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
                    navigate('/student/book')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CheckCircleIcon className="mr-3 w-4 h-4" />
                  Book Another Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluateSession
