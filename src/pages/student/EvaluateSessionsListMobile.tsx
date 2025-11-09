import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@mui/material'
import { 
  School,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  RateReview as RateReviewIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationOnIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Dashboard as DashboardIcon,
  PersonSearch,
  Class,
  SmartToy as SmartToyIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../lib/api'

const EvaluateSessionsListMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('pending')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('evaluate-session')
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [tutors, setTutors] = useState<{ [key: string]: any }>({})
  const [evaluations, setEvaluations] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          navigate('/login')
          return
        }
        
        const user = JSON.parse(userStr)
        
        // Fetch completed sessions
        const sessionsResponse = await api.sessions.list({ 
          studentId: user.id || user.userId, 
          status: 'completed',
          limit: 1000
        })
        
        if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
          setSessions(sessionsResponse.data)
          
          // Fetch tutors for each session
          const uniqueTutorIds = [...new Set(sessionsResponse.data.map((s: any) => s.tutorId))] as string[]
          const tutorPromises = uniqueTutorIds.map(async (tutorId: string) => {
            try {
              const tutorResponse = await api.users.get(tutorId)
              if (tutorResponse.success && tutorResponse.data) {
                return { id: tutorId, data: tutorResponse.data }
              }
            } catch (err) {
              console.error(`Failed to load tutor ${tutorId}:`, err)
            }
            return null
          })
          
          const tutorResults = await Promise.all(tutorPromises)
          const tutorsMap: { [key: string]: any } = {}
          tutorResults.forEach(result => {
            if (result) {
              tutorsMap[result.id] = result.data
            }
          })
          setTutors(tutorsMap)
          
          // Fetch evaluations for this student
          const evaluationsResponse = await api.evaluations.list({
            studentId: user.id || user.userId,
            limit: 1000
          })
          
          if (evaluationsResponse.success && evaluationsResponse.data) {
            const evaluationsMap: { [key: string]: any } = {}
            evaluationsResponse.data.data.forEach((evaluation: any) => {
              evaluationsMap[evaluation.sessionId] = evaluation
            })
            setEvaluations(evaluationsMap)
          }
        }
      } catch (error) {
        console.error('Failed to load evaluate sessions data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    if (item.path) {
      navigate(item.path)
    }
    setMobileOpen(false)
  }

  const handleThemeToggle = () => {
    toggleTheme()
  }

  // Menu items for navigation
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { id: 'search-tutors', label: 'Find Tutors', icon: <PersonSearch />, path: '/student/search' },
    { id: 'book-session', label: 'Book Session', icon: <School />, path: '/student/book' },
    { id: 'view-progress', label: 'View Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { id: 'evaluate-session', label: 'Evaluate Session', icon: <StarIcon />, path: '/student/evaluate' },
    { id: 'session-detail', label: 'Session Details', icon: <Class />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' }
  ]

  // Filter sessions based on evaluation status
  const filteredSessions = sessions.filter(session => {
    const hasEvaluation = !!evaluations[session.id]
    if (filterStatus === 'evaluated') return hasEvaluation
    if (filterStatus === 'pending') return !hasEvaluation
    return true
  })

  // Calculate stats
  const stats = {
    total: sessions.length,
    evaluated: Object.keys(evaluations).length,
    pending: sessions.length - Object.keys(evaluations).length
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/student')}
              className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowBackIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Evaluate Sessions
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Rate your completed sessions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : <DarkModeIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading sessions...
              </p>
            </div>
          </div>
        ) : (
        <>
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.total}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total
            </div>
          </div>
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.evaluated}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Evaluated
            </div>
          </div>
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-yellow-50'}`}>
            <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.pending}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Pending
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className={`flex items-center space-x-2 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} inline-flex min-w-full`}>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-1 ${
                filterStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('evaluated')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-1 ${
                filterStatus === 'evaluated'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Done ({stats.evaluated})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-1 ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({stats.total})
            </button>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <RateReviewIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No Sessions Found
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {filterStatus === 'pending' && 'All sessions have been evaluated!'}
              {filterStatus === 'evaluated' && 'No evaluations yet.'}
              {filterStatus === 'all' && 'No completed sessions available.'}
            </p>
            <Button 
              onClick={() => navigate('/student')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const tutor = tutors[session.tutorId]
              const evaluation = evaluations[session.id]
              const hasEvaluation = !!evaluation
              
              return (
              <Card
                key={session.id}
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} transition-all duration-200`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
                onClick={() => navigate(`/student/evaluate/${session.id}`)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1">
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: getAvatarColor(tutor?.name || 'Unknown'),
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          mr: 1.5
                        }}
                      >
                        {getInitials(tutor?.name || 'Unknown')}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {tutor?.name || 'Loading...'}
                        </h3>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {session.subject}
                        </p>
                      </div>
                    </div>
                    {hasEvaluation ? (
                      <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Done</span>
                      </div>
                    ) : (
                      <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        <RateReviewIcon className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                    )}
                  </div>

                  {/* Topic */}
                  <div className="mb-3">
                    <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {session.topic || session.subject}
                    </h4>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center text-xs">
                      <CalendarTodayIcon className={`w-3.5 h-3.5 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatDate(session.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <AccessTimeIcon className={`w-3.5 h-3.5 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatTime(session.startTime, session.endTime)} ({session.duration} mins)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {session.isOnline ? (
                        <>
                          <VideoCallIcon className={`w-3.5 h-3.5 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Online Session
                          </span>
                        </>
                      ) : (
                        <>
                          <LocationOnIcon className={`w-3.5 h-3.5 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {session.location || 'In-Person'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Evaluation Status */}
                  {hasEvaluation && evaluation ? (
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Your Rating:
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < evaluation.rating
                                  ? 'text-yellow-400'
                                  : theme === 'dark'
                                    ? 'text-gray-600'
                                    : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Button */}
                  <Button
                    className={`w-full ${
                      hasEvaluation
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white text-sm py-2`}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/student/evaluate/${session.id}`)
                    }}
                  >
                    {hasEvaluation ? 'View Evaluation' : 'Evaluate Session'}
                  </Button>
                </div>
              </Card>
              )
            })}
          </div>
        )}
        </>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6 h-full flex flex-col overflow-hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div 
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/student')}
                >
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
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Quick Actions - Moved to top */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    QUICK ACTIONS
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        navigate('/student')
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                    >
                      <ArrowBackIcon className="mr-3 w-4 h-4" />
                      Back to Dashboard
                    </button>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-2 mb-8">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                        activeMenu === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluateSessionsListMobile

