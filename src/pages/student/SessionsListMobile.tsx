import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import { 
  Schedule, 
  Person, 
  VideoCall,
  LocationOn,
  CheckCircle,
  Cancel,
  Pending,
  ArrowBack as ArrowBackIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  CalendarToday,
  School,
  Event,
  Dashboard as DashboardIcon,
  PersonSearch,
  Class,
  Class as ClassIcon,
  SmartToy as SmartToyIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Star,
  Group as GroupIcon,
  AccessTime
} from '@mui/icons-material'
import { Tabs, Tab, Box } from '@mui/material'

const SessionsListMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Check URL params for initial tab
  const initialTab = searchParams.get('view') === 'classes' ? 1 : 0
  const [currentTab, setCurrentTab] = useState(initialTab) // 0: Sessions, 1: Classes
  const [sessions, setSessions] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [classes, setClasses] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tutors, setTutors] = useState<{ [key: string]: any }>({})
  const [activeMenu, setActiveMenu] = useState('session-detail')

  // Sync tab with URL params
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'classes') {
      setCurrentTab(1)
    } else {
      setCurrentTab(0)
    }
  }, [searchParams])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
    { id: 'evaluate-session', label: 'Evaluate Session', icon: <Star />, path: '/student/evaluate' },
    { id: 'session-detail', label: 'Session Details', icon: <Class />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' }
  ]

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        const userStr = localStorage.getItem('user')
        console.log('[Mobile] User from localStorage:', userStr)
        
        if (!userStr) {
          console.log('[Mobile] No user found, redirecting to login')
          navigate('/login')
          return
        }
        
        const user = JSON.parse(userStr)
        console.log('[Mobile] Parsed user:', user)
        console.log('[Mobile] User ID:', user.id || user.userId)
        
        const response = await api.sessions.list({ studentId: user.id || user.userId, limit: 1000 })
        console.log('[Mobile] API Response:', response)
        
        if (response.data && Array.isArray(response.data)) {
          console.log('[Mobile] Sessions found:', response.data.length)
          setSessions(response.data)
          
          // Load tutor data for each session
          const uniqueTutorIds = [...new Set(response.data.map((s: any) => s.tutorId))] as string[]
          const tutorPromises = uniqueTutorIds.map(async (tutorId: string) => {
            try {
              const tutorResponse = await api.users.get(tutorId)
              if (tutorResponse.success && tutorResponse.data) {
                return { id: tutorId, data: tutorResponse.data }
              }
            } catch (err) {
              console.error(`[Mobile] Failed to load tutor ${tutorId}:`, err)
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
        } else {
          console.log('[Mobile] No sessions data or not an array:', response)
        }
      } catch (error) {
        console.error('[Mobile] Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [navigate])

  // Load enrolled classes
  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) return
        
        const user = JSON.parse(userStr)
        const response = await api.enrollments.list({ studentId: user.id || user.userId })
        
        if (response.success && response.data && Array.isArray(response.data)) {
          console.log('[Mobile] Enrollments found:', response.data.length)
          setEnrollments(response.data)
          
          // Load class details for each enrollment
          const uniqueClassIds = [...new Set(response.data.map((e: any) => e.classId))] as string[]
          const classPromises = uniqueClassIds.map(async (classId: string) => {
            try {
              const classResponse = await api.classes.get(classId)
              if (classResponse.success && classResponse.data) {
                return { id: classId, data: classResponse.data }
              }
            } catch (err) {
              console.error(`[Mobile] Failed to load class ${classId}:`, err)
            }
            return null
          })
          
          const classResults = await Promise.all(classPromises)
          const classesMap: { [key: string]: any } = {}
          classResults.forEach(result => {
            if (result) {
              classesMap[result.id] = result.data
            }
          })
          setClasses(classesMap)
        }
      } catch (error) {
        console.error('[Mobile] Failed to load enrollments:', error)
      }
    }

    loadEnrollments()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <Cancel className="w-4 h-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Pending className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled'
    }
    return labels[status] || status
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status === filter
  })

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true
    return enrollment.status === filter
  })

  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length
  }

  const classStats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading sessions...
          </p>
        </div>
      </div>
    )
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
                {currentTab === 0 ? 'My Sessions' : 'My Classes'}
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentTab === 0 
                  ? `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''}`
                  : `${filteredEnrollments.length} class${filteredEnrollments.length !== 1 ? 'es' : ''} enrolled`
                }
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

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_: React.SyntheticEvent, newValue: number) => {
              setCurrentTab(newValue)
              navigate(newValue === 0 ? '/student/session' : '/student/session?view=classes', { replace: true })
            }}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                color: theme === 'dark' ? '#9ca3af' : 'inherit',
                '&.Mui-selected': {
                  color: theme === 'dark' ? '#3b82f6' : 'primary.main'
                }
              }
            }}
          >
            <Tab 
              icon={<Schedule sx={{ fontSize: 20 }} />} 
              label="Sessions" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
            />
            <Tab 
              icon={<ClassIcon sx={{ fontSize: 20 }} />} 
              label="Classes" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
            />
          </Tabs>
        </Box>
      </div>

      {/* Quick Stats */}
      <div className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentTab === 0 ? stats.total : classStats.total}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-xs mb-1 text-green-500`}>
              {currentTab === 0 ? 'Confirmed' : 'Active'}
            </p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentTab === 0 ? stats.confirmed : classStats.active}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4">
        {/* Tab Content */}
        {currentTab === 0 ? (
          /* Sessions List */
          filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Schedule className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No sessions found
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'all' 
                ? "You haven't booked any sessions yet."
                : `No ${filter} sessions at the moment.`
              }
            </p>
            <button
              onClick={() => navigate('/student/book')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Book Your First Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/student/session/${session.id}`)}
                className={`p-4 rounded-lg border active:scale-98 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    {getStatusIcon(session.status)}
                    <h3 className={`text-base font-semibold ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {session.subject}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    session.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    session.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    session.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>

                {session.topic && (
                  <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {session.topic}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarToday className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(session.startTime)} • {formatTime(session.startTime)}
                    </p>
                  </div>

                  <div className="flex items-center">
                    {session.isOnline ? (
                      <VideoCall className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    ) : (
                      <LocationOn className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {session.isOnline ? 'Online' : 'In-Person'} • {session.duration} mins
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        ) : (
          /* Classes List */
          filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <ClassIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                No classes enrolled
              </h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                You haven't enrolled in any classes yet.
              </p>
              <button
                onClick={() => navigate('/student/book')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                Browse Classes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnrollments.map((enrollment) => {
                const classData = classes[enrollment.classId]
                if (!classData) return null

                return (
                  <div
                    key={enrollment.id}
                    onClick={() => navigate(`/student/class/${enrollment.classId}`)}
                    className={`p-4 rounded-lg border active:scale-98 transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <CheckCircle className={`w-4 h-4 mr-2 ${
                          enrollment.status === 'active' ? 'text-green-500' :
                          enrollment.status === 'completed' ? 'text-blue-500' :
                          'text-gray-500'
                        }`} />
                        <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {classData.code} - {classData.subject}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>

                    {classData.description && (
                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {classData.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CalendarToday className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Every {classData.day.charAt(0).toUpperCase() + classData.day.slice(1)} • {classData.startTime} - {classData.endTime}
                        </p>
                      </div>

                      <div className="flex items-center">
                        <AccessTime className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {classData.duration} minutes per session
                        </p>
                      </div>

                      <div className="flex items-center">
                        <GroupIcon className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {classData.currentEnrollment} / {classData.maxStudents} students enrolled
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
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

              {/* Overview */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Overview
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Total Sessions</span>
                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>{stats.total}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                      <p className="text-xs text-green-500 font-medium">Confirmed</p>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.confirmed}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                      <p className="text-xs text-yellow-500 font-medium">Pending</p>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.pending}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FilterListIcon className="w-4 h-4 inline mr-1" />
                  Filters
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setFilter('all')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">All Sessions</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === 'all'
                        ? 'bg-blue-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{stats.total}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter('pending')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      filter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">Pending</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{stats.pending}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter('confirmed')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      filter === 'confirmed'
                        ? 'bg-green-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">Confirmed</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === 'confirmed'
                        ? 'bg-green-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{stats.confirmed}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter('completed')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      filter === 'completed'
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">Completed</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === 'completed'
                        ? 'bg-blue-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{stats.completed}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter('cancelled')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      filter === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">Cancelled</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === 'cancelled'
                        ? 'bg-red-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>{stats.cancelled}</span>
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

export default SessionsListMobile
