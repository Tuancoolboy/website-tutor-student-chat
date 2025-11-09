import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Tabs, Tab, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import api from '../../lib/api'
import { 
  CalendarToday, 
  Schedule, 
  Person, 
  School,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  LocationOn as LocationOnIcon,
  Group as GroupIcon,
  AccessTime,
  Event as EventIcon,
  Class as ClassIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const BookSession: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [bookingMode, setBookingMode] = useState<'session' | 'class'>('session') // Default to session mode
  
  // Session booking states
  const [activeStep, setActiveStep] = useState(0)
  const [selectedTutor, setSelectedTutor] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('') // Selected subject
  const [selectedDuration, setSelectedDuration] = useState<number>(60) // Duration in minutes
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionType, setSessionType] = useState('online') // Default to online
  const [sessionNotes, setSessionNotes] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dateSelectionStep, setDateSelectionStep] = useState<'date' | 'time'>('date')
  
  // Class enrollment states
  const [classes, setClasses] = useState<any[]>([])
  const [myEnrollments, setMyEnrollments] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [availableTutors, setAvailableTutors] = useState<any[]>([])
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([])
  const [classFilters, setClassFilters] = useState({
    subject: '',
    day: '',
    tutorId: '',
    startTime: '',
    minRating: '',
    status: '',
    isOnline: '',
    availableOnly: true
  })
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  
  // Class selection step (0: select tutor, 1: view classes)
  const [classSelectionStep, setClassSelectionStep] = useState<0 | 1>(0)
  const [selectedClassTutor, setSelectedClassTutor] = useState<any>(null)
  const [classTutorPage, setClassTutorPage] = useState(1)
  const classTutorsPerPage = 6
  
  // Booking result states
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookedSessionId, setBookedSessionId] = useState('')
  
  // Backend data states
  const [tutors, setTutors] = useState<any[]>([])
  const [selectedTutorData, setSelectedTutorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const tutorIdFromState = (location.state as any)?.tutorId
  
  // Pagination for tutors list
  const [tutorPage, setTutorPage] = useState(1)
  const tutorsPerPage = 6

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Load tutors and data when in class mode
  useEffect(() => {
    if (bookingMode === 'class') {
      loadAvailableSubjects()
      loadAvailableTutors()
      loadMyEnrollments()
      // Reset class selection when switching to class mode
      setClassSelectionStep(0)
      setSelectedClassTutor(null)
    }
  }, [bookingMode])

  // Load classes when tutor is selected in class mode
  useEffect(() => {
    if (bookingMode === 'class' && classSelectionStep === 1 && selectedClassTutor) {
      loadClasses()
    }
  }, [bookingMode, classSelectionStep, selectedClassTutor])

  // Load available subjects and start times from all classes in database
  const loadAvailableSubjects = async () => {
    try {
      // Load all classes to get unique subjects and start times
      const response = await api.classes.list({ limit: 100, page: 1 })
      if (response.success && response.data) {
        // Extract unique subjects from classes
        const subjects = [...new Set(response.data.map((cls: any) => cls.subject).filter(Boolean))] as string[]
        setAvailableSubjects(subjects.sort())
        
        // Extract unique start times from classes
        const startTimes = [...new Set(response.data.map((cls: any) => cls.startTime).filter(Boolean))] as string[]
        setAvailableStartTimes(startTimes.sort())
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
    }
  }

  // Load available tutors from classes
  const loadAvailableTutors = async () => {
    try {
      // Load all classes to get unique tutor IDs
      const response = await api.classes.list({ limit: 100, page: 1 })
      if (response.success && response.data) {
        // Extract unique tutor IDs from classes
        const tutorIds = [...new Set(response.data.map((cls: any) => cls.tutorId).filter(Boolean))] as string[]
        
        // Load tutor details for each tutor ID
        const tutorPromises = tutorIds.map(async (tutorId: string) => {
          try {
            const tutorResponse = await api.users.get(tutorId)
            if (tutorResponse.success && tutorResponse.data) {
              return tutorResponse.data
            }
          } catch (error) {
            console.error(`Failed to load tutor ${tutorId}:`, error)
          }
          return null
        })
        
        const tutorResults = await Promise.all(tutorPromises)
        const tutors = tutorResults.filter(t => t !== null).sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        )
        setAvailableTutors(tutors)
      }
    } catch (error) {
      console.error('Failed to load tutors:', error)
    }
  }

  const loadClasses = async () => {
    try {
      setClassesLoading(true)
      const params: any = { 
        availableOnly: classFilters.availableOnly ? 'true' : undefined,
        limit: 100, // Load up to 100 classes (or all if less than 100)
        page: 1
      }
      // If tutor is selected, filter by tutor
      if (selectedClassTutor) {
        params.tutorId = selectedClassTutor.id
      }
      if (classFilters.subject) params.subject = classFilters.subject
      if (classFilters.day) params.day = classFilters.day
      if (classFilters.status) params.status = classFilters.status
      
      const response = await api.classes.list(params)
      if (response.success && response.data) {
        // Enrich classes with tutor info
        const enrichedClasses = await Promise.all(
          response.data.map(async (cls: any) => {
            try {
              const tutorResponse = await api.users.get(cls.tutorId)
              if (tutorResponse.success && tutorResponse.data) {
                return { ...cls, tutor: tutorResponse.data }
              }
            } catch (error) {
              console.error(`Failed to load tutor for class ${cls.id}:`, error)
            }
            return cls
          })
        )
        setClasses(enrichedClasses)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setClassesLoading(false)
    }
  }

  const loadMyEnrollments = async () => {
    try {
      setEnrollmentsLoading(true)
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      
      const user = JSON.parse(userStr)
      const response = await api.enrollments.list({ studentId: user.id })
      if (response.success && response.data) {
        setMyEnrollments(response.data)
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error)
    } finally {
      setEnrollmentsLoading(false)
    }
  }

  const handleEnrollClass = async () => {
    if (!selectedClass) return
    
    try {
      setEnrolling(true)
      const response = await api.enrollments.create({ classId: selectedClass.id })
      if (response.success) {
        setBookingSuccess(true)
        setEnrollDialogOpen(false)
        loadClasses()
        loadMyEnrollments()
        setTimeout(() => setBookingSuccess(false), 3000)
      } else {
        setBookingError(response.error || 'Failed to enroll in class')
      }
    } catch (error: any) {
      console.error('Enrollment error:', error)
      setBookingError(error.message || 'An error occurred while enrolling')
    } finally {
      setEnrolling(false)
    }
  }

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this enrollment?')) return
    
    try {
      const response = await api.enrollments.delete(enrollmentId)
      if (response.success) {
        setBookingSuccess(true)
        loadClasses()
        loadMyEnrollments()
        setTimeout(() => setBookingSuccess(false), 3000)
      } else {
        setBookingError(response.error || 'Failed to cancel enrollment')
      }
    } catch (error: any) {
      console.error('Cancel enrollment error:', error)
      setBookingError(error.message || 'An error occurred')
    }
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

  // Load tutors data from backend
  useEffect(() => {
    const loadTutors = async () => {
      try {
        setLoading(true)
        const result = await api.tutors.list({ limit: 20 })
        
        if (result && result.data) {
          setTutors(result.data)
          
          // If tutorId is provided, pre-select that tutor
          if (tutorIdFromState) {
            const preSelectedTutor = result.data.find((t: any) => t.id === tutorIdFromState)
            if (preSelectedTutor) {
              setSelectedTutor(preSelectedTutor.id)
              setSelectedTutorData(preSelectedTutor)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load tutors:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTutors()
  }, [tutorIdFromState])

  const steps = [
    { label: 'Select Tutor', icon: <Person /> },
    { label: 'Select Subject', icon: <School /> },
    { label: 'Select Duration', icon: <Schedule /> },
    { label: 'Choose Date & Time', icon: <CalendarToday /> },
    { label: 'Session Details', icon: <Schedule /> },
  ]

  // Load availability when tutor is selected
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedTutor) {
        setAvailableSlots([])
        setDateSelectionStep('date')
        setSelectedDate('')
        setSelectedTime('')
        return
      }

      try {
        setAvailabilityLoading(true)
        setDateSelectionStep('date')
        setSelectedDate('')
        setSelectedTime('')
        // Get availability excluding class schedules
        const result = await api.availability.get(selectedTutor, true)
        
        if (result && result.data && result.data.timeSlots) {
          // Generate time slots for the next 7 days based on availability
          const slots: any[] = []
          const today = new Date()
          
          for (let i = 0; i < 14; i++) { // Next 14 days
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
            
            // Find availability for this day
            const dayAvailability = result.data.timeSlots.filter(
              (slot: any) => slot.day === dayName
            )
            
            if (dayAvailability.length > 0) {
              dayAvailability.forEach((avail: any) => {
                // Generate hourly slots between startTime and endTime
                const [startHour, startMin] = avail.startTime.split(':').map(Number)
                const [endHour, endMin] = avail.endTime.split(':').map(Number)
                
                const startMinutes = startHour * 60 + startMin
                const endMinutes = endHour * 60 + endMin
                
                // Generate slots based on selected duration
                // Make sure there's enough time for the full duration
                for (let minutes = startMinutes; minutes + selectedDuration <= endMinutes; minutes += selectedDuration) {
                  const hour = Math.floor(minutes / 60)
                  const min = minutes % 60
                  
                  // Calculate end time for this slot
                  const endSlotMinutes = minutes + selectedDuration
                  const endSlotHour = Math.floor(endSlotMinutes / 60)
                  const endSlotMin = endSlotMinutes % 60
                  
                  // Format start time as 12-hour format
                  const period = hour >= 12 ? 'PM' : 'AM'
                  const hour12 = hour % 12 || 12
                  const timeStr = `${hour12}:${min.toString().padStart(2, '0')} ${period}`
                  
                  // Format end time
                  const endPeriod = endSlotHour >= 12 ? 'PM' : 'AM'
                  const endHour12 = endSlotHour % 12 || 12
                  const endTimeStr = `${endHour12}:${endSlotMin.toString().padStart(2, '0')} ${endPeriod}`
                  
                  slots.push({
                    date: date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    }),
                    time: timeStr,
                    endTime: endTimeStr,
                    available: true,
                    dayName: dayName,
                    duration: selectedDuration
                  })
                }
              })
            }
          }
          
          setAvailableSlots(slots)
        } else {
          setAvailableSlots([])
        }
      } catch (error) {
        console.error('Failed to load availability:', error)
        setAvailableSlots([])
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailability()
  }, [selectedTutor, selectedDuration])

  const handleNext = async () => {
    // If at final step (Session Details), book the session
    if (activeStep === steps.length - 1) {
      await handleBookSession()
    } else {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }
  
  const handleBookSession = async () => {
    try {
      setBookingError('')
      
      // Calculate start and end time
      const [dateStr] = selectedDate.split(' ') // Get MM/DD/YYYY part
      const selectedSlot = availableSlots.find(s => s.time === selectedTime)
      
      if (!selectedSlot) {
        setBookingError('Invalid time slot selected')
        return
      }
      
      // Parse date and time
      const [month, day, year] = dateStr.split('/').map(Number)
      const startDateTime = new Date(year, month - 1, day)
      
      // Parse start time (e.g., "10:00 AM")
      const [timeStr, period] = selectedTime.split(' ')
      const [hours, minutes] = timeStr.split(':').map(Number)
      let hour24 = hours
      if (period === 'PM' && hours !== 12) hour24 += 12
      if (period === 'AM' && hours === 12) hour24 = 0
      
      startDateTime.setHours(hour24, minutes, 0, 0)
      
      // Calculate end time
      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedDuration)
      
      // Prepare booking data
      const bookingData = {
        tutorId: selectedTutor,
        subject: selectedSubject || 'General',
        topic: sessionNotes || 'Tutoring session',
        description: sessionNotes,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: selectedDuration,
        isOnline: sessionType === 'online',
        notes: sessionNotes
      }
      
      // Call API
      const response = await api.sessions.create(bookingData)
      
      if (response.success) {
        setBookingSuccess(true)
        setBookedSessionId(response.data.id)
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      } else {
        setBookingError(response.message || 'Booking failed')
      }
    } catch (error: any) {
      console.error('Booking error:', error)
      setBookingError(error.message || 'An error occurred while booking the session')
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  const renderStepContent = (step: number) => {
    if (step < 0 || step >= steps.length) {
      return (
        <div className="text-center py-8">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Invalid step. Please refresh the page.
          </p>
        </div>
      )
    }
    
    switch (step) {
      case 0:
        // Calculate pagination
        const totalTutorPages = Math.ceil(tutors.length / tutorsPerPage)
        const startIndex = (tutorPage - 1) * tutorsPerPage
        const endIndex = startIndex + tutorsPerPage
        const currentTutors = tutors.slice(startIndex, endIndex)
        
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Choose a Tutor
              </h2>
              {!loading && totalTutorPages > 1 && (
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Page {tutorPage} of {totalTutorPages}
                </span>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading tutors...</p>
              </div>
            ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {currentTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTutor === tutor.id
                        ? 'border-blue-500 bg-blue-100'
                        : `${theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'}`
                    }`}
                      onClick={() => {
                        setSelectedTutor(tutor.id)
                        setSelectedTutorData(tutor)
                      }}
                    >
                    <div className="flex items-center mb-3">
                        <Avatar
                          src={tutor.avatar}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: getAvatarColor(tutor.name),
                            fontSize: '1.25rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(tutor.name)}
                        </Avatar>
                      <div className="ml-3">
                        <h3 className={`font-semibold ${
                          selectedTutor === tutor.id
                            ? 'text-blue-900'
                            : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {tutor.name}
                        </h3>
                        <p className={`text-sm ${
                          selectedTutor === tutor.id
                            ? 'text-blue-700'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {tutor.subjects?.[0] || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {(tutor.subjects || []).slice(0, 3).map((subject: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalTutorPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    onClick={() => setTutorPage(prev => Math.max(1, prev - 1))}
                    disabled={tutorPage === 1}
                    style={{
                      backgroundColor: tutorPage === 1 ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                      color: tutorPage === 1 ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                      textTransform: 'none',
                      padding: '8px 16px'
                    }}
                  >
                    Previous
                  </Button>
                  <span className={`px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tutorPage} / {totalTutorPages}
                  </span>
                  <Button
                    onClick={() => setTutorPage(prev => Math.min(totalTutorPages, prev + 1))}
                    disabled={tutorPage === totalTutorPages}
                    style={{
                      backgroundColor: tutorPage === totalTutorPages ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                      color: tutorPage === totalTutorPages ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                      textTransform: 'none',
                      padding: '8px 16px'
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
            )}
          </div>
        )

      case 1:
        // Subject Selection
        const tutorSubjects = selectedTutorData?.subjects || []
        
        return (
          <div>
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Select Subject
            </h2>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose the subject you want to learn from{' '}
              <span className="font-semibold">{selectedTutorData?.name || 'this tutor'}</span>:
            </p>
            {tutorSubjects.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No subjects available for this tutor
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorSubjects.map((subject: string, index: number) => (
                  <div
                    key={index}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedSubject === subject
                        ? 'border-blue-500 bg-blue-50'
                        : `${theme === 'dark' ? 'border-gray-600 hover:border-blue-400 bg-gray-800' : 'border-gray-200 hover:border-blue-400 bg-white'}`
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <School className={`w-6 h-6 mr-3 ${
                          selectedSubject === subject
                            ? 'text-blue-600'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <h3 className={`text-lg font-bold ${
                          selectedSubject === subject
                            ? 'text-blue-900'
                            : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {subject}
                        </h3>
                      </div>
                      {selectedSubject === subject && (
                        <CheckCircleIcon className="text-blue-600 w-6 h-6" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 2:
        // Duration Selection
        const durationOptions = [
          { value: 30, label: '30 minutes', description: 'Quick review or Q&A' },
          { value: 60, label: '60 minutes', description: 'Standard lesson (Recommended)' },
          { value: 90, label: '90 minutes', description: 'In-depth learning' },
          { value: 120, label: '120 minutes', description: 'Intensive session' },
        ]

        return (
          <div>
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Select Session Duration
            </h2>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose how long you'd like your tutoring session to be:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {durationOptions.map((option) => {
                return (
                  <div
                    key={option.value}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDuration === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : `${theme === 'dark' ? 'border-gray-600 hover:border-blue-400 bg-gray-800' : 'border-gray-200 hover:border-blue-400 bg-white'}`
                    }`}
                    onClick={() => setSelectedDuration(option.value)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${
                          selectedDuration === option.value
                            ? 'text-blue-900'
                            : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {option.label}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          selectedDuration === option.value
                            ? 'text-blue-700'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                      {selectedDuration === option.value && (
                        <CheckCircleIcon className="text-blue-600 w-6 h-6 ml-3" />
                      )}
                    </div>
                    {option.value === 60 && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                💡 <strong>Tip:</strong> 60-minute sessions are ideal for most topics. Choose longer durations for complex subjects or exam preparation.
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {dateSelectionStep === 'date' ? 'Select Date' : 'Select Time'}
            </h2>
              {dateSelectionStep === 'time' && selectedDate && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setDateSelectionStep('date')
                    setSelectedTime('')
                  }}
                  style={{
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
                    textTransform: 'none',
                  }}
                >
                  ← Change Date
                </Button>
              )}
            </div>
            {!selectedTutor ? (
              <div className="text-center py-12">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please select a tutor first
                </p>
              </div>
            ) : availabilityLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading available time slots...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No available time slots found for this tutor
                </p>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  The tutor may not have set their availability yet
                </p>
              </div>
            ) : dateSelectionStep === 'date' ? (
              // Step 1: Select Date
              <div>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose an available date:
                </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    // Group slots by date
                    const dateGroups = availableSlots.reduce((acc: any, slot) => {
                      if (!acc[slot.date]) {
                        acc[slot.date] = {
                          date: slot.date,
                          dayName: slot.dayName,
                          count: 0
                        }
                      }
                      acc[slot.date].count++
                      return acc
                    }, {})
                    
                    const uniqueDates = Object.values(dateGroups)
                    
                    return uniqueDates.map((dateInfo: any, index) => {
                      const dateObj = new Date(dateInfo.date)
                      
                      return (
                <div
                  key={index}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            theme === 'dark' 
                              ? 'border-gray-600 hover:border-blue-500 bg-gray-800' 
                              : 'border-gray-200 hover:border-blue-500 bg-white'
                          }`}
                          onClick={() => {
                            setSelectedDate(dateInfo.date)
                            setDateSelectionStep('time')
                          }}
                        >
                          <div className="text-center">
                            <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {dateObj.getDate()}
                            </p>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                              {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`text-xs mt-2 px-2 py-1 rounded-full ${
                              theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                            }`}>
                              {dateInfo.count} slots
                            </p>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            ) : (
              // Step 2: Select Time
              <div>
                <div className={`mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                    Selected Date: {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose an available time slot:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {availableSlots
                    .filter(slot => slot.date === selectedDate)
                    .map((slot, index) => (
                      <div
                        key={index}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTime === slot.time
                      ? 'border-blue-500 bg-blue-100'
                      : slot.available
                            ? `${theme === 'dark' ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-200 hover:border-blue-500 bg-white'}`
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedTime(slot.time)
                      }
                    }}
                  >
                  <div className="text-center">
                          <p className={`font-medium text-sm ${
                            selectedTime === slot.time
                        ? 'text-blue-900'
                        : theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                            {slot.time}
                    </p>
                          <p className={`text-xs ${
                            selectedTime === slot.time
                        ? 'text-blue-700'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                            {slot.endTime}
                          </p>
                          <p className={`text-xs mt-1 ${
                            selectedTime === slot.time
                              ? 'text-blue-700'
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ({selectedDuration} min)
                          </p>
                  </div>
                </div>
              ))}
            </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div>
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Session Details
            </h2>
            
            {/* Summary of selections */}
            <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                📋 Session Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tutor:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTutorData?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subject:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSubject || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Duration:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Date:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDate || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Time:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTime ? (
                      <>
                        {selectedTime}
                        {availableSlots.find(s => s.time === selectedTime)?.endTime && 
                          ` - ${availableSlots.find(s => s.time === selectedTime)?.endTime}`
                        }
                      </>
                    ) : 'Not selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Session Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sessionType"
                      value="online"
                      checked={sessionType === 'online'}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="mr-3"
                    />
                    <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Online Video Call
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sessionType"
                      value="in-person"
                      checked={sessionType === 'in-person'}
                    onChange={(e) => setSessionType(e.target.value)}
                      className="mr-3"
                    />
                    <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      In-Person Meeting
                    </span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Any specific topics you'd like to focus on? Any questions or concerns?"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
          </div>
        )

      default:
        return 'Unknown step'
    }
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

            {/* Progress Steps */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                BOOKING PROGRESS
              </h3>
              <div className="space-y-3">
          {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg ${
                      index <= activeStep
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index < activeStep ? 'bg-blue-600 text-white' : 
                      index === activeStep ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {index < activeStep ? <CheckCircleIcon className="w-5 h-5" /> : 
                       index === activeStep ? <span className="text-sm font-bold">{index + 1}</span> :
                       <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      {index === activeStep && (
                        <p className="text-xs opacity-75">Current step</p>
                      )}
                    </div>
                  </div>
                ))}
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
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {bookingMode === 'session' ? 'Book a Session' : 'Browse Classes'}
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {bookingMode === 'session' 
                    ? 'Find the perfect tutor for your learning needs'
                    : 'Enroll in classes for the entire semester'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  className={`p-2 rounded-lg ${activeStep === 0 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <ArrowBackIcon className="w-4 h-4" />
                </button>
                <button 
                      onClick={handleNext}
                  disabled={activeStep === steps.length - 1}
                  className={`p-2 rounded-lg ${activeStep === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <ArrowForwardIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', mb: 3 }}>
              <Tabs 
                value={bookingMode === 'session' ? 0 : 1} 
                onChange={(_, newValue) => setBookingMode(newValue === 0 ? 'session' : 'class')}
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
                  icon={<Schedule />} 
                  label="Book Session" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<ClassIcon />} 
                  label="Browse Classes" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>

            {/* Success Message */}
            {bookingSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {bookingMode === 'session' ? 'Session booked successfully!' : 'Enrolled successfully!'}
              </div>
            )}
            {bookingError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {bookingError}
              </div>
            )}

            {/* Progress Bar (for session mode only) */}
            {bookingMode === 'session' && activeStep < steps.length && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((activeStep + 1) / steps.length) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Step {Math.min(activeStep + 1, steps.length)} of {steps.length}: {steps[activeStep]?.label || 'Unknown Step'}
                </p>
              </>
            )}
          </div>

          {/* Content */}
          {bookingMode === 'session' ? (
            <>
            {/* Session Booking Content */}
            {activeStep < steps.length && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  {renderStepContent(activeStep)}
                </Card>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Session Summary */}
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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tutor:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTutor ? tutors.find(t => t.id.toString() === selectedTutor)?.name || 'Not selected' : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDate || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Time:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTime || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDuration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessionType || 'Not selected'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Help Section */}
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Need Help?
                  </h3>
                  <div className="space-y-3">
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <ChatIcon className="mr-3 w-4 h-4" />
                      Contact Support
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <VideoCallIcon className="mr-3 w-4 h-4" />
                      Video Tutorial
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <LocationOnIcon className="mr-3 w-4 h-4" />
                      Find Centers
                    </button>
                  </div>
                </Card>
              </div>
            </div>
            )}

          {/* Navigation Buttons - Sticky Bottom (for session mode) */}
          {bookingMode === 'session' && activeStep < steps.length && (
            <div className={`sticky bottom-0 left-0 right-0 z-10 flex justify-between p-4 mt-8 border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
              <Button
                      onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
                className="flex items-center"
                style={{
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}
              >
                <ArrowBackIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: '600',
                  padding: '10px 24px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }}
              >
                {activeStep === steps.length - 1 ? 'Complete Booking' : 'Continue'}
                <ArrowForwardIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Completion Message (for session mode) */}
          {bookingMode === 'session' && activeStep >= steps.length && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Success Content */}
              <div className="lg:col-span-2">
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-8 text-center`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  {bookingSuccess ? (
                    <>
                      <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
                  <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        🎉 Đặt lịch thành công!
                  </h2>
                      <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Buổi học của bạn đã được đặt thành công. Gia sư sẽ nhận được thông báo ngay.
                      </p>
                      {bookedSessionId && (
                        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                          <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                            <strong>Session ID:</strong> {bookedSessionId}
                          </p>
                          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Bạn có thể xem chi tiết buổi học trong Calendar hoặc Session Details
                          </p>
                        </div>
                      )}
                  <div className="flex justify-center space-x-4">
                    <Button 
                      onClick={handleReset} 
                      variant="outlined"
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        borderColor: '#000000',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                        >
                          Đặt buổi học khác
                    </Button>
                    <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Về Dashboard
                    </Button>
                  </div>
                    </>
                  ) : bookingError ? (
                    <>
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">❌</span>
                      </div>
                      <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Đặt lịch thất bại
                      </h2>
                      <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>
                          {bookingError}
                        </p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Button 
                          onClick={() => {
                            setActiveStep(steps.length - 1)
                            setBookingError('')
                          }} 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Thử lại
                        </Button>
                        <Button 
                          onClick={() => navigate('/student')} 
                          variant="outlined"
                          style={{
                            textTransform: 'none'
                          }}
                        >
                          Về Dashboard
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Booking Complete!
                      </h2>
                      <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your session has been successfully booked.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button onClick={handleReset} variant="outlined">Book Another</Button>
                        <Button onClick={() => navigate('/student')} className="bg-blue-600">Dashboard</Button>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Session Summary */}
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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tutor:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTutor ? tutors.find(t => t.id.toString() === selectedTutor)?.name || 'Not selected' : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDate || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Time:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTime || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedDuration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessionType || 'Not selected'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Help Section */}
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Need Help?
                  </h3>
                  <div className="space-y-3">
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <ChatIcon className="mr-3 w-4 h-4" />
                      Contact Support
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <VideoCallIcon className="mr-3 w-4 h-4" />
                      Video Tutorial
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <LocationOnIcon className="mr-3 w-4 h-4" />
                      Find Centers
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}
          </>
          ) : (
            /* Classes Browsing Content */
            <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  {classSelectionStep === 0 ? (
                    // Step 1: Select Tutor
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Choose a Tutor
                        </h2>
                        {availableTutors.length > classTutorsPerPage && (
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Page {classTutorPage} of {Math.ceil(availableTutors.length / classTutorsPerPage)}
                          </span>
                        )}
                      </div>
                      {availableTutors.length === 0 ? (
                        <div className="text-center py-8">
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading tutors...</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {(() => {
                              const startIndex = (classTutorPage - 1) * classTutorsPerPage
                              const endIndex = startIndex + classTutorsPerPage
                              const currentTutors = availableTutors.slice(startIndex, endIndex)
                              
                              return currentTutors.map((tutor) => (
                                <div
                                  key={tutor.id}
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    selectedClassTutor?.id === tutor.id
                                      ? 'border-blue-500 bg-blue-100'
                                      : `${theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'}`
                                  }`}
                                  onClick={() => {
                                    setSelectedClassTutor(tutor)
                                    setClassSelectionStep(1)
                                  }}
                                >
                                  <div className="flex items-center mb-3">
                                    <Avatar
                                      src={tutor.avatar}
                                      sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: getAvatarColor(tutor.name),
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {getInitials(tutor.name)}
                                    </Avatar>
                                    <div className="ml-3">
                                      <h3 className={`font-semibold ${
                                        selectedClassTutor?.id === tutor.id
                                          ? 'text-blue-900'
                                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                                      }`}>
                                        {tutor.name}
                                      </h3>
                                      <p className={`text-sm ${
                                        selectedClassTutor?.id === tutor.id
                                          ? 'text-blue-700'
                                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {tutor.subjects?.[0] || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {(tutor.subjects || []).slice(0, 3).map((subject: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                      >
                                        {subject}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            })()}
                          </div>
                          
                          {/* Pagination Controls */}
                          {availableTutors.length > classTutorsPerPage && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                              <Button
                                onClick={() => setClassTutorPage(prev => Math.max(1, prev - 1))}
                                disabled={classTutorPage === 1}
                                style={{
                                  backgroundColor: classTutorPage === 1 ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                                  color: classTutorPage === 1 ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                                  textTransform: 'none',
                                  padding: '8px 16px'
                                }}
                              >
                                Previous
                              </Button>
                              <span className={`px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {classTutorPage} / {Math.ceil(availableTutors.length / classTutorsPerPage)}
                              </span>
                              <Button
                                onClick={() => setClassTutorPage(prev => Math.min(Math.ceil(availableTutors.length / classTutorsPerPage), prev + 1))}
                                disabled={classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage)}
                                style={{
                                  backgroundColor: classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage) ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                                  color: classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage) ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                                  textTransform: 'none',
                                  padding: '8px 16px'
                                }}
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // Step 2: View Classes of Selected Tutor
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Classes by {selectedClassTutor?.name || 'Tutor'}
                          </h2>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Select a class to enroll
                          </p>
                        </div>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setClassSelectionStep(0)
                            setSelectedClassTutor(null)
                          }}
                          style={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
                            textTransform: 'none',
                          }}
                        >
                          ← Change Tutor
                        </Button>
                      </div>
                      
                      {classesLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Loading classes...
                          </p>
                        </div>
                      ) : classes.length === 0 ? (
                        <Card 
                          className={`p-12 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} text-center`}
                          style={{
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            boxShadow: 'none !important'
                          }}
                        >
                          <ClassIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No classes available for this tutor
                          </p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {classes.map((cls) => {
                            const isEnrolled = myEnrollments.some(e => e.classId === cls.id && e.status === 'active')
                            const isFull = cls.currentEnrollment >= cls.maxStudents
                            
                            return (
                              <Card
                                key={cls.id}
                                className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                style={{
                                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                  boxShadow: 'none !important'
                                }}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {cls.code}
                                      </h4>
                                      {isEnrolled && (
                                        <Chip 
                                          label="Enrolled" 
                                          size="small"
                                          color="success"
                                        />
                                      )}
                                      {isFull && !isEnrolled && (
                                        <Chip 
                                          label="Full" 
                                          size="small"
                                          color="warning"
                                        />
                                      )}
                                    </div>
                                    <p className={`text-sm mb-2 font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                      {cls.subject}
                                    </p>
                                    {cls.description && (
                                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {cls.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <CalendarToday className="w-4 h-4" />
                                    <span>{cls.day.charAt(0).toUpperCase() + cls.day.slice(1)}</span>
                                  </div>
                                  <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <AccessTime className="w-4 h-4" />
                                    <span>{cls.startTime} - {cls.endTime} ({cls.duration} min)</span>
                                  </div>
                                  <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <GroupIcon className="w-4 h-4" />
                                    <span>{cls.currentEnrollment || 0} / {cls.maxStudents} students</span>
                                  </div>
                                  <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <EventIcon className="w-4 h-4" />
                                    <span>{new Date(cls.semesterStart).toLocaleDateString()} - {new Date(cls.semesterEnd).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <Button
                                  onClick={() => {
                                    setSelectedClass(cls)
                                    setEnrollDialogOpen(true)
                                  }}
                                  disabled={isEnrolled || isFull}
                                  fullWidth
                                  style={{
                                    backgroundColor: isEnrolled || isFull ? '#9ca3af' : '#2563eb',
                                    color: '#ffffff',
                                    textTransform: 'none'
                                  }}
                                >
                                  {isEnrolled ? 'Already Enrolled' : isFull ? 'Class Full' : 'Enroll Now'}
                                </Button>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Selected Tutor Summary */}
                {selectedClassTutor && (
                  <Card 
                    className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                    style={{
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      boxShadow: 'none !important'
                    }}
                  >
                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Selected Tutor
                    </h3>
                    <div className="flex items-center mb-4">
                      <Avatar
                        src={selectedClassTutor.avatar}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: getAvatarColor(selectedClassTutor.name),
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          mr: 2
                        }}
                      >
                        {getInitials(selectedClassTutor.name)}
                      </Avatar>
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {selectedClassTutor.name}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedClassTutor.subjects?.[0] || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedClassTutor.subjects && selectedClassTutor.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedClassTutor.subjects.slice(0, 5).map((subject: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Help Section */}
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Need Help?
                  </h3>
                  <div className="space-y-3">
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <ChatIcon className="mr-3 w-4 h-4" />
                      Contact Support
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <VideoCallIcon className="mr-3 w-4 h-4" />
                      Video Tutorial
                    </button>
                    <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <LocationOnIcon className="mr-3 w-4 h-4" />
                      Find Centers
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            {/* My Enrollments Section - Full Width Below */}
            {myEnrollments.length > 0 && (
              <div className="mt-8">
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  My Enrolled Classes
                </h3>
                {enrollmentsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myEnrollments.map((enrollment) => (
                      <Card
                        key={enrollment.id}
                        className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          boxShadow: 'none !important'
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {enrollment.class?.code}
                            </h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                              {enrollment.class?.subject}
                            </p>
                          </div>
                          <Chip 
                            label={enrollment.status} 
                            size="small"
                            color={enrollment.status === 'active' ? 'success' : 'default'}
                          />
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <CalendarToday className="w-4 h-4" />
                            <span>{enrollment.class?.day}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <AccessTime className="w-4 h-4" />
                            <span>{enrollment.class?.startTime} - {enrollment.class?.endTime}</span>
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>

                        {enrollment.status === 'active' && (
                          <Button
                            onClick={() => navigate(`/student/class/${enrollment.classId}`)}
                            fullWidth
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              textTransform: 'none'
                            }}
                          >
                            View Class LMS
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Enroll Confirmation Dialog */}
      <Dialog 
        open={enrollDialogOpen} 
        onClose={() => setEnrollDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className={theme === 'dark' ? 'bg-gray-800 text-white' : ''}>
          Confirm Enrollment
        </DialogTitle>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800' : ''}>
          {selectedClass && (
            <div className="space-y-4 pt-4">
              <div>
                <p className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedClass.code} - {selectedClass.subject}
                </p>
                {selectedClass.description && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedClass.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Schedule:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedClass.day} {selectedClass.startTime} - {selectedClass.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedClass.duration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Semester:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(selectedClass.semesterStart).toLocaleDateString()} - {new Date(selectedClass.semesterEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Capacity:</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedClass.currentEnrollment || 0} / {selectedClass.maxStudents} students
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                  ℹ️ You will be enrolled for the entire semester. Sessions will be automatically created.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className={theme === 'dark' ? 'bg-gray-800' : ''}>
          <Button 
            onClick={() => setEnrollDialogOpen(false)}
            variant="outlined"
            style={{
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnrollClass}
            disabled={enrolling}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textTransform: 'none'
            }}
          >
            {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>

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

              {/* Mobile Progress Steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg ${
                      index <= activeStep
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index < activeStep ? 'bg-blue-600 text-white' : 
                      index === activeStep ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {index < activeStep ? <CheckCircleIcon className="w-5 h-5" /> : 
                       index === activeStep ? <span className="text-sm font-bold">{index + 1}</span> :
                       <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      {index === activeStep && (
                        <p className="text-xs opacity-75">Current step</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookSession
