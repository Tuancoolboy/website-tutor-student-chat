import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import { 
  Typography, 
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tabs,
  Tab,
  Box
} from '@mui/material'
import { 
  VideoCall, 
  Chat, 
  Schedule,
  Person,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Class as ClassIcon,
  Grade as GradeIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  NavigateNext as NavigateNextIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import CourseTab from '../../components/session/CourseTab'
import GradesTab from '../../components/session/GradesTab'
import CompetenciesTab from '../../components/session/CompetenciesTab'

const TutorSessionDetail: React.FC = () => {
  const { id } = useParams()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  
  // Detect if viewing class or session
  const isClassView = location.pathname.includes('/class/')
  
  // Backend data states
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [classData, setClassData] = useState<any>(null)
  const [mySessions, setMySessions] = useState<any[]>([])
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

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

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
    }
  }, [])

  // Handle tab from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      const tabIndex = parseInt(tabParam)
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setCurrentTab(tabIndex)
      }
    }
  }, [location.search])

  // Load tutor's sessions and classes list
  useEffect(() => {
    const loadMyData = async () => {
      try {
        setSessionsLoading(true)
        const userStr = localStorage.getItem('user')
        if (!userStr) return
        
        const user = JSON.parse(userStr)
        const tutorId = user.id || user.userId
        
        // Load sessions
        const sessionsResponse = await api.sessions.list({ tutorId, limit: 1000 })
        if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
          setMySessions(sessionsResponse.data)
        }
        
        // Load classes
        const classesResponse = await api.classes.list({ tutorId, limit: 1000 })
        if (classesResponse.success && classesResponse.data && Array.isArray(classesResponse.data)) {
          setMyClasses(classesResponse.data)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setSessionsLoading(false)
      }
    }

    loadMyData()
  }, [])

  // Load session or class data
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        console.log('No ID provided')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        if (isClassView) {
          // Load class data
          const classResponse = await api.classes.get(id)
          if (classResponse.success && classResponse.data) {
            setClassData(classResponse.data)
          }
        } else {
          // Load session data
          const sessionResponse = await api.sessions.get(id)
          if (sessionResponse.success && sessionResponse.data) {
            setSession(sessionResponse.data)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isClassView])

  // Format date and time
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status: string) => {
    const statusMap: any = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled',
      dropped: 'Dropped',
      inactive: 'Inactive',
      full: 'Full'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      active: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500',
      rescheduled: 'bg-orange-500',
      dropped: 'bg-gray-500',
      inactive: 'bg-gray-400',
      full: 'bg-orange-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const renderInformationTab = () => {
    const data = isClassView ? classData : session
    if (!data) return null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session/Class Information */}
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
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isClassView ? 'Class Information' : 'Session Information'}
              </h2>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(isClassView ? `/tutor/availability` : `/tutor/sessions`)}
                style={{
                  backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
              >
                Edit
              </Button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <Schedule className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mr-3 mt-0.5`} />
                <div>
                  <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Schedule
                  </p>
                  {isClassView ? (
                    <>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Every {data.day.charAt(0).toUpperCase() + data.day.slice(1)}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {data.startTime} - {data.endTime} ({data.duration} minutes)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formatDateTime(data.startTime)}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Duration: {data.duration} minutes
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <Person className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mr-3 mt-0.5`} />
                <div>
                  <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isClassView ? 'Enrollment' : 'Type'}
                  </p>
                  {isClassView ? (
                    <>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {data.currentEnrollment || 0} / {data.maxStudents} Students
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Class capacity
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {data.isOnline ? 'Online Video Call' : 'In-Person Meeting'}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {data.isOnline ? 'Virtual' : 'Physical Location'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes/Description */}
            {(isClassView ? data.description : data.notes) && (
              <div className="mb-6">
                <h4 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {isClassView ? 'Class Description' : 'Session Notes'}
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isClassView ? data.description : data.notes}
                </p>
              </div>
            )}

            {/* Semester Info for Classes */}
            {isClassView && (
              <div className="mb-6">
                <h4 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Semester Period
                </h4>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {new Date(data.semesterStart).toLocaleDateString('vi-VN')} - {new Date(data.semesterEnd).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
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
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<Chat />}
                onClick={() => navigate('/tutor/messages')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Messages
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<PeopleIcon />}
                onClick={() => setCurrentTab(3)}
                style={{
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
              >
                Manage Students
              </Button>
            </div>
          </Card>

          {/* Details Card */}
          <Card 
            className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mt-6`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {isClassView ? 'Class' : 'Session'} Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  data.status === 'confirmed' || data.status === 'active'
                    ? theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                    : theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {getStatusLabel(data.status)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{isClassView ? 'Code' : 'Type'}:</span>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {isClassView ? data.code : data.type}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading {isClassView ? 'class' : 'session'} details...
          </p>
        </div>
      </div>
    )
  }

  if ((!session && !classData)) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            {isClassView ? 'Class' : 'Session'} not found
          </p>
          <Button
            onClick={() => navigate('/tutor')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const displayData = isClassView ? classData : session

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Sticky */}
        <div className={`w-full lg:w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} lg:block`}>
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

            {/* Status */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {isClassView ? 'CLASS STATUS' : 'SESSION STATUS'}
              </h3>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(displayData.status)}`}></div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {getStatusLabel(displayData.status)}
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isClassView ? `Class Code: ${displayData.code}` : `Session ID: ${displayData.id}`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                QUICK ACTIONS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/tutor')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* My Sessions & Classes */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                MY SESSIONS ({mySessions.length}) & CLASSES ({myClasses.length})
              </h3>
              {sessionsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Sessions */}
                  {mySessions.length > 0 && (
                    <div>
                      <p className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        Sessions
                      </p>
                      <div className="space-y-2">
                        {mySessions.map((sess: any) => (
                          <button
                            key={sess.id}
                            onClick={() => navigate(`/tutor/session/${sess.id}`)}
                            className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                              sess.id === id && !isClassView
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold truncate">
                                {sess.subject}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(sess.status)}`}></span>
                            </div>
                            <p className={`text-xs ${sess.id === id && !isClassView ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTime(sess.startTime)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classes */}
                  {myClasses.length > 0 && (
                    <div>
                      <p className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        Classes
                      </p>
                      <div className="space-y-2">
                        {myClasses.map((cls: any) => (
                          <button
                            key={cls.id}
                            onClick={() => navigate(`/tutor/class/${cls.id}`)}
                            className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                              cls.id === id && isClassView
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold truncate">
                                {cls.code} - {cls.subject}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(cls.status)}`}></span>
                            </div>
                            <p className={`text-xs ${cls.id === id && isClassView ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {cls.day.charAt(0).toUpperCase() + cls.day.slice(1)} • {cls.startTime}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mySessions.length === 0 && myClasses.length === 0 && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      No sessions or classes found
                    </p>
                  )}
                </div>
              )}
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

          {/* Breadcrumb Navigation */}
          <div className={`mb-6 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate('/tutor')}
                className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Dashboard
              </button>
              <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <button
                onClick={() => navigate(isClassView ? '/tutor/lms?view=classes' : '/tutor/lms')}
                className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {isClassView ? 'My Classes' : 'My Sessions'}
              </button>
              <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isClassView ? `${displayData.code} - ${displayData.subject}` : displayData.subject}
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {isClassView ? 'Class Management' : 'Session Management'}
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {isClassView 
                ? `Manage LMS for ${displayData.code} - ${displayData.subject}`
                : `Manage LMS for Session - ${displayData.subject}`
              }
            </p>
          </div>

          {/* Tabs Section */}
          <div className="mb-6">
            <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={(_, newValue) => setCurrentTab(newValue)}
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
                  icon={<InfoIcon />} 
                  label="Information" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<ClassIcon />} 
                  label="Course" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<GradeIcon />} 
                  label="Grades" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<PeopleIcon />} 
                  label="Students" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>
            
            <div className="mt-6">
              {currentTab === 0 && renderInformationTab()}
              {currentTab === 1 && id && (
                <CourseTab 
                  sessionId={isClassView ? undefined : id} 
                  classId={isClassView ? id : undefined} 
                  isTutor={true} 
                />
              )}
              {currentTab === 2 && id && currentUser && (
                <GradesTab 
                  sessionId={isClassView ? undefined : id} 
                  classId={isClassView ? id : undefined}
                  isTutor={true} 
                  currentUserId={currentUser.id || currentUser.userId} 
                />
              )}
              {currentTab === 3 && id && (
                <CompetenciesTab 
                  sessionId={isClassView ? undefined : id} 
                  classId={isClassView ? id : undefined}
                  isTutor={true} 
                />
              )}
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

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/tutor')
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

export default TutorSessionDetail

