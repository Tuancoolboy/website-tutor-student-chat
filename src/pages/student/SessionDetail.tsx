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
  TextField,
  Rating,
  Avatar,
  Tabs,
  Tab,
  Box
} from '@mui/material'
import { 
  VideoCall, 
  Chat, 
  Share, 
  Download, 
  Star,
  Schedule,
  Person,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Class as ClassIcon,
  Grade as GradeIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import CourseTab from '../../components/session/CourseTab'
import GradesTab from '../../components/session/GradesTab'
import CompetenciesTab from '../../components/session/CompetenciesTab'
import RequestDialog from '../../components/session/RequestDialog'
import {
  Cancel as CancelIcon,
  Schedule as RescheduleIcon
} from '@mui/icons-material'

const SessionDetail: React.FC = () => {
  const { id } = useParams()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestType, setRequestType] = useState<'cancel' | 'reschedule'>('cancel')
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  
  // Detect if viewing class or session
  const isClassView = location.pathname.includes('/class/')
  
  // Backend data states
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [classData, setClassData] = useState<any>(null)
  const [classSessions, setClassSessions] = useState<any[]>([]) // Sessions của class
  const [upcomingClassSession, setUpcomingClassSession] = useState<any>(null) // Session sắp tới nhất của class
  const [tutor, setTutor] = useState<any>(null)
  const [mySessions, setMySessions] = useState<any[]>([])
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isTutor, setIsTutor] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  // Load my sessions and classes list
  useEffect(() => {
    const loadMyData = async () => {
      try {
        setSessionsLoading(true)
        const userStr = localStorage.getItem('user')
        if (!userStr) return
        
        const user = JSON.parse(userStr)
        
        // Load sessions
        const sessionsResponse = await api.sessions.list({ studentId: user.id || user.userId, limit: 1000 })
        if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
          setMySessions(sessionsResponse.data)
        }
        
        // Load enrolled classes
        const enrollmentsResponse = await api.enrollments.list({ studentId: user.id || user.userId })
        if (enrollmentsResponse.success && enrollmentsResponse.data && Array.isArray(enrollmentsResponse.data)) {
          // Get class details for each enrollment
          const classPromises = enrollmentsResponse.data.map(async (enrollment: any) => {
            try {
              const classResponse = await api.classes.get(enrollment.classId)
              if (classResponse.success && classResponse.data) {
                return classResponse.data
              }
            } catch (err) {
              console.error(`Failed to load class ${enrollment.classId}:`, err)
            }
            return null
          })
          const classResults = await Promise.all(classPromises)
          setMyClasses(classResults.filter(c => c !== null))
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
          console.log('Fetching class:', id)
          const classResponse = await api.classes.get(id)
          console.log('Class response:', classResponse)
          
          if (classResponse.success && classResponse.data) {
            setClassData(classResponse.data)
            console.log('Class data loaded:', classResponse.data)
            
            // Load sessions of this class
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : null
            const userId = user?.id || user?.userId
            
            if (userId) {
              // Load sessions of this class for the current student
              const sessionsResponse = await api.sessions.list({
                classId: id,
                studentId: userId,
                page: 1,
                limit: 100
              })
              
              console.log('📦 [Class Sessions Response]:', sessionsResponse)
              
              // Handle response - API returns {data: Array, pagination: {...}} directly (no success wrapper)
              let classSess: any[] = []
              
              // API returns {data: [...], pagination: {...}} format
              if (sessionsResponse && sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
                classSess = sessionsResponse.data
                console.log(`📚 Initial sessions found with classId filter: ${classSess.length}`)
              } else {
                console.warn('⚠️ Unexpected response format or no data:', sessionsResponse)
              }
              
              // If no sessions found with classId filter, try loading all student sessions and filter manually
              if (classSess.length === 0) {
                console.log('⚠️ No sessions found with classId filter, trying to load all student sessions...')
                const allSessionsResponse = await api.sessions.list({
                  studentId: userId,
                  page: 1,
                  limit: 200
                })
                
                console.log('📦 [All Sessions Response]:', allSessionsResponse)
                
                // Handle same response format
                let allSess: any[] = []
                if (allSessionsResponse && allSessionsResponse.data && Array.isArray(allSessionsResponse.data)) {
                  allSess = allSessionsResponse.data
                  
                  // Filter sessions by matching tutorId and subject (since classId might not be set)
                  classSess = allSess.filter((s: any) => {
                    const matchesClass = s.classId === id || 
                      (s.tutorId === classResponse.data.tutorId && 
                       s.subject === classResponse.data.subject &&
                       s.studentIds?.includes(userId))
                    return matchesClass
                  })
                  console.log(`✅ Found ${classSess.length} sessions for class by tutorId/subject match`)
                }
              }
              
              setClassSessions(classSess)
              
              if (classSess.length > 0) {
                // Find the next upcoming session (confirmed or pending, not cancelled, in the future)
                const now = new Date()
                let upcoming = classSess
                  .filter((s: any) => {
                    // Must include this student
                    if (!s.studentIds?.includes(userId)) return false
                    // Must have valid status
                    if (s.status !== 'confirmed' && s.status !== 'pending') return false
                    // Must not be cancelled
                    if (s.status === 'cancelled') return false
                    // Must be in the future
                    return new Date(s.startTime) >= now
                  })
                  .sort((a: any, b: any) => 
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  )[0] // Get the earliest upcoming session
                
                // If no upcoming session found, try to find any valid session (even if in past but not completed)
                if (!upcoming) {
                  upcoming = classSess
                    .filter((s: any) => {
                      if (!s.studentIds?.includes(userId)) return false
                      return (s.status === 'confirmed' || s.status === 'pending') && s.status !== 'cancelled'
                    })
                    .sort((a: any, b: any) => 
                      new Date(b.startTime).getTime() - new Date(a.startTime).getTime() // Most recent first
                    )[0] // Get the most recent valid session
                }
                
                if (upcoming) {
                  console.log('✅ Found session for class cancel/reschedule:', {
                    id: upcoming.id,
                    status: upcoming.status,
                    classId: upcoming.classId || 'no classId',
                    subject: upcoming.subject,
                    startTime: upcoming.startTime,
                    studentIds: upcoming.studentIds
                  })
                  setUpcomingClassSession(upcoming)
                  // Also set as session for compatibility with handlers
                  setSession(upcoming)
                } else if (classSess.length > 0) {
                  // If no valid session found, use any session from class as fallback
                  // This allows cancel/reschedule even if all sessions are completed/cancelled
                  const fallbackSession = classSess
                    .filter((s: any) => s.studentIds?.includes(userId))
                    .sort((a: any, b: any) => 
                      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    )[0]
                  
                  if (fallbackSession) {
                    console.log('⚠️ Using fallback session for class cancel/reschedule:', {
                      id: fallbackSession.id,
                      status: fallbackSession.status,
                      startTime: fallbackSession.startTime
                    })
                    setUpcomingClassSession(fallbackSession)
                    setSession(fallbackSession)
                  }
                } else {
                  console.warn('⚠️ No valid session found for class:', {
                    classId: id,
                    totalSessions: classSess.length,
                    sessions: classSess.map((s: any) => ({
                      id: s.id,
                      status: s.status,
                      subject: s.subject,
                      startTime: s.startTime,
                      hasStudent: s.studentIds?.includes(userId)
                    }))
                  })
                  // Clear session state if no valid session found
                  setUpcomingClassSession(null)
                  setSession(null)
                }
              } else {
                console.warn('⚠️ No sessions found for class:', id)
                setUpcomingClassSession(null)
                setSession(null)
              }
            }
            
            // Check if current user is tutor
            if (userStr) {
              const isUserTutor = classResponse.data.tutorId === (user.id || user.userId)
              console.log('👤 [ClassDetail] User check:', {
                currentUserId: user.id || user.userId,
                classTutorId: classResponse.data.tutorId,
                isTutor: isUserTutor
              })
              setIsTutor(isUserTutor)
            }
            
            // Fetch tutor data
            console.log('Fetching tutor:', classResponse.data.tutorId)
            const tutorResponse = await api.users.get(classResponse.data.tutorId)
            console.log('Tutor response:', tutorResponse)
            
            if (tutorResponse.success && tutorResponse.data) {
              setTutor(tutorResponse.data)
              console.log('Tutor data loaded:', tutorResponse.data)
            } else {
              console.error('Failed to load tutor:', tutorResponse)
            }
          } else {
            console.error('Class not found or failed:', classResponse)
          }
        } else {
          // Load session data
          console.log('Fetching session:', id)
        const sessionResponse = await api.sessions.get(id)
        console.log('Session response:', sessionResponse)
        
        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data)
          console.log('Session data loaded:', sessionResponse.data)
          
          // Check if current user is tutor
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const user = JSON.parse(userStr)
            const isUserTutor = sessionResponse.data.tutorId === (user.id || user.userId)
            console.log('👤 [SessionDetail] User check:', {
              currentUserId: user.id || user.userId,
              sessionTutorId: sessionResponse.data.tutorId,
              isTutor: isUserTutor
            })
            setIsTutor(isUserTutor)
          }
          
          // Fetch tutor data
          console.log('Fetching tutor:', sessionResponse.data.tutorId)
          const tutorResponse = await api.users.get(sessionResponse.data.tutorId)
          console.log('Tutor response:', tutorResponse)
          
          if (tutorResponse.success && tutorResponse.data) {
            setTutor(tutorResponse.data)
            console.log('Tutor data loaded:', tutorResponse.data)
          } else {
            console.error('Failed to load tutor:', tutorResponse)
          }
        } else {
          console.error('Session not found or failed:', sessionResponse)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isClassView, refreshTrigger])

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

  const handleJoinSession = () => {
    setIsJoinDialogOpen(true)
  }

  const handleStartSession = () => {
    // In a real app, this would open the video call
    if (session?.meetingLink) {
    window.open(session.meetingLink, '_blank')
    }
    setIsJoinDialogOpen(false)
  }

  const handleEndSession = () => {
    setIsFeedbackDialogOpen(true)
  }

  const handleSubmitFeedback = () => {
    // In a real app, this would submit feedback to the backend
    console.log('Feedback submitted:', { rating, feedback })
    setIsFeedbackDialogOpen(false)
  }

  const handleRequestCancel = () => {
    if (isClassView) {
      // For class view, use upcoming session if available, otherwise create a session object from class info
      if (upcomingClassSession) {
        setRequestType('cancel')
        setIsRequestDialogOpen(true)
      } else if (classData) {
        // Create a virtual session from class info to allow cancel/reschedule requests
        // This allows students to request cancel/reschedule even if no specific session exists yet
        setRequestType('cancel')
        setIsRequestDialogOpen(true)
      } else {
        alert('Không thể tạo yêu cầu. Vui lòng thử lại sau.')
      }
    } else {
      // For individual session
      if (!session) return
      setRequestType('cancel')
      setIsRequestDialogOpen(true)
    }
  }

  const handleRequestReschedule = () => {
    if (isClassView) {
      // For class view, use upcoming session if available, otherwise create a session object from class info
      if (upcomingClassSession) {
        setRequestType('reschedule')
        setIsRequestDialogOpen(true)
      } else if (classData) {
        // Create a virtual session from class info to allow cancel/reschedule requests
        setRequestType('reschedule')
        setIsRequestDialogOpen(true)
      } else {
        alert('Không thể tạo yêu cầu. Vui lòng thử lại sau.')
      }
    } else {
      // For individual session
      if (!session) return
      setRequestType('reschedule')
      setIsRequestDialogOpen(true)
    }
  }

  const handleRequestSuccess = () => {
    setIsRequestDialogOpen(false)
    // Trigger refresh by updating a state that useEffect depends on
    setRefreshTrigger(prev => prev + 1)
  }

  const renderInformationTab = () => {
    const data = isClassView ? classData : session
    if (!data || !tutor) return null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Information */}
            <div className="lg:col-span-2">
          <Card
            className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {isClassView ? 'Class Information' : 'Session Information'}
                  </h2>

                {/* Tutor Info */}
            <div className="flex items-center mb-6 pb-6 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: getAvatarColor(tutor.name),
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getInitials(tutor.name)}
                  </Avatar>
                  <div className="ml-4">
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tutor.name}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.subject}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                        className={`w-4 h-4 ${i < Math.floor(tutor.rating || 0) ? 'text-yellow-400' : theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tutor.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
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
                            {data.currentEnrollment} / {data.maxStudents} Students
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

                {/* Tutor Specialties */}
                {tutor.subjects && tutor.subjects.length > 0 && (
                <div>
                <h4 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Tutor Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject: string, index: number) => (
                      <span
                        key={index}
                      className={`px-3 py-1 text-sm rounded-full ${
                        theme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      >
                          {subject}
                      </span>
                    ))}
                  </div>
                </div>
                )}
          </Card>
            </div>

        {/* Session Actions */}
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
                  Session Actions
                </h3>
                <div className="space-y-3">
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<VideoCall />}
                onClick={handleJoinSession}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Join Video Call
              </Button>
              {/* Show buttons for individual sessions OR upcoming class session */}
              {(() => {
                if (isClassView) {
                  // For class view: show buttons if class is active
                  // We don't require upcomingClassSession because we can create request based on class info
                  const classIsActive = classData?.status === 'active'
                  
                  console.log('🏫 [Class View] Check buttons:', {
                    classIsActive,
                    hasUpcomingSession: !!upcomingClassSession,
                    sessionId: upcomingClassSession?.id,
                    status: upcomingClassSession?.status,
                    classStatus: classData?.status,
                    classSessionsCount: classSessions.length,
                    shouldShow: classIsActive
                  })
                  return classIsActive
                } else {
                  // For individual session view
                  return !!(session && (session.status === 'confirmed' || session.status === 'pending'))
                }
              })() && (
                <>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<RescheduleIcon />}
                    onClick={handleRequestReschedule}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                    }}
                  >
                    Request Reschedule
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<CancelIcon />}
                    onClick={handleRequestCancel}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: '#ef4444',
                      borderColor: '#ef4444',
                      textTransform: 'none',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                    }}
                  >
                    Request Cancel
                  </Button>
                </>
              )}
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Chat />}
                style={{
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                }}
              >
                Send Message
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Download />}
                style={{
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                }}
              >
                Download Materials
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Star />}
                onClick={handleEndSession}
                style={{
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                }}
              >
                End Session & Rate
              </Button>
                </div>
          </Card>

          {/* Session Details Card */}
              <Card 
            className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mt-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Session Details
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
            Loading session details...
          </p>
        </div>
      </div>
    )
  }

  if ((!session && !classData) || !tutor) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            {isClassView ? 'Class' : 'Session'} not found
          </p>
          <Button
            onClick={() => navigate('/student')}
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
              onClick={() => navigate('/student')}
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
                  onClick={() => navigate('/student')}
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
                      onClick={() => navigate(`/student/session/${sess.id}`)}
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
                            onClick={() => navigate(`/student/class/${cls.id}`)}
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
                onClick={() => navigate('/student/session')}
                className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                LMS
              </button>
              <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <button
                onClick={() => navigate(isClassView ? '/student/session?view=classes' : '/student/session')}
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
              {isClassView ? 'Class Details' : 'Session Details'}
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {isClassView 
                ? `${displayData.code} - ${displayData.subject} with ${tutor.name}`
                : `Session with ${tutor.name} - ${displayData.subject}`
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
                  isTutor={isTutor} 
                />
              )}
              {currentTab === 2 && id && currentUser && (
                <GradesTab sessionId={id} isTutor={isTutor} currentUserId={currentUser.id || currentUser.userId} />
              )}
              {currentTab === 3 && id && (
                <CompetenciesTab 
                  sessionId={isClassView ? undefined : id} 
                  classId={isClassView ? id : undefined}
                  isTutor={isTutor} 
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

              {/* Mobile Status */}
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
                  Book Another Session
                </button>
                <button 
                  onClick={() => {
                    navigate('/student/progress')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <TrendingUpIcon className="mr-3 w-4 h-4" />
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

      {/* Join Dialog */}
      <Dialog open={isJoinDialogOpen} onClose={() => setIsJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isClassView ? 'Join Class' : 'Join Session'}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to join the {isClassView ? 'class' : 'session'} with {tutor?.name}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isClassView 
              ? `${displayData?.code} - ${displayData?.subject}`
              : `Session: ${displayData?.subject} - ${formatDateTime(displayData?.startTime || '')}`
            }
          </Typography>
          <div className="mt-4">
            <TextField
              fullWidth
              label="Meeting Link"
              value={displayData?.meetingLink || 'No meeting link available'}
              InputProps={{ readOnly: true }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsJoinDialogOpen(false)}
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              textTransform: 'none',
              fontWeight: '500'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleStartSession} 
            variant="contained"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: '500'
            }}
          >
            Join Now
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onClose={() => setIsFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate Your Session</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            <Typography variant="h6" gutterBottom>
              How would you rate this session?
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue || 0)}
              size="large"
            />
          </div>
          <div className="mt-4">
            <TextField
              fullWidth
              label="Additional Feedback"
              multiline
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts about the session..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsFeedbackDialogOpen(false)}
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              textTransform: 'none',
              fontWeight: '500'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSubmitFeedback} 
            variant="contained"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: '500'
            }}
          >
            Submit Feedback
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Request Dialog */}
      {/* Show for individual sessions OR class */}
      {((!isClassView && session && (session.status === 'confirmed' || session.status === 'pending')) ||
        (isClassView && classData && isRequestDialogOpen)) && (() => {
          // Determine session object for RequestDialog
          let sessionForRequest: {
            id: string
            subject: string
            startTime: string
            endTime: string
            classId?: string
            tutorId?: string
          } | null = null

          if (isClassView && upcomingClassSession) {
            sessionForRequest = {
            id: upcomingClassSession.id,
              subject: upcomingClassSession.subject || classData?.subject || '',
            startTime: upcomingClassSession.startTime,
            endTime: upcomingClassSession.endTime,
            classId: upcomingClassSession.classId || classData?.id,
            tutorId: upcomingClassSession.tutorId || classData?.tutorId || session?.tutorId
            }
          } else if (isClassView && classData) {
            // Create a virtual session from class info for request
            sessionForRequest = {
              id: `class_${classData.id}_next_session`,
              subject: classData.subject,
              startTime: new Date().toISOString(), // Placeholder - will be updated when session is created
              endTime: new Date(Date.now() + (classData.duration || 120) * 60000).toISOString(),
              classId: classData.id,
              tutorId: classData.tutorId
            }
          } else if (session) {
            sessionForRequest = {
            id: session.id,
            subject: session.subject,
            startTime: session.startTime,
            endTime: session.endTime,
            classId: session.classId,
            tutorId: session.tutorId
            }
          }

          // Only render if we have a valid session
          if (!sessionForRequest) return null

          return (
            <RequestDialog
              open={isRequestDialogOpen}
              onClose={() => setIsRequestDialogOpen(false)}
              session={sessionForRequest}
          type={requestType}
          classInfo={(isClassView ? classData : (session?.classId && classData)) ? {
            id: classData.id,
            code: classData.code,
            subject: classData.subject
          } : undefined}
          onSuccess={handleRequestSuccess}
        />
          )
        })()}
    </div>
  )
}

export default SessionDetail
