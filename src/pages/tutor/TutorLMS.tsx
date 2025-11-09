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
  FilterList as FilterListIcon,
  CalendarToday,
  School,
  Event,
  Class as ClassIcon,
  Group as GroupIcon,
  AccessTime,
  Menu as MenuIcon
} from '@mui/icons-material'
import { Tabs, Tab, Box } from '@mui/material'

const TutorLMS: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Check URL params for initial tab
  const initialTab = searchParams.get('view') === 'classes' ? 1 : 0
  const [currentTab, setCurrentTab] = useState(initialTab) // 0: Sessions, 1: Classes
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [students, setStudents] = useState<{ [key: string]: any }>({})
  const [mobileOpen, setMobileOpen] = useState(false)

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
    const loadSessions = async () => {
      try {
        setLoading(true)
        const userStr = localStorage.getItem('user')
        
        if (!userStr) {
          navigate('/common/login')
          return
        }
        
        const user = JSON.parse(userStr)
        
        const response = await api.sessions.list({ tutorId: user.id || user.userId, limit: 1000 })
        
        if (response.data && Array.isArray(response.data)) {
          setSessions(response.data)
          
          // Collect all unique student IDs from sessions
          const sessionStudentIds = new Set<string>()
          response.data.forEach((s: any) => {
            if (s.studentIds && Array.isArray(s.studentIds)) {
              s.studentIds.forEach((id: string) => sessionStudentIds.add(id))
            } else if (s.studentId) {
              sessionStudentIds.add(s.studentId)
            }
          })
          
          // Load student data
          const studentPromises = Array.from(sessionStudentIds).map(async (studentId: string) => {
            try {
              const studentResponse = await api.users.get(studentId)
              if (studentResponse.success && studentResponse.data) {
                return { id: studentId, data: studentResponse.data }
              }
            } catch (err) {
              console.error(`Failed to load student ${studentId}:`, err)
            }
            return null
          })
          
          const studentResults = await Promise.all(studentPromises)
          const studentsMap: { [key: string]: any } = {}
          studentResults.forEach(result => {
            if (result) {
              studentsMap[result.id] = result.data
            }
          })
          setStudents(studentsMap)
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [navigate])

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) return
        
        const user = JSON.parse(userStr)
        const response = await api.classes.list({ tutorId: user.id || user.userId, limit: 1000 })
        
        if (response.success && response.data && Array.isArray(response.data)) {
          setClasses(response.data)
        }
      } catch (error) {
        console.error('Failed to load classes:', error)
      }
    }

    loadClasses()
  }, [])

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      active: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500',
      rescheduled: 'bg-orange-500',
      inactive: 'bg-gray-500',
      full: 'bg-orange-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <Cancel className="w-5 h-5 text-red-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      default:
        return <Pending className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled',
      inactive: 'Inactive',
      full: 'Full'
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

  const filteredClasses = classes.filter(classItem => {
    if (filter === 'all') return true
    return classItem.status === filter
  })

  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length
  }

  const classStats = {
    total: classes.length,
    active: classes.filter(c => c.status === 'active').length,
    full: classes.filter(c => c.status === 'full').length,
    inactive: classes.filter(c => c.status === 'inactive').length
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading LMS...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className={`w-full lg:w-64 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6">
            {/* Logo */}
            <div 
              className="flex items-center mb-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/tutor')}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Overview Stats */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Overview
              </h3>
              {currentTab === 0 ? (
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
              ) : (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Total Classes</span>
                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>{classStats.total}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                      <p className="text-xs text-green-500 font-medium">Active</p>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{classStats.active}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                      <p className="text-xs text-orange-500 font-medium">Full</p>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{classStats.full}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <FilterListIcon className="w-4 h-4 inline mr-1" />
                Filters
              </h3>
              <div className="space-y-2">
                {currentTab === 0 ? (
                  <>
                    <button
                      onClick={() => setFilter('all')}
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
                      onClick={() => setFilter('pending')}
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
                      onClick={() => setFilter('confirmed')}
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
                      onClick={() => setFilter('completed')}
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
                      onClick={() => setFilter('cancelled')}
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
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setFilter('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        filter === 'all'
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">All Classes</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === 'all'
                          ? 'bg-blue-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}>{classStats.total}</span>
                    </button>
                    <button
                      onClick={() => setFilter('active')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        filter === 'active'
                          ? 'bg-green-600 text-white'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">Active</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === 'active'
                          ? 'bg-green-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}>{classStats.active}</span>
                    </button>
                    <button
                      onClick={() => setFilter('full')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        filter === 'full'
                          ? 'bg-orange-600 text-white'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">Full</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === 'full'
                          ? 'bg-orange-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}>{classStats.full}</span>
                    </button>
                    <button
                      onClick={() => setFilter('inactive')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        filter === 'inactive'
                          ? 'bg-gray-600 text-white'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">Inactive</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filter === 'inactive'
                          ? 'bg-gray-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}>{classStats.inactive}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/tutor')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => navigate('/tutor/availability')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Event className="mr-3 w-4 h-4" />
                  Create New Class
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
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
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentTab === 0 ? 'My Sessions' : 'My Classes'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentTab === 0 
                ? `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} ${filter !== 'all' ? `(${getStatusLabel(filter)})` : ''}`
                : `${filteredClasses.length} class${filteredClasses.length !== 1 ? 'es' : ''} ${filter !== 'all' ? `(${getStatusLabel(filter)})` : ''}`
              }
            </p>
          </div>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', mb: 4 }}>
            <Tabs 
              value={currentTab} 
              onChange={(_: React.SyntheticEvent, newValue: number) => {
                setCurrentTab(newValue)
                setFilter('all') // Reset filter when switching tabs
                navigate(`/tutor/lms${newValue === 1 ? '?view=classes' : ''}`)
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
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab 
                icon={<ClassIcon sx={{ fontSize: 20 }} />} 
                label="Classes" 
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {currentTab === 0 ? (
            /* Sessions Grid */
            filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <Schedule className={`w-20 h-20 mx-auto mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                No sessions found
              </h3>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filter === 'all' 
                  ? "You don't have any sessions yet."
                  : `No ${filter} sessions at the moment.`
                }
              </p>
              <button
                onClick={() => navigate('/tutor/availability')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Your First Session
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                // Support both old studentId (string) and new studentIds (array)
                const studentIds = session.studentIds && Array.isArray(session.studentIds) 
                  ? session.studentIds 
                  : session.studentId 
                    ? [session.studentId] 
                    : []
                const firstStudent = studentIds.length > 0 ? students[studentIds[0]] : null
                const studentCount = studentIds.length

                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/tutor/session/${session.id}`)}
                    className={`p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start flex-1">
                        <div className="mr-4">
                          {getStatusIcon(session.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <School className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                            <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {session.subject}
                            </h3>
                          </div>
                          {session.topic && (
                            <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {session.topic}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        session.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        session.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {getStatusLabel(session.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start">
                        <CalendarToday className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Date & Time
                          </p>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(session.startTime)}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatTime(session.startTime)} • {session.duration} mins
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        {session.isOnline ? (
                          <VideoCall className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        ) : (
                          <LocationOn className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                        <div>
                          <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Format
                          </p>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {session.isOnline ? 'Online' : 'In-Person'}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {session.isOnline ? 'Video Call' : session.location || 'Physical Meeting'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Person className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Student{studentCount > 1 ? 's' : ''}
                          </p>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {studentCount > 1 
                              ? `${firstStudent?.name || 'Loading...'} + ${studentCount - 1} more`
                              : firstStudent?.name || 'Loading...'}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {studentCount} student{studentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Notes
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {session.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )
          ) : (
            /* Classes Grid */
            filteredClasses.length === 0 ? (
              <div className="text-center py-16">
                <ClassIcon className={`w-20 h-20 mx-auto mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No classes found
                </h3>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filter === 'all' 
                    ? "You don't have any classes yet."
                    : `No ${filter} classes at the moment.`
                  }
                </p>
                <button
                  onClick={() => navigate('/tutor/availability')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredClasses.map((classItem) => {
                  return (
                    <div
                      key={classItem.id}
                      onClick={() => navigate(`/tutor/class/${classItem.id}`)}
                      className={`p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                          : 'bg-white border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start flex-1">
                          <div className="mr-4">
                            <CheckCircle className={`w-5 h-5 ${
                              classItem.status === 'active' ? 'text-green-500' :
                              classItem.status === 'full' ? 'text-orange-500' :
                              'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <ClassIcon className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {classItem.code} - {classItem.subject}
                              </h3>
                            </div>
                            {classItem.description && (
                              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {classItem.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          classItem.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          classItem.status === 'full' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {getStatusLabel(classItem.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start">
                          <CalendarToday className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              Schedule
                            </p>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              Every {classItem.day.charAt(0).toUpperCase() + classItem.day.slice(1)}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {classItem.startTime} - {classItem.endTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <AccessTime className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              Duration
                            </p>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {classItem.duration || 90} minutes
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Per session
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <GroupIcon className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              Enrollment
                            </p>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {classItem.currentEnrollment || 0} / {classItem.maxStudents}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Students enrolled
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Semester
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {classItem.semesterStart ? new Date(classItem.semesterStart).toLocaleDateString('vi-VN') : 'N/A'} - {classItem.semesterEnd ? new Date(classItem.semesterEnd).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
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

              {/* Mobile Overview Stats */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Overview
                </h3>
                {currentTab === 0 ? (
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
                ) : (
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Total Classes</span>
                      <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>{classStats.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                        <p className="text-xs text-green-500 font-medium">Active</p>
                        <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{classStats.active}</p>
                      </div>
                      <div className={`text-center p-2 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                        <p className="text-xs text-orange-500 font-medium">Full</p>
                        <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{classStats.full}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Filters */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FilterListIcon className="w-4 h-4 inline mr-1" />
                  Filters
                </h3>
                <div className="space-y-2">
                  {currentTab === 0 ? (
                    <>
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
                    </>
                  ) : (
                    <>
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
                        <span className="text-sm font-medium">All Classes</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          filter === 'all'
                            ? 'bg-blue-500 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}>{classStats.total}</span>
                      </button>
                      <button
                        onClick={() => {
                          setFilter('active')
                          setMobileOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          filter === 'active'
                            ? 'bg-green-600 text-white'
                            : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm font-medium">Active</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          filter === 'active'
                            ? 'bg-green-500 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}>{classStats.active}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      navigate('/tutor')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                  >
                    <ArrowBackIcon className="mr-3 w-4 h-4" />
                    Back to Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/tutor/availability')
                      setMobileOpen(false)
                    }}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Event className="mr-3 w-4 h-4" />
                    Create New Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TutorLMS
