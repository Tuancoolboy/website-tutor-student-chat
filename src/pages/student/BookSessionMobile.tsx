import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Avatar, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Tabs, 
  Tab, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FilterListIcon from '@mui/icons-material/FilterList'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import api from '../../lib/api'
import { 
  CalendarToday, 
  Schedule, 
  Person, 
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  LocationOn as LocationOnIcon,
  Close as CloseIcon,
  Star,
  Dashboard as DashboardIcon,
  PersonSearch,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  Class as ClassIcon,
  SmartToy as SmartToyIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Group as GroupIcon,
  AccessTime,
  Event as EventIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const BookSessionMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [bookingMode, setBookingMode] = useState<'session' | 'class'>('session') // Default to session mode
  const [activeStep, setActiveStep] = useState(0)
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const filterCardRef = useRef<HTMLDivElement>(null)
  const [selectedTutor, setSelectedTutor] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('') // Selected subject
  const [selectedDuration, setSelectedDuration] = useState<number>(60) // Duration in minutes
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionType, setSessionType] = useState('online') // Default to online
  const [sessionNotes, setSessionNotes] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeMenu, setActiveMenu] = useState('book-session')
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
  
  // Dropdown states removed - using MUI components now
  
  // Filter options
  const dayOptions = [
    { value: '', label: 'All Days' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]
  
  const minRatingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '4.5', label: '4.5⭐ and above' },
    { value: '4.0', label: '4.0⭐ and above' },
    { value: '3.5', label: '3.5⭐ and above' },
    { value: '3.0', label: '3.0⭐ and above' }
  ]
  
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'full', label: 'Full' },
    { value: 'inactive', label: 'Inactive' }
  ]
  
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'true', label: 'Online' },
    { value: 'false', label: 'In-Person' }
  ]
  
  const defaultStartTimes = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
  
  // Booking result states
  const [bookingLoading, setBookingLoading] = useState(false)
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
    { id: 'book-session', label: 'Book Session', icon: <SchoolIcon />, path: '/student/book' },
    { id: 'view-progress', label: 'View Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { id: 'evaluate-session', label: 'Evaluate Session', icon: <Star />, path: '/student/evaluate' },
    { id: 'session-detail', label: 'Session Details', icon: <ClassIcon />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' }
  ]

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

  // GSAP Animations for mobile
  useGSAP(() => {
    // Set initial styles for performance
    gsap.set('.animated-card, .tutor-card-item, .class-card-item', {
      willChange: 'transform, opacity',
      force3D: true
    })

    // Animate step transitions
    if (stepContentRef.current) {
      gsap.fromTo(stepContentRef.current,
        { opacity: 0, x: 20, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
      )
    }

    // Cleanup
    return () => {
      gsap.killTweensOf('.animated-card, .tutor-card-item, .class-card-item, .step-content')
    }
  }, { scope: containerRef, dependencies: [activeStep, bookingMode] })

  // Animate tutor cards entrance
  useEffect(() => {
    if (tutors.length > 0 && activeStep === 0) {
      gsap.fromTo('.tutor-card-item',
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          force3D: true
        }
      )
    }
  }, [tutors, activeStep])

  // Animate class cards entrance
  useEffect(() => {
    if (classes.length > 0 && bookingMode === 'class') {
      gsap.fromTo('.class-card-item',
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          force3D: true,
          delay: 0.2
        }
      )
    }
  }, [classes, bookingMode])

  // Animate tab switching
  useEffect(() => {
    if (tabContainerRef.current) {
      gsap.fromTo(tabContainerRef.current,
        { opacity: 0.7, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [bookingMode])

  // Animate filter card
  useEffect(() => {
    if (filterCardRef.current && bookingMode === 'class') {
      gsap.fromTo(filterCardRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
      )
    }
  }, [bookingMode, classFilters])

  // Animate success/error messages
  useEffect(() => {
    if (bookingSuccess) {
      const successEl = document.querySelector('.success-message') as HTMLElement
      if (successEl) {
        gsap.fromTo(successEl,
          { opacity: 0, y: -20, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.4, 
            ease: 'back.out(1.4)',
            force3D: true
          }
        )
      }
    }
    if (bookingError) {
      const errorEl = document.querySelector('.error-message') as HTMLElement
      if (errorEl) {
        gsap.fromTo(errorEl,
          { opacity: 0, y: -20, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.4, 
            ease: 'back.out(1.4)',
            force3D: true
          }
        )
      }
    }
  }, [bookingSuccess, bookingError])

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
    { label: 'Select Tutor', icon: <Person />, shortLabel: 'Tutor' },
    { label: 'Select Subject', icon: <SchoolIcon />, shortLabel: 'Subject' },
    { label: 'Select Duration', icon: <Schedule />, shortLabel: 'Duration' },
    { label: 'Choose Date & Time', icon: <CalendarToday />, shortLabel: 'Time' },
    { label: 'Session Details', icon: <Schedule />, shortLabel: 'Details' },
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
          // Generate time slots for the next 14 days based on availability
          const slots: any[] = []
          const today = new Date()
          
          for (let i = 0; i < 14; i++) {
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
                for (let minutes = startMinutes; minutes + selectedDuration <= endMinutes; minutes += selectedDuration) {
                  const hour = Math.floor(minutes / 60)
                  const min = minutes % 60
                  
                  // Calculate end time
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

  const handleBookSession = async () => {
    try {
      setBookingLoading(true)
      setBookingError('')
      
      // Parse the selected date and time to create startTime
      const [datePart] = selectedDate.split(' ')
      const [month, day, year] = datePart.split('/')
      
      // Parse time (format: "9:00 AM" or "2:00 PM")
      const [timeStr, period] = selectedTime.split(' ')
      const [hourStr, minuteStr] = timeStr.split(':')
      let hour = parseInt(hourStr)
      const minute = parseInt(minuteStr)
      
      if (period === 'PM' && hour !== 12) {
        hour += 12
      } else if (period === 'AM' && hour === 12) {
        hour = 0
      }
      
      const startDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, minute)
      const endDateTime = new Date(startDateTime.getTime() + selectedDuration * 60000)
      
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
    } finally {
      setBookingLoading(false)
    }
  }

  const handleNext = () => {
    // If we're at the final step, book the session
    if (activeStep === steps.length - 1) {
      handleBookSession()
    } else {
      // Animate step transition
      if (stepContentRef.current) {
        gsap.to(stepContentRef.current, {
          opacity: 0,
          x: -20,
          scale: 0.98,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
            gsap.fromTo(stepContentRef.current,
              { opacity: 0, x: 20, scale: 0.98 },
              { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
            )
          }
        })
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      }
    }
  }

  const handleBack = () => {
    // Animate step transition
    if (stepContentRef.current) {
      gsap.to(stepContentRef.current, {
        opacity: 0,
        x: 20,
        scale: 0.98,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
          gsap.fromTo(stepContentRef.current,
            { opacity: 0, x: -20, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
          )
        }
      })
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setSelectedTutor('')
    setSelectedTutorData(null)
    setSelectedDuration(60)
    setSelectedDate('')
    setSelectedTime('')
    setSessionType('online')
    setSessionNotes('')
    setBookingSuccess(false)
    setBookingError('')
    setBookedSessionId('')
    setDateSelectionStep('date')
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
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Choose a Tutor
              </h2>
              {!loading && totalTutorPages > 1 && (
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tutorPage}/{totalTutorPages}
                </span>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading tutors...</p>
              </div>
            ) : (
            <>
              <div className="space-y-3">
                {currentTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className={`tutor-card-item p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedTutor === tutor.id
                      ? `border-blue-500 ${theme === 'dark' ? 'bg-blue-900/30 shadow-lg' : 'bg-blue-50 shadow-lg'}`
                      : `${theme === 'dark' ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white'} shadow-sm`
                  }`}
                  onClick={(e) => {
                    // GSAP animation on click
                    const card = e.currentTarget
                    gsap.to(card, {
                      scale: 0.97,
                      duration: 0.1,
                      ease: 'power2.out',
                      yoyo: true,
                      repeat: 1,
                      onComplete: () => {
                    setSelectedTutor(tutor.id)
                    setSelectedTutorData(tutor)
                        gsap.to(card, {
                          scale: 1,
                          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                          duration: 0.3,
                          ease: 'power2.out'
                        })
                      }
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTutor !== tutor.id) {
                      gsap.to(e.currentTarget, {
                        y: -2,
                        scale: 1.01,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        duration: 0.2,
                        ease: 'power2.out',
                        force3D: true
                      })
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTutor !== tutor.id) {
                      gsap.to(e.currentTarget, {
                        y: 0,
                        scale: 1,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        duration: 0.2,
                        ease: 'power2.out',
                        force3D: true
                      })
                    }
                  }}
                >
                  <div className="flex items-start">
                    <Avatar
                      src={tutor.avatar}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: getAvatarColor(tutor.name),
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(tutor.name)}
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold text-sm ${
                          selectedTutor === tutor.id
                            ? theme === 'dark' ? 'text-blue-200' : 'text-blue-900'
                            : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {tutor.name}
                        </h3>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          <span className={`text-xs font-medium ${
                            selectedTutor === tutor.id
                              ? theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {tutor.rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs mb-2 ${
                        selectedTutor === tutor.id
                          ? theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {tutor.subjects?.[0] || 'N/A'}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(tutor.subjects || []).slice(0, 3).map((subject: string, index: number) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              selectedTutor === tutor.id && theme === 'dark'
                                ? 'bg-blue-800 text-blue-200'
                                : selectedTutor === tutor.id
                                ? 'bg-blue-100 text-blue-800'
                                : theme === 'dark'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                      {tutor.experience && (
                      <div className="text-xs">
                        <span className={`${
                          selectedTutor === tutor.id && theme === 'dark'
                            ? 'text-blue-300'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {tutor.experience}
                        </span>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls - Mobile */}
            {totalTutorPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  onClick={() => setTutorPage(prev => Math.max(1, prev - 1))}
                  disabled={tutorPage === 1}
                  style={{
                    backgroundColor: tutorPage === 1 ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                    color: tutorPage === 1 ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                    textTransform: 'none',
                    padding: '6px 12px',
                    fontSize: '14px',
                    minWidth: '70px'
                  }}
                >
                  Trước
                </Button>
                <span className={`px-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {tutorPage}/{totalTutorPages}
                </span>
                <Button
                  onClick={() => setTutorPage(prev => Math.min(totalTutorPages, prev + 1))}
                  disabled={tutorPage === totalTutorPages}
                  style={{
                    backgroundColor: tutorPage === totalTutorPages ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                    color: tutorPage === totalTutorPages ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                    textTransform: 'none',
                    padding: '6px 12px',
                    fontSize: '14px',
                    minWidth: '70px'
                  }}
                >
                  Sau
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
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Select Subject
            </h2>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose subject for{' '}
              <span className="font-semibold">{selectedTutorData?.name || 'this tutor'}</span>:
            </p>
            {tutorSubjects.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No subjects available
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
                {tutorSubjects.map((subject: string, index: number) => (
                <div
                  key={index}
                  className={`animated-card p-4 border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                      selectedSubject === subject
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : `${theme === 'dark' ? 'border-gray-600 hover:border-blue-400 bg-gray-800' : 'border-gray-200 hover:border-blue-400 bg-white'}`
                    }`}
                  onClick={(e) => {
                    const card = e.currentTarget
                    gsap.to(card, {
                      scale: 0.95,
                      duration: 0.1,
                      ease: 'power2.out',
                      yoyo: true,
                      repeat: 1,
                      onComplete: () => {
                        setSelectedSubject(subject)
                        gsap.to(card, {
                          scale: 1.02,
                          boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                          duration: 0.3,
                          ease: 'back.out(1.4)',
                          force3D: true
                        })
                      }
                    })
                  }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <SchoolIcon className={`w-5 h-5 mr-2 ${
                          selectedSubject === subject
                            ? 'text-blue-600'
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <h3 className={`text-sm font-bold ${
                          selectedSubject === subject
                            ? 'text-blue-900'
                            : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {subject}
                        </h3>
                      </div>
                      {selectedSubject === subject && (
                        <CheckCircleIcon className="text-blue-600 w-5 h-5" />
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
          { value: 30, label: '30 min', description: 'Quick review' },
          { value: 60, label: '60 min', description: 'Standard' },
          { value: 90, label: '90 min', description: 'In-depth' },
          { value: 120, label: '120 min', description: 'Intensive' },
        ]

        return (
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Select Duration
            </h2>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose session length:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {durationOptions.map((option) => {
                return (
                  <div
                    key={option.value}
                    className={`animated-card p-4 border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                      selectedDuration === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : `${theme === 'dark' ? 'border-gray-600 hover:border-blue-400 bg-gray-800' : 'border-gray-200 hover:border-blue-400 bg-white'}`
                    }`}
                    onClick={(e) => {
                      const card = e.currentTarget
                      gsap.to(card, {
                        scale: 0.95,
                        duration: 0.1,
                        ease: 'power2.out',
                        yoyo: true,
                        repeat: 1,
                        onComplete: () => {
                          setSelectedDuration(option.value)
                          gsap.to(card, {
                            scale: 1.02,
                            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                            duration: 0.3,
                            ease: 'back.out(1.4)',
                            force3D: true
                          })
                        }
                      })
                    }}
                  >
                    <div className="text-center">
                      <h3 className={`text-base font-bold mb-1 ${
                        selectedDuration === option.value
                          ? 'text-blue-900'
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </h3>
                      <p className={`text-xs ${
                        selectedDuration === option.value
                          ? 'text-blue-700'
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {option.description}
                      </p>
                      {selectedDuration === option.value && (
                        <CheckCircleIcon className="text-blue-600 w-5 h-5 mx-auto mt-2" />
                      )}
                      {option.value === 60 && selectedDuration !== option.value && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                💡 60-min sessions work best for most topics
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                >
                  ← Change
                </Button>
              )}
            </div>
            {!selectedTutor ? (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please select a tutor first
                </p>
              </div>
            ) : availabilityLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading available time slots...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No available time slots found
                </p>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  The tutor may not have set their availability yet
                </p>
              </div>
            ) : dateSelectionStep === 'date' ? (
              // Step 1: Select Date
              <div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose an available date:
                </p>
            <div className="grid grid-cols-2 gap-3">
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
                  className={`animated-card date-card p-4 border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                            theme === 'dark' 
                              ? 'border-gray-600 hover:border-blue-500 bg-gray-800' 
                              : 'border-gray-200 hover:border-blue-500 bg-white'
                          }`}
                          onClick={(e) => {
                            const card = e.currentTarget
                            gsap.to(card, {
                              scale: 0.95,
                              duration: 0.1,
                              ease: 'power2.out',
                              yoyo: true,
                              repeat: 1,
                              onComplete: () => {
                            setSelectedDate(dateInfo.date)
                            setDateSelectionStep('time')
                                gsap.to(card, {
                                  scale: 1,
                                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                                  duration: 0.3,
                                  ease: 'back.out(1.4)',
                                  force3D: true
                                })
                              }
                            })
                          }}
                        >
                          <div className="text-center">
                            <p className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {dateObj.getDate()}
                            </p>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                              {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
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
                <div className={`mb-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                    📅 {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose a time slot:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots
                    .filter(slot => slot.date === selectedDate)
                    .map((slot, index) => (
                      <div
                        key={index}
                        className={`animated-card time-slot p-3 border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                          selectedTime === slot.time
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : slot.available
                            ? `${theme === 'dark' ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-200 hover:border-blue-500 bg-white'}`
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (slot.available) {
                      const card = e.currentTarget
                      gsap.to(card, {
                        scale: 0.9,
                        duration: 0.1,
                        ease: 'power2.out',
                        yoyo: true,
                        repeat: 1,
                        onComplete: () => {
                      setSelectedTime(slot.time)
                          gsap.to(card, {
                            scale: 1.05,
                            boxShadow: '0 6px 16px rgba(59, 130, 246, 0.3)',
                            duration: 0.3,
                            ease: 'back.out(1.4)',
                            force3D: true
                          })
                        }
                      })
                    }
                  }}
                >
                  <div className="text-center">
                          <p className={`font-medium text-xs ${
                            selectedTime === slot.time
                        ? 'text-blue-900'
                        : theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                            {slot.time}
                    </p>
                          <p className={`text-[10px] ${
                            selectedTime === slot.time
                        ? 'text-blue-700'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                            {slot.endTime}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${
                            selectedTime === slot.time
                              ? 'text-blue-700'
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ({selectedDuration}m)
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
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Session Details
            </h2>
            
            {/* Summary */}
            <div className={`mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                📋 Session Summary
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tutor:</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTutorData?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subject:</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSubject || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Duration:</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Date:</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDate || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Time:</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Session Type
                </label>
                <div className="space-y-3">
                  <label 
                    className={`animated-card flex items-center p-4 border-2 rounded-xl cursor-pointer shadow-sm transition-all ${
                    sessionType === 'online' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                        : theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}
                    onClick={(e) => {
                      const card = e.currentTarget
                      if (sessionType !== 'online') {
                        gsap.to(card, {
                          scale: 0.97,
                          duration: 0.1,
                          ease: 'power2.out',
                          yoyo: true,
                          repeat: 1,
                          onComplete: () => {
                            setSessionType('online')
                            gsap.to(card, {
                              scale: 1,
                              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                              duration: 0.3,
                              ease: 'back.out(1.4)',
                              force3D: true
                            })
                          }
                        })
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      value="online"
                      checked={sessionType === 'online'}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="mr-3"
                    />
                    <VideoCallIcon className="mr-3 w-5 h-5 text-blue-600" />
                    <div>
                      <span className={`font-medium ${
                        sessionType === 'online' 
                          ? 'text-blue-900' 
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Online Video Call
                      </span>
                      <p className={`text-xs ${
                        sessionType === 'online' 
                          ? 'text-blue-700' 
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Join from anywhere
                      </p>
                    </div>
                  </label>
                  <label 
                    className={`animated-card flex items-center p-4 border-2 rounded-xl cursor-pointer shadow-sm transition-all ${
                    sessionType === 'in-person' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                        : theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}
                    onClick={(e) => {
                      const card = e.currentTarget
                      if (sessionType !== 'in-person') {
                        gsap.to(card, {
                          scale: 0.97,
                          duration: 0.1,
                          ease: 'power2.out',
                          yoyo: true,
                          repeat: 1,
                          onComplete: () => {
                            setSessionType('in-person')
                            gsap.to(card, {
                              scale: 1,
                              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
                              duration: 0.3,
                              ease: 'back.out(1.4)',
                              force3D: true
                            })
                          }
                        })
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      value="in-person"
                      checked={sessionType === 'in-person'}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="mr-3"
                    />
                    <LocationOnIcon className="mr-3 w-5 h-5 text-green-600" />
                    <div>
                      <span className={`font-medium ${
                        sessionType === 'in-person' 
                          ? 'text-blue-900' 
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        In-Person Meeting
                      </span>
                      <p className={`text-xs ${
                        sessionType === 'in-person' 
                          ? 'text-blue-700' 
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Meet at our center
                      </p>
                    </div>
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
                  placeholder="Any specific topics you'd like to focus on?"
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
                />
              </div>
            </div>
          </div>
        )

      default:
        return 'Unknown step'
    }
  }

  const renderSummary = () => {
    return (
      <div className={`p-5 rounded-xl border shadow-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          📋 Session Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tutor:</span>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {selectedTutorData?.name || 'Not selected'}
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
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
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
                {bookingMode === 'session' ? 'Book Session' : 'Browse Classes'}
              </h1>
              {bookingMode === 'session' && (
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Step {activeStep + 1} of {steps.length}
              </p>
              )}
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

        {/* Tabs */}
        <Box ref={tabContainerRef} sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', px: 2 }}>
          <Tabs 
            value={bookingMode === 'session' ? 0 : 1} 
            onChange={(_, newValue) => {
              const newMode = newValue === 0 ? 'session' : 'class'
              if (tabContainerRef.current) {
                gsap.to(tabContainerRef.current, {
                  opacity: 0.6,
                  scale: 0.98,
                  duration: 0.15,
                  ease: 'power2.in',
                  onComplete: () => {
                    setBookingMode(newMode)
                    setActiveStep(0)
                    setBookingError('')
                    setBookingSuccess(false)
                    gsap.to(tabContainerRef.current, {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: 'power2.out'
                    })
                  }
                })
              } else {
                setBookingMode(newMode)
                setActiveStep(0)
                setBookingError('')
                setBookingSuccess(false)
              }
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
              icon={<Schedule />} 
              label="Book Session" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
            />
            <Tab 
              icon={<ClassIcon />} 
              label="Browse Classes" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
            />
          </Tabs>
        </Box>

        {/* Progress Steps - Mobile (only for session mode) */}
        {bookingMode === 'session' && (
          <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center step-indicator"
                  onClick={() => {
                    if (index <= activeStep) {
                      // Animate step indicator click
                      const indicator = document.querySelectorAll('.step-indicator')[index] as HTMLElement
                      if (indicator) {
                        gsap.to(indicator, {
                          scale: 1.2,
                          duration: 0.2,
                          ease: 'power2.out',
                          yoyo: true,
                          repeat: 1,
                          onComplete: () => {
                            setActiveStep(index)
                          }
                        })
                      }
                    }
                  }}
                >
                  <div className={`step-circle w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-md transition-all ${
                  index < activeStep ? 'bg-green-500 text-white' : 
                    index === activeStep ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800' :
                    'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                    {index < activeStep ? <CheckCircleIcon className="w-5 h-5" /> : 
                   <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                  <span className={`text-xs text-center font-medium ${
                  index <= activeStep 
                    ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {step.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Success/Error Messages */}
        {bookingSuccess && (
          <div 
            className={`success-message mx-4 mb-2 p-4 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-green-900/30 border border-green-700' : 'bg-green-100 border border-green-400'}`}
          >
            <p className={`text-sm font-medium flex items-center ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {bookingMode === 'session' ? 'Session booked successfully!' : 'Enrolled successfully!'}
            </p>
          </div>
        )}
        {bookingError && (
          <div 
            className={`error-message mx-4 mb-2 p-4 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-400'}`}
          >
            <p className={`text-sm font-medium flex items-center ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
              <CloseIcon className="w-5 h-5 mr-2" />
              {bookingError}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {bookingMode === 'session' ? (
          <>
        {/* Step Content */}
        {activeStep < steps.length && (
          <div className="space-y-4">
                <div ref={stepContentRef}>
            <Card 
                    className={`step-content border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-5 rounded-xl shadow-md`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
              }}
            >
              {renderStepContent(activeStep)}
            </Card>
                </div>

            {/* Session Summary - Mobile */}
            <div className="lg:hidden">
              {renderSummary()}
            </div>

            {/* Help Section - Mobile with Toggle */}
              <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all`}
              >
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Need Help?
                </h3>
                <div className={`transform transition-transform ${showHelp ? 'rotate-180' : ''}`}>
                  <ArrowForwardIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </button>
              
              {showHelp && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-3">
                    <button className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                      <ChatIcon className="w-6 h-6 text-blue-600 mb-2" />
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Support
                      </span>
                    </button>
                    <button className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                      <VideoCallIcon className="w-6 h-6 text-green-600 mb-2" />
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Tutorial
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {bookingMode === 'session' && activeStep >= steps.length && (
          <div className="space-y-4">
            <Card 
              className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 text-center`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: 'none !important'
              }}
            >
              {bookingSuccess ? (
                <>
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    🎉 Đặt lịch thành công!
              </h2>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Buổi học của bạn đã được đặt thành công. Gia sư sẽ nhận được thông báo ngay.
                  </p>
                  {bookedSessionId && (
                    <div className={`mb-6 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                        <strong>Session ID:</strong> {bookedSessionId}
                      </p>
                      <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Bạn có thể xem chi tiết buổi học trong Calendar hoặc Session Details
                      </p>
                    </div>
                  )}
              <div className="space-y-3">
                <Button 
                  onClick={handleReset} 
                  className="w-full"
                  style={{
                        backgroundColor: '#2563eb',
                    color: '#ffffff',
                        borderColor: '#2563eb',
                    textTransform: 'none',
                    fontWeight: '500'
                  }}
                >
                      Đặt buổi học khác
                </Button>
                <Button 
                  onClick={() => navigate('/student')} 
                      className="w-full"
                      style={{
                        backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                    >
                      Về Dashboard
                    </Button>
                    <Button 
                      onClick={() => navigate('/student/calendar')} 
                      variant="outlined"
                      className="w-full"
                      style={{
                        color: '#2563eb',
                        borderColor: '#2563eb',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                    >
                      Xem Calendar
                </Button>
              </div>
                </>
              ) : bookingError ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloseIcon className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    ❌ Đặt lịch thất bại
                  </h2>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                    {bookingError}
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setBookingError('')
                        setActiveStep(0)
                      }}
                      className="w-full"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        borderColor: '#dc2626',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                    >
                      Thử lại
                    </Button>
                    <Button 
                      onClick={() => navigate('/student')} 
                      variant="outlined"
                      className="w-full"
                      style={{
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                    >
                      Về Dashboard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Đang xử lý...
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vui lòng chờ trong giây lát
                  </p>
                </>
              )}
            </Card>
          </div>
        )}
          </>
        ) : (
          /* Classes Browsing Content */
          <div className="space-y-4">
            {classSelectionStep === 0 ? (
              // Step 1: Select Tutor
              <Card 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-5 rounded-xl shadow-md`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Choose a Tutor
                  </h2>
                  {availableTutors.length > classTutorsPerPage && (
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {classTutorPage}/{Math.ceil(availableTutors.length / classTutorsPerPage)}
                    </span>
                  )}
      </div>
                {availableTutors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading tutors...</p>
                  </div>
                ) : (
                  <>
              <div className="space-y-3">
                      {(() => {
                        const startIndex = (classTutorPage - 1) * classTutorsPerPage
                        const endIndex = startIndex + classTutorsPerPage
                        const currentTutors = availableTutors.slice(startIndex, endIndex)
                        
                        return currentTutors.map((tutor) => (
                          <div
                            key={tutor.id}
                            className={`tutor-card-item p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedClassTutor?.id === tutor.id
                                ? `border-blue-500 ${theme === 'dark' ? 'bg-blue-900/30 shadow-lg' : 'bg-blue-50 shadow-lg'}`
                                : `${theme === 'dark' ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white'} shadow-sm`
                            }`}
                            onClick={(e) => {
                              const card = e.currentTarget
                              gsap.to(card, {
                                scale: 0.97,
                                duration: 0.1,
                                ease: 'power2.out',
                                yoyo: true,
                                repeat: 1,
                                onComplete: () => {
                                  setSelectedClassTutor(tutor)
                                  setClassSelectionStep(1)
                                  gsap.to(card, {
                                    scale: 1,
                                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                                    duration: 0.3,
                                    ease: 'power2.out'
                                  })
                                }
                              })
                            }}
                          >
                            <div className="flex items-start">
                              <Avatar
                                src={tutor.avatar}
                  sx={{
                                  width: 48,
                                  height: 48,
                                  bgcolor: getAvatarColor(tutor.name),
                                  fontSize: '1rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {getInitials(tutor.name)}
                              </Avatar>
                              <div className="ml-3 flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className={`font-semibold text-sm ${
                                    selectedClassTutor?.id === tutor.id
                                      ? theme === 'dark' ? 'text-blue-200' : 'text-blue-900'
                                      : theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {tutor.name}
                                  </h3>
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                    <span className={`text-xs font-medium ${
                                      selectedClassTutor?.id === tutor.id
                                        ? theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                                        : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                      {tutor.rating?.toFixed(1) || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <p className={`text-xs mb-2 ${
                                  selectedClassTutor?.id === tutor.id
                                    ? theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {tutor.subjects?.[0] || 'N/A'}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {(tutor.subjects || []).slice(0, 3).map((subject: string, index: number) => (
                                    <span
                                      key={index}
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        selectedClassTutor?.id === tutor.id && theme === 'dark'
                                          ? 'bg-blue-800 text-blue-200'
                                          : selectedClassTutor?.id === tutor.id
                                          ? 'bg-blue-100 text-blue-800'
                                          : theme === 'dark'
                                          ? 'bg-gray-700 text-gray-300'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {subject}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                    
                    {/* Pagination Controls */}
                    {availableTutors.length > classTutorsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          onClick={() => setClassTutorPage(prev => Math.max(1, prev - 1))}
                          disabled={classTutorPage === 1}
                          style={{
                            backgroundColor: classTutorPage === 1 ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                            color: classTutorPage === 1 ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                            textTransform: 'none',
                            padding: '6px 12px',
                            fontSize: '14px',
                            minWidth: '70px'
                          }}
                        >
                          Trước
                        </Button>
                        <span className={`px-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {classTutorPage}/{Math.ceil(availableTutors.length / classTutorsPerPage)}
                        </span>
                        <Button
                          onClick={() => setClassTutorPage(prev => Math.min(Math.ceil(availableTutors.length / classTutorsPerPage), prev + 1))}
                          disabled={classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage)}
                          style={{
                            backgroundColor: classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage) ? (theme === 'dark' ? '#374151' : '#e5e7eb') : '#2563eb',
                            color: classTutorPage >= Math.ceil(availableTutors.length / classTutorsPerPage) ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : '#ffffff',
                            textTransform: 'none',
                            padding: '6px 12px',
                            fontSize: '14px',
                            minWidth: '70px'
                          }}
                        >
                          Sau
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            ) : (
              // Step 2: View Classes of Selected Tutor
              <>
                <Card 
                  className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-5 rounded-xl shadow-md`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Classes by {selectedClassTutor?.name || 'Tutor'}
                      </h2>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}
                    >
                      ← Change
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
                <div className="space-y-4">
                      {classes.map((cls) => {
                    const isEnrolled = myEnrollments.some(e => e.classId === cls.id && e.status === 'active')
                    const isFull = cls.currentEnrollment >= cls.maxStudents
                    
                    return (
                      <div
                        key={cls.id}
                        className="class-card-item"
                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                          gsap.to(e.currentTarget, {
                            y: -4,
                            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                            duration: 0.3,
                            ease: 'power2.out',
                            force3D: true
                          })
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                          gsap.to(e.currentTarget, {
                            y: 0,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            duration: 0.3,
                            ease: 'power2.out',
                            force3D: true
                          })
                        }}
                      >
                      <Card
                        className={`p-5 border rounded-xl shadow-md mb-4 ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        } transition-all`}
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
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
                      </div>
                    )
                  })}
                </div>
              )}
                </Card>
              </>
            )}

            {/* My Enrollments */}
            {myEnrollments.length > 0 && (
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  My Enrolled Classes
                </h3>
                {enrollmentsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myEnrollments.map((enrollment) => (
                      <Card
                        key={enrollment.id}
                        className={`p-5 border rounded-xl shadow-md mb-4 ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
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
          </div>
        )}
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

      {/* Bottom Navigation - Mobile - Fixed & Sticky */}
      {bookingMode === 'session' && activeStep < steps.length && (
        <div className={`fixed bottom-0 left-0 right-0 z-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 shadow-2xl backdrop-blur-sm bg-opacity-95`}>
          <div className="flex justify-between gap-3">
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              className="flex items-center rounded-xl"
              style={{
                backgroundColor: 'transparent',
                color: activeStep === 0 ? '#9ca3af' : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                borderColor: activeStep === 0 ? '#9ca3af' : (theme === 'dark' ? '#4b5563' : '#d1d5db'),
                textTransform: 'none',
                fontWeight: '600',
                opacity: activeStep === 0 ? 0.5 : 1,
                flex: '1',
                padding: '12px 16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e: any) => {
                if (activeStep > 0) {
                  gsap.to(e.currentTarget, {
                    scale: 1.02,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    duration: 0.2,
                    ease: 'power2.out',
                    force3D: true
                  })
                }
              }}
              onMouseLeave={(e: any) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  boxShadow: 'none',
                  duration: 0.2,
                  ease: 'power2.out',
                  force3D: true
                })
              }}
            >
              <ArrowBackIcon className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={bookingLoading}
              className="rounded-xl"
              style={{
                backgroundColor: bookingLoading ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: '600',
                flex: '1',
                padding: '12px 16px',
                opacity: bookingLoading ? 0.7 : 1,
                boxShadow: bookingLoading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e: any) => {
                if (!bookingLoading) {
                  gsap.to(e.currentTarget, {
                    backgroundColor: '#1d4ed8',
                    scale: 1.02,
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                    duration: 0.2,
                    ease: 'power2.out',
                    force3D: true
                  })
                }
              }}
              onMouseLeave={(e: any) => {
                if (!bookingLoading) {
                  gsap.to(e.currentTarget, {
                    backgroundColor: '#2563eb',
                    scale: 1,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    duration: 0.2,
                    ease: 'power2.out',
                    force3D: true
                  })
                }
              }}
            >
              {bookingLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
              {activeStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp tục'}
              <ArrowForwardIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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

                {/* Mobile Progress Steps */}
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

export default BookSessionMobile
