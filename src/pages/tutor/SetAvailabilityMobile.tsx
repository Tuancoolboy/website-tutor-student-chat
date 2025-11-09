import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Add, 
  Delete,
  Save,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Autorenew as AutorenewIcon,
  Chat as ChatIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Event as EventIcon,
  CalendarToday,
  AccessTime
} from '@mui/icons-material'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Tabs,
  Tab,
  Box,
  Chip
} from '@mui/material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { availabilityAPI, classesAPI } from '../../lib/api'

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

const SetAvailabilityMobile: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('availability')
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState('current')
  const [currentTab, setCurrentTab] = useState(0)
  
  // Classes states
  const [classes, setClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([])
  const [newClass, setNewClass] = useState({
    subject: '',
    description: '',
    availabilitySlotIndex: 0,
    startTime: '',
    endTime: '',
    maxStudents: 20,
    isOnline: true,
    location: ''
  })
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null)
  
  // Global semester dates
  const SEMESTER_START = '2025-08-13T00:00:00.000Z'
  const SEMESTER_END = '2026-01-30T23:59:59.999Z'
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    },
    {
      id: '2',
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    },
    {
      id: '3',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    },
    {
      id: '4',
      day: 'Thursday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    },
    {
      id: '5',
      day: 'Friday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    },
    {
      id: '6',
      day: 'Saturday',
      startTime: '10:00',
      endTime: '15:00',
      isAvailable: false
    },
    {
      id: '7',
      day: 'Sunday',
      startTime: '10:00',
      endTime: '15:00',
      isAvailable: false
    }
  ])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/tutor' },
    { id: 'availability', label: 'Set Availability', icon: <ScheduleIcon />, path: '/tutor/availability' },
    { id: 'sessions', label: 'Manage Sessions', icon: <AssignmentIcon />, path: '/tutor/sessions' },
    { id: 'progress', label: 'Track Progress', icon: <BarChartIcon />, path: '/tutor/track-progress' },
    { id: 'cancel-reschedule', label: 'Cancel/Reschedule', icon: <AutorenewIcon />, path: '/tutor/cancel-reschedule' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/tutor/messages' }
  ]


  const [sessionDuration, setSessionDuration] = useState('60')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showWeekDropdown, setShowWeekDropdown] = useState(false)
  
  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    if (item.path) {
      navigate(item.path)
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleThemeToggle = () => {
    toggleTheme()
  }

  // Load user and availability data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Get user from localStorage
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          navigate('/login')
          return
        }
        const userData = JSON.parse(userStr)
        setUser(userData)

        // Load existing availability from backend
        const response = await availabilityAPI.get(userData.id)
        if (response.success && response.data) {
          const availData = response.data
          
          // Convert backend data to frontend format
          if (availData.timeSlots && availData.timeSlots.length > 0) {
            const formattedSlots = availData.timeSlots.map((slot: any, index: number) => ({
              id: `${index + 1}`,
              day: slot.day.charAt(0).toUpperCase() + slot.day.slice(1), // Capitalize: "monday" -> "Monday"
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true
            }))
            setTimeSlots(formattedSlots)
          }
        }
      } catch (err: any) {
        console.error('Error loading availability:', err)
        setError(err.message || 'Failed to load availability data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  // Load classes when tab changes to classes tab
  useEffect(() => {
    if (currentTab === 1 && user) {
      loadClasses()
      loadAvailableTimeSlots()
    }
  }, [currentTab, user])

  const loadClasses = async () => {
    if (!user) return
    try {
      setClassesLoading(true)
      const response = await classesAPI.list({ tutorId: user.id })
      if (response.success && response.data) {
        setClasses(response.data)
      }
    } catch (err: any) {
      console.error('Error loading classes:', err)
      setError(err.message || 'Failed to load classes')
    } finally {
      setClassesLoading(false)
    }
  }

  const loadAvailableTimeSlots = async () => {
    if (!user) return
    try {
      // Load tutor's subjects
      if (user.subjects && Array.isArray(user.subjects)) {
        setTutorSubjects(user.subjects)
      }

      // Load tutor's availability to get available time slots
      const response = await availabilityAPI.get(user.id)
      if (response.success && response.data && response.data.timeSlots) {
        setAvailableTimeSlots(response.data.timeSlots)
      }
    } catch (err: any) {
      console.error('Error loading availability:', err)
    }
  }

  const validateClassTime = () => {
    const selectedSlot = availableTimeSlots[newClass.availabilitySlotIndex]
    if (!selectedSlot || !newClass.startTime || !newClass.endTime) {
      return { valid: false, error: 'Vui lòng nhập đầy đủ thời gian' }
    }

    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    const slotStart = parseTime(selectedSlot.startTime)
    const slotEnd = parseTime(selectedSlot.endTime)
    const classStart = parseTime(newClass.startTime)
    const classEnd = parseTime(newClass.endTime)

    if (classStart < slotStart || classEnd > slotEnd) {
      return { 
        valid: false, 
        error: `Thời gian lớp học phải nằm trong khung ${selectedSlot.startTime} - ${selectedSlot.endTime}` 
      }
    }

    if (classStart >= classEnd) {
      return { valid: false, error: 'Thời gian bắt đầu phải trước thời gian kết thúc' }
    }

    const duration = classEnd - classStart
    if (duration < 30) {
      return { valid: false, error: 'Lớp học phải có thời lượng tối thiểu 30 phút' }
    }

    const sameDayClasses = classes.filter(cls => cls.day === selectedSlot.day)
    for (const existingClass of sameDayClasses) {
      const existingStart = parseTime(existingClass.startTime)
      const existingEnd = parseTime(existingClass.endTime)
      
      if (
        (classStart >= existingStart && classStart < existingEnd) ||
        (classEnd > existingStart && classEnd <= existingEnd) ||
        (classStart <= existingStart && classEnd >= existingEnd)
      ) {
        return { 
          valid: false, 
          error: `Trùng lịch với lớp ${existingClass.code} (${existingClass.startTime}-${existingClass.endTime})` 
        }
      }
    }

    return { valid: true, error: null }
  }

  const handleCreateClass = async () => {
    try {
      setSaving(true)
      setError(null)
      setTimeValidationError(null)

      const selectedSlot = availableTimeSlots[newClass.availabilitySlotIndex]
      if (!selectedSlot) {
        setError('Vui lòng chọn khung giờ availability')
        setSaving(false)
        return
      }

      const validation = validateClassTime()
      if (!validation.valid) {
        setTimeValidationError(validation.error)
        setSaving(false)
        return
      }

      const [startHour, startMin] = newClass.startTime.split(':').map(Number)
      const [endHour, endMin] = newClass.endTime.split(':').map(Number)
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)

      const classData = {
        code: `C${(classes.length + 1).toString().padStart(2, '0')}`,
        subject: newClass.subject,
        description: newClass.description,
        day: selectedSlot.day,
        startTime: newClass.startTime,
        endTime: newClass.endTime,
        duration,
        maxStudents: newClass.maxStudents,
        semesterStart: SEMESTER_START,
        semesterEnd: SEMESTER_END,
        isOnline: newClass.isOnline,
        location: newClass.location
      }

      const response = await classesAPI.create(classData)
      if (response.success) {
        setSuccessMessage(`Lớp học ${response.data.code} đã được tạo thành công!`)
        setCreateClassDialogOpen(false)
        loadClasses()
        setNewClass({
          subject: '',
          description: '',
          availabilitySlotIndex: 0,
          startTime: '',
          endTime: '',
          maxStudents: 20,
          isOnline: true,
          location: ''
        })
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Không thể tạo lớp học')
      }
    } catch (err: any) {
      console.error('Error creating class:', err)
      setError(err.message || 'Đã xảy ra lỗi khi tạo lớp học')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa lớp học này?')) return
    
    try {
      const response = await classesAPI.delete(classId)
      if (response.success) {
        setSuccessMessage('Đã xóa lớp học thành công!')
        loadClasses()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Không thể xóa lớp học')
      }
    } catch (err: any) {
      console.error('Error deleting class:', err)
      setError(err.message || 'Lỗi khi xóa lớp học')
    }
  }

  const handleGenerateSessions = async (classId: string) => {
    if (!window.confirm('Tạo sessions cho cả học kỳ cho lớp này?')) return
    
    try {
      setSaving(true)
      const response = await classesAPI.generateSessions(classId)
      if (response.success) {
        setSuccessMessage(`Đã tạo ${response.data.count} sessions thành công!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Không thể tạo sessions')
      }
    } catch (err: any) {
      console.error('Error generating sessions:', err)
      setError(err.message || 'Lỗi khi tạo sessions')
    } finally {
      setSaving(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showDurationDropdown && !target.closest('.duration-dropdown-container')) {
        setShowDurationDropdown(false)
      }
      
      if (showWeekDropdown && !target.closest('.week-dropdown-container')) {
        setShowWeekDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDurationDropdown, showWeekDropdown])

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  const handleToggleAvailability = (id: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id 
          ? { ...slot, isAvailable: !slot.isAvailable }
          : slot
      )
    )
  }

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id 
          ? { ...slot, [field]: value }
          : slot
      )
    )
  }

  const handleAddTimeSlot = (day: string) => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      day,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    }
    setTimeSlots(prev => [...prev, newSlot])
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id))
  }

  const handleSaveAvailability = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!user) {
        setError('User not found. Please login again.')
        return
      }

      // Convert frontend format to backend format
      const availableSlots = timeSlots
        .filter(slot => slot.isAvailable)
        .map(slot => ({
          day: slot.day.toLowerCase(), // Convert "Monday" -> "monday" for backend
          startTime: slot.startTime,
          endTime: slot.endTime
        }))

      const data = {
        timeSlots: availableSlots,
        exceptions: []
      }

      // Call backend API
      const response = await availabilityAPI.set(data)
      
      if (response.success) {
        setSuccessMessage('Availability saved successfully!')
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Failed to save availability')
      }
    } catch (err: any) {
      console.error('Error saving availability:', err)
      setError(err.message || 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const getDaySlots = (day: string) => {
    return timeSlots.filter(slot => slot.day === day)
  }

  // Duration options with better labels
  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ]

  // Week view options
  const weekOptions = [
    { value: 'current', label: 'Current Week' },
    { value: 'next', label: 'Next Week' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const getSelectedDuration = () => {
    return durationOptions.find(option => option.value === sessionDuration) || durationOptions[1]
  }

  const getSelectedWeek = () => {
    return weekOptions.find(option => option.value === selectedWeek) || weekOptions[0]
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading availability data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/tutor')}
              className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowBackIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {currentTab === 0 ? 'Set Availability' : 'Manage Classes'}
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentTab === 0 ? 'Manage your teaching schedule' : 'Create and manage your classes'}
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
      <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', px: 2 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              color: theme === 'dark' ? '#9ca3af' : 'inherit',
              fontSize: '0.875rem',
              minHeight: '48px',
              '&.Mui-selected': {
                color: theme === 'dark' ? '#3b82f6' : 'primary.main'
              }
            }
          }}
        >
          <Tab 
            icon={<ScheduleIcon sx={{ fontSize: 20 }} />} 
            label="Availability" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<SchoolIcon sx={{ fontSize: 20 }} />} 
            label="Classes" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Mobile Content */}
      <div className="p-4 space-y-4">

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {currentTab === 0 ? (
          /* Availability Tab */
          <>

        {/* Quick Settings - Mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative week-dropdown-container">
            <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Week View
            </label>
            
            {/* Custom Week Dropdown Button */}
            <button
              onClick={() => setShowWeekDropdown(!showWeekDropdown)}
              className={`w-full px-3 py-3 text-sm border rounded-xl flex items-center justify-between transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <div className="flex items-center">
                <span className="font-medium">{getSelectedWeek().label}</span>
              </div>
              <div className={`transform transition-transform duration-200 ${showWeekDropdown ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Custom Week Dropdown Options */}
            {showWeekDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1">
                <div className={`rounded-xl shadow-lg border overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  {weekOptions.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedWeek(option.value)
                        setShowWeekDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                        option.value === selectedWeek
                          ? theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-600'
                            : 'text-gray-700 hover:bg-gray-50'
                      } ${index !== weekOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {option.value === selectedWeek && (
                        <div className="ml-auto">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative duration-dropdown-container">
            <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Session Duration
            </label>
            
            {/* Custom Dropdown Button */}
            <button
              onClick={() => setShowDurationDropdown(!showDurationDropdown)}
              className={`w-full px-3 py-3 text-sm border rounded-xl flex items-center justify-between transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <div className="flex items-center">
                <span className="font-medium">{getSelectedDuration().label}</span>
              </div>
              <div className={`transform transition-transform duration-200 ${showDurationDropdown ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Custom Dropdown Options */}
            {showDurationDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1">
                <div className={`rounded-xl shadow-lg border overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  {durationOptions.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSessionDuration(option.value)
                        setShowDurationDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                        option.value === sessionDuration
                          ? theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-600'
                            : 'text-gray-700 hover:bg-gray-50'
                      } ${index !== durationOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {option.value === sessionDuration && (
                        <div className="ml-auto">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Schedule - Mobile */}
        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <Card
              key={day}
              className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: 'none !important'
              }}
            >
              <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {day}
              </h4>
              
              <div className="space-y-3">
                {getDaySlots(day).map((slot) => (
                  <div key={slot.id} className={`p-3 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={slot.isAvailable}
                          onChange={() => handleToggleAvailability(slot.id)}
                          className="w-4 h-4 text-blue-600 rounded mr-2"
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Available
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                        className={`p-1 rounded ${theme === 'dark' ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-100'}`}
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            theme === 'dark'
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          End Time
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            theme === 'dark'
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => handleAddTimeSlot(day)}
                  className={`w-full flex items-center justify-center px-3 py-2 border-2 border-dashed rounded-lg text-sm ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  } transition-colors`}
                >
                  <Add className="w-4 h-4 mr-2" />
                  Add Time Slot
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Section - Mobile with Toggle */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-full flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
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
                <button 
                  onClick={() => navigate('/tutor/sessions')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <AssignmentIcon className="w-6 h-6 text-blue-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Manage Sessions
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/tutor/track-progress')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <BarChartIcon className="w-6 h-6 text-green-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Track Progress
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button - Mobile */}
        <div className="sticky bottom-4">
          <Button 
            onClick={handleSaveAvailability}
            disabled={saving || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            style={{
              backgroundColor: saving ? '#9ca3af' : (theme === 'dark' ? '#10b981' : '#16a34a'),
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#059669' : '#15803d'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#10b981' : '#16a34a'
              }
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
        </>
        ) : (
          /* Classes Tab */
          <>
            {classesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading classes...
                </p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <SchoolIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Chưa có lớp học nào
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Tạo lớp học đầu tiên của bạn
                </p>
              </div>
            ) : (
              /* Weekly Classes Schedule - Mobile */
              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const dayClasses = classes.filter(cls => 
                    cls.day.toLowerCase() === day.toLowerCase()
                  )
                  
                  if (dayClasses.length === 0) return null
                  
                  return (
                    <Card
                      key={day}
                      className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      style={{
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        boxShadow: 'none !important'
                      }}
                    >
                      <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {day}
                      </h4>
                      
                      <div className="space-y-3">
                        {dayClasses.map((cls) => (
                          <div 
                            key={cls.id} 
                            className={`p-3 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {cls.code}
                                  </h5>
                                  <Chip 
                                    label={cls.status} 
                                    size="small"
                                    color={cls.status === 'active' ? 'success' : cls.status === 'full' ? 'warning' : 'default'}
                                    sx={{ height: '18px', fontSize: '0.65rem' }}
                                  />
                                </div>
                                <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {cls.subject}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteClass(cls.id)}
                                className={`p-1 rounded ${theme === 'dark' ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-100'}`}
                              >
                                <Delete className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className={`flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <AccessTime sx={{ fontSize: 12 }} />
                                <span>{cls.startTime} - {cls.endTime}</span>
                              </div>
                              <div className={`flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <GroupIcon sx={{ fontSize: 12 }} />
                                <span>{cls.currentEnrollment || 0} / {cls.maxStudents} students</span>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleGenerateSessions(cls.id)}
                              disabled={saving}
                              variant="outlined"
                              size="small"
                              fullWidth
                              style={{
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                minHeight: '32px'
                              }}
                            >
                              <EventIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              Generate Sessions
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Summary Section - Mobile */}
            {classes.length > 0 && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Classes Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Classes:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {classes.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active Classes:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {classes.filter(c => c.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Students:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {classes.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button - Fixed at bottom */}
            <div className="sticky bottom-4">
              <Button 
                onClick={() => setCreateClassDialogOpen(true)}
                disabled={saving || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                style={{
                  backgroundColor: theme === 'dark' ? '#2563eb' : '#3b82f6',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
              >
                <Add className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create Class Dialog */}
      <Dialog 
        open={createClassDialogOpen} 
        onClose={() => setCreateClassDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen
      >
        <DialogTitle className={theme === 'dark' ? 'bg-gray-800 text-white' : ''}>
          <div className="flex items-center justify-between">
            <span>Create New Class</span>
            <button onClick={() => setCreateClassDialogOpen(false)} className="p-1">
              <CloseIcon />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800' : ''}>
          <div className="space-y-4 pt-4">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                ℹ️ Mã lớp sẽ được tạo tự động
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Môn học *
              </label>
              {tutorSubjects.length === 0 ? (
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-900'}`}>
                  <p className="text-sm">⚠️ Cập nhật profile để thêm môn học</p>
                </div>
              ) : (
                <select
                  value={newClass.subject}
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">-- Chọn môn học --</option>
                  {tutorSubjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
              )}
            </div>

            {availableTimeSlots.length > 0 && (
              <>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Chọn khung giờ *
                  </label>
                  <select
                    value={newClass.availabilitySlotIndex}
                    onChange={(e) => {
                      setNewClass({
                        ...newClass,
                        availabilitySlotIndex: parseInt(e.target.value),
                        startTime: '',
                        endTime: ''
                      })
                      setTimeValidationError(null)
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {availableTimeSlots.map((slot, index) => (
                      <option key={index} value={index}>
                        {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} • {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Thời gian lớp học *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Bắt đầu</label>
                      <input
                        type="time"
                        value={newClass.startTime}
                        onChange={(e) => {
                          setNewClass({...newClass, startTime: e.target.value})
                          setTimeValidationError(null)
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Kết thúc</label>
                      <input
                        type="time"
                        value={newClass.endTime}
                        onChange={(e) => {
                          setNewClass({...newClass, endTime: e.target.value})
                          setTimeValidationError(null)
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  {timeValidationError && (
                    <div className={`mt-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                      <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>⚠️ {timeValidationError}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Số sinh viên tối đa *
              </label>
              <input
                type="number"
                value={newClass.maxStudents}
                onChange={(e) => setNewClass({...newClass, maxStudents: parseInt(e.target.value) || 1})}
                min="1"
                max="100"
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📅 Học kỳ: {new Date(SEMESTER_START).toLocaleDateString('vi-VN')} - {new Date(SEMESTER_END).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className={theme === 'dark' ? 'bg-gray-800' : ''}>
          <Button 
            onClick={() => setCreateClassDialogOpen(false)}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCreateClass}
            disabled={saving || !newClass.subject || !newClass.startTime || !newClass.endTime || availableTimeSlots.length === 0}
            style={{
              backgroundColor: saving || !newClass.subject || !newClass.startTime || !newClass.endTime ? '#9ca3af' : '#2563eb',
              color: '#ffffff'
            }}
          >
            {saving ? 'Đang tạo...' : 'Tạo lớp'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6 h-full flex flex-col">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div 
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/tutor')}
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

              {/* Quick Actions - Moved to top */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  QUICK ACTIONS
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
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleMenuClick(item)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-green-100 text-green-700'
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
      )}
    </div>
  )
}

export default SetAvailabilityMobile
