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
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterListIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import CalendarCell from '../../components/calendar/CalendarCell'
import DayView from '../../components/calendar/DayView'
import SessionDetailModal from '../../components/calendar/SessionDetailModal'
import SessionFormModal from '../../components/calendar/SessionFormModal'
import MiniMonth from '../../components/calendar/MiniMonth'
import { Session, CalendarFilters } from '../../types/calendar'
import { api } from '../../lib/api'

const Calendar: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  // State
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<CalendarFilters>({})
  const [sessions, setSessions] = useState<Session[]>([])
  const [weekSessions, setWeekSessions] = useState<{[key: string]: Session[]}>({})
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<{[key: string]: any}>({})
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<any[]>([])

  // Time slots from 7 AM to 6 PM with 1-hour ranges
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 7 + i
    const nextHour = hour + 1
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${nextHour.toString().padStart(2, '0')}:00`
    return {
      start: startTime,
      end: endTime,
      display: `${startTime}-${endTime}`
    }
  })

  // Days of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
          eventType: 'session' as const,
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
    
    // Group sessions by date and time
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
    // Implement cancel logic
  }

  const handleRescheduleSession = (session: Session) => {
    console.log('Reschedule session:', session.id)
    // Implement reschedule logic
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

  const handleSaveSession = async (sessionData: Partial<Session>) => {
    console.log('Save session:', sessionData)
    
    try {
      // Create new session with unique ID and include eventType
      const newSession: Session = {
        id: sessionData.id || `${sessionData.eventType || 'session'}_${Date.now()}`,
        subject: sessionData.subject || '',
        eventType: sessionData.eventType,
        student: sessionData.student,
        date: sessionData.date || '',
        startTime: sessionData.startTime || '',
        endTime: sessionData.endTime || '',
        location: sessionData.location || { type: 'online', address: '', meetingLink: '' },
        status: sessionData.status || 'scheduled',
        notes: sessionData.notes || '',
        color: sessionData.color || '#3b82f6',
        createdAt: sessionData.createdAt || new Date().toISOString(),
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
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  // Helper function to get sessions for specific date and time
  const getSessionsForDateTime = (date: string, time: string) => {
    const daySessions = weekSessions[date] || []
    const filteredSessions = daySessions.filter(session => {
      const sessionStart = session.startTime
      const sessionEnd = session.endTime
      
      // Check if session overlaps with this time slot
      return sessionStart <= time && sessionEnd > time
    })
    
    if (filteredSessions.length > 0) {
      console.log(`Sessions for ${date} at ${time}:`, filteredSessions)
    }
    
    return filteredSessions
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
    
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Clock Widget Component
  const ClockWidget = ({ theme }: { theme: string }) => {
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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return (
      <Card
        sx={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '12px',
          mb: 3,
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Time Display */}
          <div className="text-center mb-2">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme === 'dark' ? '#ffffff' : '#111827',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                fontSize: '2.5rem'
              }}
            >
              {formatTime(currentTime)}
            </Typography>
          </div>

          {/* Date Display */}
          <div className="text-center">
            <Typography
              variant="body2"
              sx={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              {formatDate(currentTime)}
            </Typography>
          </div>

          {/* Decorative line */}
          <div
            style={{
              marginTop: '16px',
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
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex">
          {/* Sidebar - Sticky */}
          <div className={`w-80 sticky top-0 h-screen ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
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
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  size="small"
                  sx={{
                    borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    '&:hover': {
                      borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
                      backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb'
                    }
                  }}
                >
                  Filters
                </Button>
              </div>

              {/* Clock Widget */}
              <ClockWidget theme={theme} />

              {/* Week/Day Navigation + Mini Month */}
              <Card
                sx={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  mb: 3
                }}
              >
                <CardContent sx={{ p: 2 }}>
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
                      backgroundColor: theme==='dark' ? '#1f2937' : '#ffffff',
                      border: `1px solid ${theme==='dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      p: 0.5,
                      '& .MuiToggleButton-root': {
                        color: `${theme==='dark' ? '#e5e7eb' : '#111827'} !important`,
                        border: 'none',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '10px',
                        backgroundColor: 'transparent',
                        px: 2,
                        py: 0.75
                      },
                      '& .MuiToggleButton-root:hover': {
                        backgroundColor: theme==='dark' ? '#374151' : '#f3f4f6'
                      },
                      '& .MuiToggleButton-root.Mui-selected': {
                        backgroundColor: theme==='dark' ? '#059669' : '#10b981',
                        color: '#ffffff !important'
                      }
                    }}
                  >
                    <ToggleButton value="week" aria-label="Week view">Week</ToggleButton>
                    <ToggleButton value="day" aria-label="Day view">Day</ToggleButton>
                  </ToggleButtonGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Mini Month */}
              <MiniMonth
                date={new Date(selectedDate)}
                onChange={(d) => { setSelectedDate(d.toISOString().split('T')[0]); setCurrentWeek(d); setViewMode('day') }}
              />

              {/* Filters */}
              {isFilterOpen && (
                <Card
                  sx={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    mb: 3
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: theme === 'dark' ? '#ffffff' : '#111827',
                        fontWeight: 600,
                        mb: 2
                      }}
                    >
                      Filters
                    </Typography>
                    
                    <div className="space-y-3">
                      <FormControl fullWidth size="small">
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

                      <FormControl fullWidth size="small">
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

                      <FormControl fullWidth size="small">
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
                        size="small"
                        sx={{
                          borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                          color: theme === 'dark' ? '#ffffff' : '#111827'
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card
                sx={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    {viewMode === 'day' ? 'Today' : 'This Week'}
                  </Typography>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Total Sessions:
                      </span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessions.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Scheduled:
                      </span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessions.filter(s => s.status === 'scheduled').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Completed:
                      </span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessions.filter(s => s.status === 'completed').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="flex-1 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Calendar Header */}
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 600
                    }}
                  >
                    {viewMode === 'day' ? 'Day Schedule' : 'Teaching Schedule'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateSession}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': {
                        backgroundColor: '#059669'
                      }
                    }}
                  >
                    Add Session
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                {viewMode === 'day' ? (
                  <DayView
                    date={selectedDate}
                    timeSlots={timeSlots}
                    sessions={weekSessions[selectedDate] || []}
                    onSessionClick={handleSessionClick}
                    showTutor={false}
                    showStudent={true}
                  />
                ) : (
                <div className="min-w-full">
                  {/* Days Header */}
                  <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
                    <div className={`p-3 text-center font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Time
                    </div>
                    {days.map((day, index) => {
                      const date = new Date(getWeekStart(currentWeek))
                      date.setDate(date.getDate() + index)
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      return (
                        <div
                          key={day}
                          className={`p-3 text-center border-l border-gray-200 dark:border-gray-700 ${
                            isToday ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}
                        >
                          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time Slots */}
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot.start} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
                      <div className={`time-range-display ${theme === 'dark' ? 'dark' : ''}`}>
                        {timeSlot.display}
                      </div>
                      {days.map((_, dayIndex) => {
                        const date = new Date(getWeekStart(currentWeek))
                        date.setDate(date.getDate() + dayIndex)
                        const dateString = date.toISOString().split('T')[0]
                        const cellSessions = getSessionsForDateTime(dateString, timeSlot.start)
                        
                        return (
                          <CalendarCell
                            key={`${dateString}-${timeSlot.start}`}
                            time={timeSlot.start}
                            sessions={cellSessions}
                            onSessionClick={handleSessionClick}
                            isToday={date.toDateString() === new Date().toDateString()}
                            isCurrentHour={timeSlot.start === new Date().getHours().toString().padStart(2, '0') + ':00'}
                            showTutor={false}
                            showStudent={true}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

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

export default Calendar
