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
  AccessTime
} from '@mui/icons-material'
import { Tabs, Tab, Box } from '@mui/material'

const SessionsList: React.FC = () => {
  const { theme } = useTheme()
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
  const [tutors, setTutors] = useState<{ [key: string]: any }>({})

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
        console.log('User from localStorage:', userStr)
        
        if (!userStr) {
          console.log('No user found, redirecting to login')
          navigate('/login')
          return
        }
        
        const user = JSON.parse(userStr)
        console.log('Parsed user:', user)
        console.log('User ID:', user.id || user.userId)
        
        const response = await api.sessions.list({ studentId: user.id || user.userId, limit: 1000 })
        console.log('API Response:', response)
        
        if (response.data && Array.isArray(response.data)) {
          console.log('Sessions found:', response.data.length)
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
        } else {
          console.log('No sessions data or not an array:', response)
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
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
          console.log('Enrollments found:', response.data.length)
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
              console.error(`Failed to load class ${classId}:`, err)
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
        console.error('Failed to load enrollments:', error)
      }
    }

    loadEnrollments()
  }, [])

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500',
      rescheduled: 'bg-orange-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
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
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled'
    }
    return labels[status] || status
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading sessions...
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
              onClick={() => navigate('/student')}
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
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/student')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => navigate('/student/book')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Event className="mr-3 w-4 h-4" />
                  Book New Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentTab === 0 ? 'My Sessions' : 'My Classes'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentTab === 0 
                ? `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} ${filter !== 'all' ? `(${getStatusLabel(filter)})` : ''}`
                : `${filteredEnrollments.length} class${filteredEnrollments.length !== 1 ? 'es' : ''} enrolled`
              }
            </p>
          </div>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', mb: 4 }}>
            <Tabs 
              value={currentTab} 
              onChange={(_: React.SyntheticEvent, newValue: number) => setCurrentTab(newValue)}
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
                  ? "You haven't booked any sessions yet."
                  : `No ${filter} sessions at the moment.`
                }
              </p>
              <button
                onClick={() => navigate('/student/book')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Book Your First Session
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/student/session/${session.id}`)}
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
                          {session.isOnline ? 'Video Call' : 'Physical Meeting'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Person className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Tutor
                        </p>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {tutors[session.tutorId]?.name || 'Loading...'}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {tutors[session.tutorId]?.email || session.tutorId}
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
              ))}
            </div>
            )
          ) : (
            /* Classes Grid */
            filteredEnrollments.length === 0 ? (
              <div className="text-center py-16">
                <ClassIcon className={`w-20 h-20 mx-auto mb-6 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No classes enrolled
                </h3>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  You haven't enrolled in any classes yet.
                </p>
                <button
                  onClick={() => navigate('/student/book')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Browse Classes
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEnrollments.map((enrollment) => {
                  const classData = classes[enrollment.classId]
                  if (!classData) return null

                  return (
                    <div
                      key={enrollment.id}
                      onClick={() => navigate(`/student/class/${enrollment.classId}`)}
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
                              enrollment.status === 'active' ? 'text-green-500' :
                              enrollment.status === 'completed' ? 'text-blue-500' :
                              'text-gray-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <ClassIcon className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {classData.code} - {classData.subject}
                              </h3>
                            </div>
                            {classData.description && (
                              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {classData.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {enrollment.status}
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
                              Every {classData.day.charAt(0).toUpperCase() + classData.day.slice(1)}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {classData.startTime} - {classData.endTime}
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
                              {classData.duration} minutes
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
                              {classData.currentEnrollment} / {classData.maxStudents}
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
                          {new Date(classData.semesterStart).toLocaleDateString('vi-VN')} - {new Date(classData.semesterEnd).toLocaleDateString('vi-VN')}
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
    </div>
  )
}

export default SessionsList
