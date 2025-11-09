import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Drawer,
  Fab,
  SwipeableDrawer,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  AccessTime as AccessTimeIcon,
  AccessTimeFilledOutlined as AccessTimeFilledIcon
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import SessionCard from '../../components/calendar/SessionCard'
import DayView from '../../components/calendar/DayView'
import SessionDetailModal from '../../components/calendar/SessionDetailModal'
import SessionFormModal from '../../components/calendar/SessionFormModal'
import { Session, CalendarFilters } from '../../types/calendar'
import { useCalendarAnimations } from '../../utils/calendarAnimations'
import { api } from '../../lib/api'

const CalendarMobile: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const containerRef = useCalendarAnimations()
  
  // State
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filters, setFilters] = useState<CalendarFilters>({})
  const [sessions, setSessions] = useState<Session[]>([])
  const [weekSessions, setWeekSessions] = useState<{[key: string]: Session[]}>({})
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<{[key: string]: any}>({})
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [showClock, setShowClock] = useState(true)

  // Time slots from 7 AM to 6 PM with 1-hour ranges (mobile day view)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 7 + i
    const nextHour = hour + 1
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${nextHour.toString().padStart(2, '0')}:00`
    return { start: startTime, end: endTime, display: `${startTime}-${endTime}` }
  })

  // Get week start date (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Get week dates
  const getWeekDates = (startDate: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      return date.toISOString().split('T')[0]
    })
  }

  // Filter sessions
  const filterSessions = (sessions: Session[], filters: CalendarFilters) => {
    return sessions.filter(session => {
      if (filters.subject && session.subject !== filters.subject) return false
      if (filters.student && session.student?.id !== filters.student) return false
      if (filters.status && session.status !== filters.status) return false
      return true
    })
  }

  // Helper function to convert classes to calendar sessions based on week dates
  const convertClassesToSessions = (classes: any[], weekDates: string[], studentsMap: {[key: string]: any}): Session[] => {
    const classSessions: Session[] = []
    
    classes.forEach((classItem) => {
      if (!classItem || classItem.status !== 'active') return
      
      const semesterStart = new Date(classItem.semesterStart)
      const semesterEnd = new Date(classItem.semesterEnd)
      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(classItem.day.toLowerCase())
      
      if (dayIndex === -1) return
      
      weekDates.forEach((dateStr) => {
        const date = new Date(dateStr)
        const currentDay = date.getDay()
        const mappedDay = currentDay === 0 ? 6 : currentDay - 1 // Map Sunday (0) to 6, Monday (1) to 0, etc.
        
        if (mappedDay === dayIndex) {
          // Check if date is within semester range
          if (date >= semesterStart && date <= semesterEnd) {
            const [startHour, startMin] = classItem.startTime.split(':').map(Number)
            const [endHour, endMin] = classItem.endTime.split(':').map(Number)
            
            const sessionStart = new Date(date)
            sessionStart.setHours(startHour, startMin, 0, 0)
            
            const sessionEnd = new Date(date)
            sessionEnd.setHours(endHour, endMin, 0, 0)
            
            classSessions.push({
              id: `class_${classItem.id}_${dateStr}`,
              subject: classItem.subject,
              student: undefined,
              date: dateStr,
              startTime: classItem.startTime,
              endTime: classItem.endTime,
              location: {
                type: classItem.isOnline ? 'online' : 'offline',
                address: classItem.location,
                meetingLink: classItem.isOnline ? undefined : undefined
              },
              status: 'scheduled' as const,
              notes: `${classItem.code} - ${classItem.description || ''}`,
              color: '#10b981', // Green color for classes
              createdAt: classItem.createdAt,
              updatedAt: classItem.updatedAt,
              classId: classItem.id // Add classId to identify it's from a class
            })
          }
        }
      })
    })
    
    return classSessions
  }

  // Load sessions and classes from backend
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
        const tutorId = user.id || user.userId
        
        // Fetch all sessions for this tutor
        const sessionsResponse = await api.sessions.list({ 
          tutorId, 
          limit: 1000 
        })
        
        // Fetch classes for this tutor
        const classesResponse = await api.classes.list({ tutorId })
        
        let allSessionsData: any[] = []
        let classesData: any[] = []
        let allStudentIds: string[] = []
        
        // Process sessions
        if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
          allSessionsData = sessionsResponse.data
          // Extract studentIds from array (sessions have studentIds array, not single studentId)
          const sessionStudentIds = allSessionsData
            .map((s: any) => s.studentIds || (s.studentId ? [s.studentId] : []))
            .flat()
          allStudentIds = [...allStudentIds, ...sessionStudentIds]
        }
        
        // Process classes
        if (classesResponse.success && classesResponse.data && Array.isArray(classesResponse.data)) {
          classesData = classesResponse.data.filter((c: any) => c.status === 'active')
        }
        
        // Fetch student details for all unique students
        const uniqueStudentIds = [...new Set(allStudentIds)] as string[]
        const studentPromises = uniqueStudentIds.map(async (studentId: string) => {
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
        
        // Get unique subjects
        const uniqueSubjects = [...new Set([
          ...allSessionsData.map((s: any) => s.subject),
          ...classesData.map((c: any) => c.subject)
        ])] as string[]
        
        // Transform sessions to calendar format
        const transformedSessions: Session[] = allSessionsData.map((s: any) => {
          // Get first student from studentIds array (1-1 sessions)
          const studentId = Array.isArray(s.studentIds) && s.studentIds.length > 0 
            ? s.studentIds[0] 
            : s.studentId || null
          
          return {
            id: s.id,
            subject: s.subject,
            student: studentId && studentsMap[studentId] ? {
              id: studentId,
              name: studentsMap[studentId].name,
              avatar: studentsMap[studentId].avatar || ''
            } : studentId ? {
              id: studentId,
              name: 'Loading...',
              avatar: ''
            } : undefined,
          date: new Date(s.startTime).toISOString().split('T')[0],
          startTime: new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          location: {
            type: s.isOnline ? 'online' : 'offline',
            address: s.location,
            meetingLink: s.meetingLink
          },
          status: s.status === 'confirmed' ? 'scheduled' : s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'scheduled',
          notes: s.notes || s.description,
          color: '#3b82f6', // Blue color for individual sessions
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
          }
        })
        
        setSessions(transformedSessions)
        setStudents(studentsMap)
        setSubjects(uniqueSubjects)
        setClasses(classesData)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [navigate])

  // Organize sessions by week
  useEffect(() => {
    const weekStart = getWeekStart(currentWeek)
    const weekDates = getWeekDates(weekStart)
    
    // Convert classes to sessions for current week
    const classSessions = convertClassesToSessions(classes, weekDates, students)
    
    // Combine regular sessions with class sessions
    const allSessions = [...sessions, ...classSessions]
    const filteredSessions = filterSessions(allSessions, filters)
    
    // Group sessions by date
    const groupedSessions: {[key: string]: Session[]} = {}
    weekDates.forEach(date => {
      groupedSessions[date] = filteredSessions.filter(session => session.date === date)
    })
    setWeekSessions(groupedSessions)
  }, [currentWeek, filters, sessions, classes, students])

  // Navigation handlers
  const handlePreviousWeek = () => {
    if (viewMode === 'day') {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - 1)
      setSelectedDate(d.toISOString().split('T')[0])
      setCurrentWeek(d)
    } else {
      const newWeek = new Date(currentWeek)
      newWeek.setDate(newWeek.getDate() - 7)
      setCurrentWeek(newWeek)
    }
  }

  const handleNextWeek = () => {
    if (viewMode === 'day') {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + 1)
      setSelectedDate(d.toISOString().split('T')[0])
      setCurrentWeek(d)
    } else {
      const newWeek = new Date(currentWeek)
      newWeek.setDate(newWeek.getDate() + 7)
      setCurrentWeek(newWeek)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentWeek(now)
    setSelectedDate(now.toISOString().split('T')[0])
  }

  // Session handlers
  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    setIsDetailModalOpen(true)
  }

  const handleEditSession = (session: Session) => {
    setSelectedSession(session)
    setIsFormModalOpen(true)
  }

  const handleCancelSession = (session: Session) => {
    console.log('Cancel session:', session.id)
  }

  const handleRescheduleSession = (session: Session) => {
    console.log('Reschedule session:', session.id)
  }

  const handleJoinSession = (session: Session) => {
    if (session.location.meetingLink) {
      window.open(session.location.meetingLink, '_blank')
    }
  }

  const handleCreateSession = () => {
    setSelectedSession(null)
    setIsFormModalOpen(true)
  }

  const handleSaveSession = (sessionData: Partial<Session>) => {
    console.log('Save session:', sessionData)
    
    // Create new session with unique ID
    const newSession: Session = {
      id: `session_${Date.now()}`,
      subject: sessionData.subject || '',
      student: sessionData.student || undefined,
      date: sessionData.date || '',
      startTime: sessionData.startTime || '',
      endTime: sessionData.endTime || '',
      location: sessionData.location || { type: 'online', address: '', meetingLink: '' },
      status: sessionData.status || 'scheduled',
      notes: sessionData.notes || '',
      color: sessionData.color || '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add new session to sessions state
    setSessions(prevSessions => [...prevSessions, newSession])
    
    // Update weekSessions to include the new session
    setWeekSessions(prevWeekSessions => {
      const dateKey = newSession.date
      const existingSessions = prevWeekSessions[dateKey] || []
      return {
        ...prevWeekSessions,
        [dateKey]: [...existingSessions, newSession]
      }
    })
    
    setIsFormModalOpen(false)
  }

  // Filter handlers
  const handleFilterChange = (field: keyof CalendarFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  // Format week display
  const formatWeekDisplay = (date: Date) => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get sessions for a specific date
  const getSessionsForDate = (date: string) => {
    return weekSessions[date] || []
  }

  // Sort sessions by time
  const sortSessionsByTime = (sessions: Session[]) => {
    return sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // Clock Widget Component for Mobile
  const ClockWidgetMobile = ({ theme }: { theme: string }) => {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)

      return () => clearInterval(timer)
    }, [])

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    return (
      <Card
        sx={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Time Display */}
          <div className="text-center mb-1">
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme === 'dark' ? '#ffffff' : '#111827',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                fontSize: '2rem'
              }}
            >
              {formatTime(currentTime)}
            </Typography>
          </div>

          {/* Date Display */}
          <div className="text-center">
            <Typography
              variant="caption"
              sx={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              {formatDate(currentTime)}
            </Typography>
          </div>

          {/* Decorative line */}
          <div
            style={{
              marginTop: '12px',
              height: '2px',
              background: theme === 'dark' 
                ? 'linear-gradient(90deg, transparent, #10b981, transparent)' 
                : 'linear-gradient(90deg, transparent, #059669, transparent)',
              borderRadius: '2px'
            }}
          />
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Loading calendar...
          </p>
        </div>
      </div>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div 
        ref={containerRef}
        className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <IconButton
                onClick={() => navigate('/tutor')}
                sx={{ mr: 1, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  fontWeight: 600
                }}
              >
                Teaching Calendar
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => setShowClock(!showClock)}
                sx={{ 
                  color: showClock 
                    ? (theme === 'dark' ? '#10b981' : '#10b981')
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  transition: 'color 0.2s'
                }}
              >
                {showClock ? <AccessTimeFilledIcon /> : <AccessTimeIcon />}
              </IconButton>
              <IconButton
                onClick={() => setIsFilterOpen(true)}
                sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <FilterListIcon />
              </IconButton>
              <IconButton
                onClick={() => setIsMenuOpen(true)}
                sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <MenuIcon />
              </IconButton>
            </div>
          </div>

          {/* Clock Widget Mobile */}
          <div 
            className="px-4 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: showClock ? '200px' : '0px',
              paddingBottom: showClock ? '8px' : '0px',
              opacity: showClock ? 1 : 0
            }}
          >
            <ClockWidgetMobile theme={theme} />
          </div>

          {/* Week/Day Navigation */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="outlined"
                size="small"
                onClick={handlePreviousWeek}
                sx={{
                  borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  minWidth: 'auto',
                  px: 1
                }}
              >
                <ChevronLeftIcon />
              </Button>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                {formatWeekDisplay(currentWeek)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleNextWeek}
                sx={{
                  borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  minWidth: 'auto',
                  px: 1
                }}
              >
                <ChevronRightIcon />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="contained"
                fullWidth
                onClick={handleToday}
                size="small"
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': {
                    backgroundColor: '#059669'
                  }
                }}
              >
                Today
              </Button>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMode}
                onChange={(_, v) => v && setViewMode(v)}
                aria-label="Calendar view switcher"
                sx={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    border: 'none',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.5,
                    transition: 'all 0.2s ease'
                  },
                  '& .MuiToggleButton-root:hover': {
                    backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
                  },
                  '& .MuiToggleButton-root.Mui-selected': {
                    backgroundColor: '#2563eb',
                    color: '#ffffff !important',
                    '&:hover': {
                      backgroundColor: '#1d4ed8'
                    }
                  }
                }}
              >
                <ToggleButton value="week" aria-label="Week view">Week</ToggleButton>
                <ToggleButton value="day" aria-label="Day view">Day</ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-4">
          {viewMode === 'day' ? (
            <DayView
              date={selectedDate}
              timeSlots={timeSlots}
              sessions={getSessionsForDate(selectedDate)}
              onSessionClick={handleSessionClick}
              showTutor={false}
              showStudent={true}
            />
          ) : (
          getWeekDates(getWeekStart(currentWeek)).map((date) => {
            const dateSessions = sortSessionsByTime(getSessionsForDate(date))
            const isToday = date === new Date().toISOString().split('T')[0]
            
            return (
              <Card
                key={date}
                sx={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  mb: 2,
                  ...(isToday && {
                    borderColor: '#10b981',
                    boxShadow: '0 0 0 1px #10b981'
                  })
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: theme === 'dark' ? '#ffffff' : '#111827',
                        fontWeight: 600
                      }}
                    >
                      {formatDateDisplay(date)}
                    </Typography>
                    <Chip
                      label={`${dateSessions.length} sessions`}
                      size="small"
                      sx={{
                        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                        color: theme === 'dark' ? '#ffffff' : '#111827',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>

                  {/* Sessions */}
                  {dateSessions.length > 0 ? (
                    <div className="space-y-2">
                      {dateSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={handleSessionClick}
                          isCompact={false}
                          showTutor={false}
                          showStudent={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                        }}
                      >
                        No teaching sessions scheduled
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }))
          }
        </div>

        {/* FAB for Add Session */}
        <Fab
          color="primary"
          aria-label="add session"
          onClick={handleCreateSession}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: '#10b981',
            '&:hover': {
              backgroundColor: '#059669'
            }
          }}
        >
          <AddIcon />
        </Fab>

        {/* Filter Drawer */}
        <SwipeableDrawer
          anchor="right"
          open={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onOpen={() => setIsFilterOpen(true)}
        >
          <div className={`w-80 h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Typography
                  variant="h6"
                  sx={{
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    fontWeight: 600
                  }}
                >
                  Filters
                </Typography>
                <IconButton
                  onClick={() => setIsFilterOpen(false)}
                  sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  <CloseIcon />
                </IconButton>
              </div>

              <div className="space-y-4">
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: theme === 'dark' ? '#d1d5db' : '#374151',
                      '&.Mui-focused': {
                        color: theme === 'dark' ? '#ffffff' : '#111827'
                      }
                    }}
                  >
                    Subject
                  </InputLabel>
                  <Select
                    value={filters.subject || ''}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    label="Subject"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#10b981' : '#10b981',
                      },
                      '& .MuiSelect-icon': {
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      }
                    }}
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: theme === 'dark' ? '#d1d5db' : '#374151',
                      '&.Mui-focused': {
                        color: theme === 'dark' ? '#ffffff' : '#111827'
                      }
                    }}
                  >
                    Student
                  </InputLabel>
                  <Select
                    value={filters.student || ''}
                    onChange={(e) => handleFilterChange('student', e.target.value)}
                    label="Student"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#10b981' : '#10b981',
                      },
                      '& .MuiSelect-icon': {
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      }
                    }}
                  >
                    <MenuItem value="">All Students</MenuItem>
                    {Object.values(students).map((student: any) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: theme === 'dark' ? '#d1d5db' : '#374151',
                      '&.Mui-focused': {
                        color: theme === 'dark' ? '#ffffff' : '#111827'
                      }
                    }}
                  >
                    Status
                  </InputLabel>
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme === 'dark' ? '#10b981' : '#10b981',
                      },
                      '& .MuiSelect-icon': {
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      }
                    }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="rescheduled">Rescheduled</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={clearFilters}
                  sx={{
                    borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </SwipeableDrawer>

        {/* Menu Drawer */}
        <Drawer
          anchor="right"
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        >
          <div className={`w-80 h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Typography
                  variant="h6"
                  sx={{
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    fontWeight: 600
                  }}
                >
                  Menu
                </Typography>
                <IconButton
                  onClick={() => setIsMenuOpen(false)}
                  sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  <CloseIcon />
                </IconButton>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/tutor')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{<DashboardIcon />}</span>
                  Dashboard
                  <ChevronRightIcon className="ml-auto w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigate('/tutor/availability')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{<ScheduleIcon />}</span>
                  Set Availability
                  <ChevronRightIcon className="ml-auto w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigate('/tutor/sessions')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{<AssignmentIcon />}</span>
                  Manage Sessions
                  <ChevronRightIcon className="ml-auto w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigate('/tutor/track-progress')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{<BarChartIcon />}</span>
                  Track Progress
                  <ChevronRightIcon className="ml-auto w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Drawer>

        {/* Modals */}
        <SessionDetailModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          session={selectedSession}
          onEdit={handleEditSession}
          onCancel={handleCancelSession}
          onReschedule={handleRescheduleSession}
          onJoin={handleJoinSession}
          showTutor={false}
          showStudent={true}
        />

        <SessionFormModal
          open={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveSession}
          session={selectedSession}
          tutors={[]}
          students={Object.values(students).map((s: any) => ({ id: s.id, name: s.name, avatar: s.avatar }))}
          subjects={subjects.map((s, idx) => ({ id: `subj_${idx}`, name: s, color: '#10b981' }))}
          showTutor={false}
          showStudent={true}
        />
      </div>
    </LocalizationProvider>
  )
}

export default CalendarMobile
