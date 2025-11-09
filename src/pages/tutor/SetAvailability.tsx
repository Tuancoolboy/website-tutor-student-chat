import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Schedule, 
  Add, 
  Delete,
  Save,
  CalendarToday,
  AccessTime,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Event as EventIcon
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

const SetAvailability: React.FC = () => {
  const { theme } = useTheme()
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
    availabilitySlotIndex: 0, // Index của time slot được chọn
    startTime: '', // Thời gian bắt đầu cụ thể trong range
    endTime: '', // Thời gian kết thúc cụ thể trong range
    maxStudents: 20,
    isOnline: true,
    location: ''
  })
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null)
  
  // Global semester dates (cố định từ hệ thống)
  const SEMESTER_START = '2025-08-13T00:00:00.000Z' // Ví dụ: Học kỳ 2, 2024-2025
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

  const [recurringPattern, setRecurringPattern] = useState('weekly')
  const [sessionDuration, setSessionDuration] = useState('60')
  const [breakTime, setBreakTime] = useState('15')
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState('8')
  const [mobileOpen, setMobileOpen] = useState(false)

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
      console.log('🔍 [DEBUG] loadClasses response:', response)
      console.log('🔍 [DEBUG] response.success:', response.success)
      console.log('🔍 [DEBUG] response.data:', response.data)
      console.log('🔍 [DEBUG] Array.isArray(response.data):', Array.isArray(response.data))
      
      if (response.success && response.data) {
        console.log('✅ [DEBUG] Setting classes:', response.data)
        setClasses(response.data)
      } else {
        console.log('❌ [DEBUG] Condition not met. success:', response.success, 'data:', response.data)
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

    // Convert times to minutes for comparison
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    const slotStart = parseTime(selectedSlot.startTime)
    const slotEnd = parseTime(selectedSlot.endTime)
    const classStart = parseTime(newClass.startTime)
    const classEnd = parseTime(newClass.endTime)

    // Validate: class time must be within availability slot
    if (classStart < slotStart || classEnd > slotEnd) {
      return { 
        valid: false, 
        error: `Thời gian lớp học phải nằm trong khung ${selectedSlot.startTime} - ${selectedSlot.endTime}` 
      }
    }

    // Validate: startTime must be before endTime
    if (classStart >= classEnd) {
      return { valid: false, error: 'Thời gian bắt đầu phải trước thời gian kết thúc' }
    }

    // Validate: duration must be at least 30 minutes
    const duration = classEnd - classStart
    if (duration < 30) {
      return { valid: false, error: 'Lớp học phải có thời lượng tối thiểu 30 phút' }
    }

    // Check for overlap with existing classes on the same day
    const sameDayClasses = classes.filter(cls => cls.day === selectedSlot.day)
    for (const existingClass of sameDayClasses) {
      const existingStart = parseTime(existingClass.startTime)
      const existingEnd = parseTime(existingClass.endTime)
      
      // Check if times overlap
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

      // Get selected time slot from availability
      const selectedSlot = availableTimeSlots[newClass.availabilitySlotIndex]
      if (!selectedSlot) {
        setError('Vui lòng chọn khung giờ availability')
        setSaving(false)
        return
      }

      // Validate class time
      const validation = validateClassTime()
      if (!validation.valid) {
        setTimeValidationError(validation.error)
        setSaving(false)
        return
      }

      // Calculate duration in minutes
      const [startHour, startMin] = newClass.startTime.split(':').map(Number)
      const [endHour, endMin] = newClass.endTime.split(':').map(Number)
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)

      // Auto-generate class code (backend sẽ handle nhưng gửi suggestion)
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
        // Reset form
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
    if (!window.confirm('Are you sure you want to delete this class?')) return
    
    try {
      const response = await classesAPI.delete(classId)
      if (response.success) {
        setSuccessMessage('Class deleted successfully!')
        loadClasses()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Failed to delete class')
      }
    } catch (err: any) {
      console.error('Error deleting class:', err)
      setError(err.message || 'Failed to delete class')
    }
  }

  const handleGenerateSessions = async (classId: string) => {
    if (!window.confirm('Generate sessions for the entire semester for this class?')) return
    
    try {
      setSaving(true)
      const response = await classesAPI.generateSessions(classId)
      if (response.success) {
        setSuccessMessage(`Successfully generated ${response.data.count} sessions!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.error || 'Failed to generate sessions')
      }
    } catch (err: any) {
      console.error('Error generating sessions:', err)
      setError(err.message || 'Failed to generate sessions')
    } finally {
      setSaving(false)
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

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

            {/* Availability Settings */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                AVAILABILITY SETTINGS
              </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Week View
                    </label>
                    <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="current">Current Week</option>
                      <option value="next">Next Week</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Recurring Pattern
                    </label>
                    <select
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Session Duration
                    </label>
                    <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Break Time (minutes)
                    </label>
                    <input
                      type="number"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Max Sessions Per Day
                    </label>
                    <input
                      type="number"
                  value={maxSessionsPerDay}
                  onChange={(e) => setMaxSessionsPerDay(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
            </div>

              {/* Quick Actions */}
            <div>
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
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {currentTab === 0 ? 'Set Availability' : 'Manage Classes'}
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentTab === 0 
                    ? 'Manage your teaching schedule and availability' 
                    : 'Create and manage your classes'}
                </p>
              </div>
              <div className="flex space-x-2">
                {currentTab === 0 ? (
                  <Button 
                    onClick={handleSaveAvailability}
                    disabled={saving || loading}
                    className={`${saving ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    style={{
                      backgroundColor: saving || loading 
                        ? '#6b7280' 
                        : theme === 'dark' ? '#2563eb' : '#2563eb',
                      color: '#ffffff',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!saving && !loading) {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1d4ed8' : '#1d4ed8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving && !loading) {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2563eb' : '#2563eb'
                      }
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setCreateClassDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    style={{
                      backgroundColor: theme === 'dark' ? '#2563eb' : '#2563eb',
                      color: '#ffffff',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1d4ed8' : '#1d4ed8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2563eb' : '#2563eb'
                    }}
                  >
                    <Add className="w-4 h-4 mr-2" />
                    Create New Class
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: theme === 'dark' ? '#374151' : 'divider', mb: 3 }}>
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
                  icon={<Schedule />} 
                  label="Availability" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<SchoolIcon />} 
                  label="Classes" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            </div>

        {/* Tab Content */}
        {currentTab === 0 ? (
          /* Weekly Schedule */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Schedule */}
            <div className="lg:col-span-2">
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Weekly Schedule
                  </h3>
                  <div className="flex space-x-2">
                    <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      <ArrowBackIcon className="w-4 h-4" />
                    </button>
                    <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      <ArrowForwardIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
            {daysOfWeek.map((day) => (
                    <div key={day} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {day}
                      </h4>
                
                      <div className="space-y-3">
                {getDaySlots(day).map((slot) => (
                          <div key={slot.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                              checked={slot.isAvailable}
                              onChange={() => handleToggleAvailability(slot.id)}
                                  className="w-4 h-4 text-blue-600 rounded mr-3"
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
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  Start Time
                                </label>
                                <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg ${
                                    theme === 'dark'
                                      ? 'bg-gray-600 border-gray-500 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  End Time
                                </label>
                                <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg ${
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
                        className={`w-full flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg ${
                          theme === 'dark'
                              ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                        } transition-colors`}
                      >
                        <Add className="w-4 h-4 mr-2" />
                        Add Time Slot
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
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
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <Schedule className="mr-3 w-4 h-4" />
                    Copy Previous Week
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <CalendarToday className="mr-3 w-4 h-4" />
                    Set Holiday
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <AccessTime className="mr-3 w-4 h-4" />
                    Bulk Time Slots
                  </button>
                </div>
              </Card>

              {/* Schedule Summary */}
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Schedule Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Hours:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {timeSlots.filter(slot => slot.isAvailable).length * 8} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Available Days:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {timeSlots.filter(slot => slot.isAvailable).length} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Max Sessions:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {maxSessionsPerDay} per day
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Classes Management */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Classes List */}
            <div className="lg:col-span-2">
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Your Classes
                </h3>

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
                      No classes yet
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Create your first class to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {cls.code}
                              </h4>
                              <Chip 
                                label={cls.status} 
                                size="small"
                                color={cls.status === 'active' ? 'success' : cls.status === 'full' ? 'warning' : 'default'}
                              />
                            </div>
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {cls.subject}
                            </p>
                            {cls.description && (
                              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {cls.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className={`p-2 rounded ${theme === 'dark' ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-100'}`}
                          >
                            <Delete className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <CalendarToday className="w-4 h-4" />
                            <span>{cls.day.charAt(0).toUpperCase() + cls.day.slice(1)}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <AccessTime className="w-4 h-4" />
                            <span>{cls.startTime} - {cls.endTime}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <GroupIcon className="w-4 h-4" />
                            <span>{cls.currentEnrollment || 0} / {cls.maxStudents} students</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <EventIcon className="w-4 h-4" />
                            <span>{cls.duration} minutes</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleGenerateSessions(cls.id)}
                            disabled={saving}
                            variant="outlined"
                            size="small"
                            style={{
                              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                              color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                              borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                              textTransform: 'none',
                              fontSize: '0.875rem'
                            }}
                          >
                            <EventIcon className="w-4 h-4 mr-1" />
                            Generate Sessions
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Classes Info Sidebar */}
            <div className="space-y-6">
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Classes Summary
                </h3>
                <div className="space-y-3">
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
              </Card>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Create Class Dialog */}
      <Dialog 
        open={createClassDialogOpen} 
        onClose={() => setCreateClassDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className={theme === 'dark' ? 'bg-gray-800 text-white' : ''}>
          Create New Class
        </DialogTitle>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800' : ''}>
          <div className="space-y-4 pt-4">
            {/* Info message */}
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                ℹ️ Mã lớp sẽ được tạo tự động. Chọn môn học và khung giờ từ availability của bạn.
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Môn học <span className="text-red-500">*</span>
              </label>
              {tutorSubjects.length === 0 ? (
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-900'}`}>
                  <p className="text-sm">
                    ⚠️ Bạn chưa có môn học nào. Vui lòng cập nhật profile để thêm môn học.
                  </p>
                </div>
              ) : (
                <select
                  value={newClass.subject}
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">-- Chọn môn học --</option>
                  {tutorSubjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Chọn khung giờ availability <span className="text-red-500">*</span>
              </label>
              {availableTimeSlots.length === 0 ? (
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-900'}`}>
                  <p className="text-sm">
                    ⚠️ Bạn chưa thiết lập availability. Vui lòng chuyển sang tab "Availability" để thiết lập.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={newClass.availabilitySlotIndex}
                    onChange={(e) => {
                      const index = parseInt(e.target.value)
                      setNewClass({
                        ...newClass, 
                        availabilitySlotIndex: index,
                        startTime: '', // Reset times when changing slot
                        endTime: ''
                      })
                      setTimeValidationError(null)
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {availableTimeSlots.map((slot, index) => {
                      const dayName = slot.day.charAt(0).toUpperCase() + slot.day.slice(1)
                      return (
                        <option key={index} value={index}>
                          {dayName} • {slot.startTime} - {slot.endTime}
                        </option>
                      )
                    })}
                  </select>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Chọn khung giờ availability mà bạn muốn chia thành các lớp học
                  </p>
                </>
              )}
            </div>

            {/* Time inputs để chia nhỏ khung giờ */}
            {availableTimeSlots.length > 0 && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Thời gian lớp học (trong khung giờ trên) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      value={newClass.startTime}
                      onChange={(e) => {
                        setNewClass({...newClass, startTime: e.target.value})
                        setTimeValidationError(null)
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      value={newClass.endTime}
                      onChange={(e) => {
                        setNewClass({...newClass, endTime: e.target.value})
                        setTimeValidationError(null)
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
                {newClass.startTime && newClass.endTime && (
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    Thời lượng: {(() => {
                      const [startH, startM] = newClass.startTime.split(':').map(Number)
                      const [endH, endM] = newClass.endTime.split(':').map(Number)
                      const duration = (endH * 60 + endM) - (startH * 60 + startM)
                      const hours = Math.floor(duration / 60)
                      const minutes = duration % 60
                      return hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}phút` : ''}` : `${minutes} phút`
                    })()}
                  </p>
                )}
                {timeValidationError && (
                  <div className={`mt-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                      ⚠️ {timeValidationError}
                    </p>
                  </div>
                )}
                <div className={`mt-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                    💡 <strong>Ví dụ:</strong> Nếu availability là 7:00-12:00, bạn có thể tạo:
                    <br />• C01: 7:00-8:00 (1h)
                    <br />• C02: 9:00-11:00 (2h)
                    <br />• C03: 11:00-12:00 (1h)
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Mô tả (Tùy chọn)
              </label>
              <textarea
                value={newClass.description}
                onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                rows={3}
                placeholder="Mô tả về lớp học..."
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Số lượng sinh viên tối đa <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newClass.maxStudents}
                onChange={(e) => setNewClass({...newClass, maxStudents: parseInt(e.target.value) || 1})}
                min="1"
                max="100"
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Số lượng sinh viên có thể đăng ký lớp này
              </p>
            </div>

            {/* Semester info (read-only) */}
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📅 Thời gian học kỳ
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Bắt đầu:</strong> {new Date(SEMESTER_START).toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Kết thúc:</strong> {new Date(SEMESTER_END).toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                * Thời gian học kỳ được quy định bởi nhà trường
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newClass.isOnline}
                  onChange={(e) => setNewClass({...newClass, isOnline: e.target.checked})}
                  className="mr-3"
                />
                <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Online Class
                </span>
              </label>
            </div>

            {!newClass.isOnline && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Location
                </label>
                <input
                  type="text"
                  value={newClass.location}
                  onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                  placeholder="Classroom location"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className={theme === 'dark' ? 'bg-gray-800' : ''}>
          <Button 
            onClick={() => setCreateClassDialogOpen(false)}
            variant="outlined"
            style={{
              textTransform: 'none'
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCreateClass}
            disabled={
              saving || 
              !newClass.subject || 
              !newClass.startTime ||
              !newClass.endTime ||
              availableTimeSlots.length === 0 ||
              tutorSubjects.length === 0
            }
            style={{
              backgroundColor: saving || !newClass.subject || !newClass.startTime || !newClass.endTime || availableTimeSlots.length === 0 ? '#9ca3af' : '#2563eb',
              color: '#ffffff',
              textTransform: 'none'
            }}
          >
            {saving ? 'Đang tạo...' : 'Tạo lớp học'}
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

              {/* Mobile Availability Settings */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  AVAILABILITY SETTINGS
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Week View
                    </label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="current">Current Week</option>
                      <option value="next">Next Week</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Session Duration
                    </label>
                    <select
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/tutor/sessions')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <AssignmentIcon className="mr-3 w-4 h-4" />
                  Manage Sessions
                </button>
                <button 
                  onClick={() => {
                    navigate('/tutor/track-progress')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChartIcon className="mr-3 w-4 h-4" />
                  Track Progress
                </button>
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

export default SetAvailability
