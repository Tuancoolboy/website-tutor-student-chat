import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { 
  Typography, 
  TextField,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tabs,
  Tab,
  Chip,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Grid
} from '@mui/material'
import { 
  Cancel, 
  Schedule, 
  Warning,
  CheckCircle,
  Info,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Event as EventIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  AutoAwesome
} from '@mui/icons-material'
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { enUS } from 'date-fns/locale'
import Button from '../../components/ui/Button'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`request-tabpanel-${index}`}
      aria-labelledby={`request-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const HandleCancelReschedule: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0) // 0: All, 1: Sessions, 2: Classes
  const [filterType, setFilterType] = useState('all') // all, cancel, reschedule
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionType, setActionType] = useState('')
  const [reason, setReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newDateValue, setNewDateValue] = useState<Date | null>(null)
  const [newTimeValue, setNewTimeValue] = useState<Date | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

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

  // Load requests from API
  useEffect(() => {
    loadRequests()
  }, [tabValue, filterType, statusFilter])

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page: 1, limit: 100 }
      
      // Filter by type (cancel/reschedule)
      if (filterType !== 'all') {
        params.type = filterType
      }
      
      // Filter by status
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await api.sessionRequests.list(params)
      if (response.success) {
        // Transform API data to match UI format
        const transformedRequests = await Promise.all(
          response.data.map(async (req: any) => {
            // Fetch student info if needed
            let studentName = 'Unknown Student'
            try {
              const studentRes = await api.users.get(req.studentId)
              if (studentRes.success) {
                studentName = studentRes.data.name
              }
            } catch (e) {
              console.error('Failed to fetch student:', e)
            }

            // Backend returns 'session' field, not 'sessionDetails'
            const session = req.session || req.sessionDetails || {}
            
            // Fetch session data if not available in request
            let sessionData = session
            if (!session.startTime && req.sessionId) {
              try {
                const sessionRes = await api.sessions.get(req.sessionId)
                if (sessionRes.success && sessionRes.data) {
                  sessionData = sessionRes.data
                }
              } catch (e) {
                console.error('Failed to fetch session:', e)
              }
            }
            
            // Get start time - try multiple sources
            const startTime = sessionData.startTime || session.startTime || req.sessionDetails?.startTime
            const endTime = sessionData.endTime || session.endTime || req.sessionDetails?.endTime
            
            // Validate date before creating Date object
            let originalStart: Date
            let originalEnd: Date
            
            if (startTime && !isNaN(new Date(startTime).getTime())) {
              originalStart = new Date(startTime)
            } else {
              // Fallback: use current date if no valid start time
              console.warn('Invalid startTime for session:', req.sessionId, 'startTime:', startTime)
              originalStart = new Date()
            }
            
            if (endTime && !isNaN(new Date(endTime).getTime())) {
              originalEnd = new Date(endTime)
            } else {
              // Fallback: use current date + 1 hour if no valid end time
              originalEnd = new Date(originalStart.getTime() + 60 * 60 * 1000)
            }
            
            // Fetch class info if request has classId
            let classInfo = null
            if (req.classId) {
              try {
                const classRes = await api.classes.get(req.classId)
                if (classRes.success) {
                  classInfo = {
                    id: classRes.data.id,
                    code: classRes.data.code,
                    subject: classRes.data.subject
                  }
                }
              } catch (e) {
                console.error('Failed to fetch class:', e)
              }
            }

            // Fetch alternative session/class info if exists (for class reschedule)
            let alternativeSession = null
            if (req.alternativeSessionId) {
              try {
                // Check if alternative is a class (starts with 'class_') or a session
                const isAlternativeClass = req.alternativeSessionId.startsWith('class_')
                
                if (isAlternativeClass) {
                  // Fetch alternative class
                  const altClassRes = await api.classes.get(req.alternativeSessionId)
                  if (altClassRes.success && altClassRes.data) {
                    const altClass = altClassRes.data
                    
                    // Calculate next occurrence of this class
                    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                      .indexOf(altClass.day.toLowerCase())
                    
                    let nextStartTime: Date | null = null
                    if (dayIndex !== -1) {
                      const today = new Date()
                      const currentDay = today.getDay()
                      const mappedDay = currentDay === 0 ? 6 : currentDay - 1 // Map Sunday to 6
                      let daysUntil = (dayIndex - mappedDay + 7) % 7
                      if (daysUntil === 0) daysUntil = 7 // If today, get next week
                      nextStartTime = new Date(today)
                      nextStartTime.setDate(today.getDate() + daysUntil)
                      const [hours, minutes] = altClass.startTime.split(':').map(Number)
                      nextStartTime.setHours(hours, minutes, 0, 0)
                    }

                    // Calculate end time
                    let nextEndTime: Date | null = null
                    if (nextStartTime) {
                      nextEndTime = new Date(nextStartTime.getTime() + altClass.duration * 60000)
                    }

                    alternativeSession = {
                      id: altClass.id,
                      subject: altClass.subject,
                      startTime: nextStartTime ? nextStartTime.toISOString() : new Date().toISOString(),
                      endTime: nextEndTime ? nextEndTime.toISOString() : new Date().toISOString(),
                      duration: altClass.duration,
                      isOnline: altClass.isOnline || false,
                      location: altClass.location,
                      classId: altClass.id,
                      classInfo: {
                        id: altClass.id,
                        code: altClass.code,
                        subject: altClass.subject,
                        day: altClass.day
                      }
                    }
                  }
                } else {
                  // Fetch alternative session
                  const altSessionRes = await api.sessions.get(req.alternativeSessionId)
                  if (altSessionRes.success && altSessionRes.data) {
                    alternativeSession = {
                      id: altSessionRes.data.id,
                      subject: altSessionRes.data.subject,
                      startTime: altSessionRes.data.startTime,
                      endTime: altSessionRes.data.endTime,
                      duration: altSessionRes.data.duration,
                      isOnline: altSessionRes.data.isOnline,
                      location: altSessionRes.data.location,
                      classId: altSessionRes.data.classId
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to fetch alternative session/class:', e)
              }
            }

            return {
              id: req.id,
              student: studentName,
              subject: sessionData.subject || session.subject || 'Unknown Subject',
              originalDate: originalStart.toLocaleDateString('vi-VN'),
              originalTime: originalStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              requestType: req.type,
              reason: req.reason,
              requestDate: new Date(req.createdAt).toLocaleDateString('vi-VN'),
              status: req.status,
      avatar: '/api/placeholder/40/40',
              sessionId: req.sessionId,
              urgency: getUrgency(req.createdAt, originalStart),
              preferredDate: req.preferredStartTime 
                ? new Date(req.preferredStartTime).toLocaleDateString('vi-VN')
                : undefined,
              preferredTime: req.preferredStartTime
                ? new Date(req.preferredStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : undefined,
              classId: req.classId,
              classInfo: classInfo,
              rawData: {
                ...req,
                alternativeSession: alternativeSession
              }
            }
          })
        )
        
        // Filter by tab (All, Sessions only, Classes only)
        let filtered = transformedRequests
        if (tabValue === 1) {
          // Sessions only - no classId
          filtered = transformedRequests.filter(r => !r.classId)
        } else if (tabValue === 2) {
          // Classes only - has classId
          filtered = transformedRequests.filter(r => r.classId)
        }
        
        setRequests(filtered)
      } else {
        setError(response.error || 'Failed to load requests')
      }
    } catch (err: any) {
      console.error('Error loading requests:', err)
      setError(err.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const getUrgency = (createdAt: string, sessionStart: Date): 'high' | 'medium' | 'low' => {
    const hoursUntilSession = (sessionStart.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (hoursUntilSession < 24) return 'high'
    if (hoursUntilSession < 72) return 'medium'
    return 'low'
  }

  const handleAction = (request: any, type: string) => {
    setSelectedRequest(request)
    setActionType(type)
    setIsActionDialogOpen(true)
    setError('')
    setNewDate('')
    setNewTime('')
    setNewDateValue(null)
    setNewTimeValue(null)
    
    // If approving reschedule request and student has preferred time, pre-fill it
    if (type === 'approve' && request.requestType === 'reschedule' && request.rawData?.preferredStartTime) {
      const preferredDate = new Date(request.rawData.preferredStartTime)
      setNewDateValue(preferredDate)
      setNewTimeValue(preferredDate)
      setNewDate(preferredDate.toISOString().split('T')[0])
      const hours = preferredDate.getHours().toString().padStart(2, '0')
      const minutes = preferredDate.getMinutes().toString().padStart(2, '0')
      setNewTime(`${hours}:${minutes}`)
    }
  }

  const handleUseStudentPreferredTime = () => {
    if (!selectedRequest?.rawData?.preferredStartTime) return
    
    const preferredDate = new Date(selectedRequest.rawData.preferredStartTime)
    setNewDateValue(preferredDate)
    setNewTimeValue(preferredDate)
    setNewDate(preferredDate.toISOString().split('T')[0])
    const hours = preferredDate.getHours().toString().padStart(2, '0')
    const minutes = preferredDate.getMinutes().toString().padStart(2, '0')
    setNewTime(`${hours}:${minutes}`)
  }

  const handleSubmitAction = async () => {
    if (!selectedRequest || !selectedRequest.rawData) return

    setRefreshing(true)
    try {
      if (actionType === 'approve') {
        let newStartTime, newEndTime, alternativeSessionId
        
        if (selectedRequest.rawData.type === 'reschedule') {
          // For class reschedule with alternative session
          if (selectedRequest.rawData.classId && selectedRequest.rawData.alternativeSessionId) {
            // Use the alternative session ID that student selected
            alternativeSessionId = selectedRequest.rawData.alternativeSessionId
            // No need for newStartTime/newEndTime when using alternative session
          } else {
            // Regular reschedule - use picker values if available, otherwise use text inputs
          if (newDateValue && newTimeValue) {
            const combinedDate = new Date(newDateValue)
            combinedDate.setHours(newTimeValue.getHours(), newTimeValue.getMinutes(), 0, 0)
            newStartTime = combinedDate.toISOString()
          } else if (newDate && newTime) {
            const dateTimeStr = `${newDate}T${newTime}:00`
            newStartTime = new Date(dateTimeStr).toISOString()
          } else if (selectedRequest.rawData.preferredStartTime) {
            // Fallback to student's preferred time
            newStartTime = selectedRequest.rawData.preferredStartTime
          } else {
            setError('Vui lòng chọn ngày và giờ mới cho buổi học')
            setRefreshing(false)
            return
          }
          
          // Calculate duration and end time
          const session = selectedRequest.rawData.session || selectedRequest.rawData.sessionDetails || {}
          const originalStart = session.startTime ? new Date(session.startTime) : new Date(selectedRequest.rawData.preferredStartTime)
          const originalEnd = session.endTime ? new Date(session.endTime) : new Date(selectedRequest.rawData.preferredEndTime)
          const duration = originalEnd.getTime() - originalStart.getTime()
          newEndTime = new Date(new Date(newStartTime).getTime() + duration).toISOString()
          }
        }

        const response = await api.sessionRequests.approve(selectedRequest.rawData.id, {
          responseMessage: reason || undefined,
          newStartTime,
          newEndTime,
          alternativeSessionId
    })

        if (response.success) {
          await loadRequests()
    setIsActionDialogOpen(false)
    setReason('')
    setNewDate('')
    setNewTime('')
        } else {
          setError(response.error || 'Failed to approve request')
        }
      } else if (actionType === 'reject') {
        const response = await api.sessionRequests.reject(selectedRequest.rawData.id, {
          responseMessage: reason || undefined
        })

        if (response.success) {
          await loadRequests()
          setIsActionDialogOpen(false)
          setReason('')
        } else {
          setError(response.error || 'Failed to reject request')
        }
      }
    } catch (err: any) {
      console.error('Error submitting action:', err)
      setError(err.message || 'Failed to submit action')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest || !selectedRequest.rawData) return

    setRefreshing(true)
    setError('')
    try {
      const response = await api.sessionRequests.delete(selectedRequest.rawData.id)
      if (response.success) {
        await loadRequests()
        setIsDeleteDialogOpen(false)
        setSelectedRequest(null)
      } else {
        setError(response.error || 'Failed to delete request')
      }
    } catch (err: any) {
      console.error('Error deleting request:', err)
      setError(err.message || 'Failed to delete request')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteClick = (request: any) => {
    setSelectedRequest(request)
    setIsDeleteDialogOpen(true)
    setError('')
  }

  // Filter requests by status
  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true
    return req.status === statusFilter
  })

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    sessions: requests.filter(r => !r.classId).length,
    classes: requests.filter(r => r.classId).length
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

            {/* Request Stats */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                REQUEST STATS
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Pending:</span>
                    <Chip 
                      label={stats.pending} 
                      size="small" 
                      sx={{ 
                        backgroundColor: theme === 'dark' ? '#f59e0b' : '#fef3c7',
                        color: theme === 'dark' ? '#ffffff' : '#92400e',
                        fontWeight: 600
                      }} 
                    />
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Approved:</span>
                    <Chip 
                      label={stats.approved} 
                      size="small" 
                      sx={{ 
                        backgroundColor: theme === 'dark' ? '#10b981' : '#d1fae5',
                        color: theme === 'dark' ? '#ffffff' : '#065f46',
                        fontWeight: 600
                      }} 
                    />
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Rejected:</span>
                    <Chip 
                      label={stats.rejected} 
                      size="small" 
                      sx={{ 
                        backgroundColor: theme === 'dark' ? '#ef4444' : '#fee2e2',
                        color: theme === 'dark' ? '#ffffff' : '#991b1b',
                        fontWeight: 600
                      }} 
                    />
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {stats.total}
                    </span>
                  </div>
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Handle Cancel/Reschedule Requests
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage student cancellation and reschedule requests
                </p>
              </div>
              <IconButton
                onClick={loadRequests}
                disabled={loading || refreshing}
                sx={{
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
                  }
                }}
                    >
                <RefreshIcon />
              </IconButton>
            </div>

            {/* Tabs for Session/Class Selection */}
            <Box sx={{ 
              borderBottom: 1, 
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              mb: 3
            }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                      fontWeight: 600
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                    height: 3
                  }
                }}
              >
                <Tab 
                  icon={<EventIcon />} 
                  iconPosition="start"
                  label={`All Requests (${stats.total})`}
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<PersonIcon />} 
                  iconPosition="start"
                  label={`Sessions (${stats.sessions})`}
                  sx={{ mr: 2 }}
                />
                <Tab 
                  icon={<SchoolIcon />} 
                  iconPosition="start"
                  label={`Classes (${stats.classes})`}
                />
              </Tabs>
            </Box>

            {/* Filter Chips */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 1, 
                  alignSelf: 'center',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  fontWeight: 500
                }}
              >
                Type:
              </Typography>
              <Chip
                label="All"
                onClick={() => setFilterType('all')}
                color={filterType === 'all' ? 'primary' : 'default'}
                variant={filterType === 'all' ? 'filled' : 'outlined'}
                        sx={{
                  backgroundColor: filterType === 'all' 
                    ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                    : 'transparent',
                  color: filterType === 'all'
                    ? '#ffffff'
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  '&:hover': {
                    backgroundColor: filterType === 'all'
                      ? (theme === 'dark' ? '#2563eb' : '#1d4ed8')
                      : (theme === 'dark' ? '#374151' : '#f3f4f6')
                  }
                }}
              />
              <Chip
                label="Cancel"
                onClick={() => setFilterType('cancel')}
                color={filterType === 'cancel' ? 'primary' : 'default'}
                variant={filterType === 'cancel' ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: filterType === 'cancel' 
                    ? (theme === 'dark' ? '#ef4444' : '#dc2626')
                    : 'transparent',
                  color: filterType === 'cancel'
                    ? '#ffffff'
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  '&:hover': {
                    backgroundColor: filterType === 'cancel'
                      ? (theme === 'dark' ? '#dc2626' : '#b91c1c')
                      : (theme === 'dark' ? '#374151' : '#f3f4f6')
                  }
                }}
              />
              <Chip
                label="Reschedule"
                onClick={() => setFilterType('reschedule')}
                color={filterType === 'reschedule' ? 'primary' : 'default'}
                variant={filterType === 'reschedule' ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: filterType === 'reschedule' 
                    ? (theme === 'dark' ? '#f59e0b' : '#d97706')
                    : 'transparent',
                  color: filterType === 'reschedule'
                    ? '#ffffff'
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  '&:hover': {
                    backgroundColor: filterType === 'reschedule'
                      ? (theme === 'dark' ? '#d97706' : '#b45309')
                      : (theme === 'dark' ? '#374151' : '#f3f4f6')
                  }
                }}
              />
              
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    fontWeight: 500
                  }}
                >
                  Status:
                </Typography>
                <Chip
                  label="All"
                  onClick={() => setStatusFilter('all')}
                  color={statusFilter === 'all' ? 'primary' : 'default'}
                  variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                      size="small" 
                  sx={{
                    backgroundColor: statusFilter === 'all' 
                      ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                      : 'transparent',
                    color: statusFilter === 'all'
                      ? '#ffffff'
                      : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                  }}
                />
                <Chip
                  label="Pending"
                  onClick={() => setStatusFilter('pending')}
                  color={statusFilter === 'pending' ? 'primary' : 'default'}
                  variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    backgroundColor: statusFilter === 'pending' 
                      ? (theme === 'dark' ? '#f59e0b' : '#fef3c7')
                      : 'transparent',
                    color: statusFilter === 'pending'
                      ? (theme === 'dark' ? '#ffffff' : '#92400e')
                      : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                  }}
                />
                <Chip
                  label="Approved"
                  onClick={() => setStatusFilter('approved')}
                  color={statusFilter === 'approved' ? 'primary' : 'default'}
                  variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    backgroundColor: statusFilter === 'approved' 
                      ? (theme === 'dark' ? '#10b981' : '#d1fae5')
                      : 'transparent',
                    color: statusFilter === 'approved'
                      ? (theme === 'dark' ? '#ffffff' : '#065f46')
                      : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                      }}
                />
                <Chip
                  label="Rejected"
                  onClick={() => setStatusFilter('rejected')}
                  color={statusFilter === 'rejected' ? 'primary' : 'default'}
                  variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
                        size="small" 
                  sx={{
                    backgroundColor: statusFilter === 'rejected' 
                      ? (theme === 'dark' ? '#ef4444' : '#fee2e2')
                      : 'transparent',
                    color: statusFilter === 'rejected'
                      ? (theme === 'dark' ? '#ffffff' : '#991b1b')
                      : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                  }}
                />
              </Box>
            </Box>
          </div>

          {/* Error Message */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                color: theme === 'dark' ? '#fca5a5' : '#991b1b'
                        }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: theme === 'dark' ? '#3b82f6' : '#2563eb' }} />
            </Box>
          )}

          {/* Requests List */}
          {!loading && (
            <TabPanel value={tabValue} index={0}>
              <RequestsList 
                requests={filteredRequests} 
                theme={theme}
                onAction={handleAction}
                onDelete={handleDeleteClick}
                getInitials={getInitials}
                getAvatarColor={getAvatarColor}
              />
            </TabPanel>
                    )}
          {!loading && (
            <TabPanel value={tabValue} index={1}>
              <RequestsList 
                requests={filteredRequests.filter(r => !r.classId)} 
                theme={theme}
                onAction={handleAction}
                onDelete={handleDeleteClick}
                getInitials={getInitials}
                getAvatarColor={getAvatarColor}
              />
            </TabPanel>
          )}
          {!loading && (
            <TabPanel value={tabValue} index={2}>
              <RequestsList 
                requests={filteredRequests.filter(r => r.classId)} 
                theme={theme}
                onAction={handleAction}
                onDelete={handleDeleteClick}
                getInitials={getInitials}
                getAvatarColor={getAvatarColor}
              />
            </TabPanel>
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

              {/* Mobile Request Stats */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  REQUEST STATS
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Pending:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {stats.pending}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Approved:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {stats.approved}
                      </span>
                    </div>
                  </div>
                </div>
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

      {/* Action Dialog */}
      <Dialog 
        open={isActionDialogOpen} 
        onClose={() => setIsActionDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: theme === 'dark' ? '#ffffff' : '#111827',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <div className="space-y-4">
            <div>
              <Typography variant="body1" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 1 }}>
                Student: {selectedRequest?.student}
              </Typography>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                Session: {selectedRequest?.subject} - {selectedRequest?.originalDate} at {selectedRequest?.originalTime}
              </Typography>
            </div>

            {error && (
              <Alert severity="error" sx={{ 
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                color: theme === 'dark' ? '#fca5a5' : '#991b1b'
              }}>
                {error}
              </Alert>
            )}

            {actionType === 'approve' && selectedRequest?.requestType === 'reschedule' && (
              <Box>
                {/* Alternative Session Info for Class Reschedule */}
                {selectedRequest?.rawData?.classId && selectedRequest?.rawData?.alternativeSessionId ? (
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mb: 2,
                      backgroundColor: theme === 'dark' ? '#064e3b' : '#d1fae5',
                      color: theme === 'dark' ? '#a7f3d0' : '#065f46',
                      '& .MuiAlert-icon': {
                        color: theme === 'dark' ? '#10b981' : '#059669'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Học sinh đã chọn buổi học thay thế:
                    </Typography>
                    {selectedRequest?.rawData?.alternativeSession ? (
                      <>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{selectedRequest.rawData.alternativeSession.subject || 'Buổi học thay thế'}</strong>
                          {selectedRequest.rawData.alternativeSession.classInfo?.code && (
                            <Chip 
                              label={`Lớp: ${selectedRequest.rawData.alternativeSession.classInfo.code}`}
                              size="small"
                              sx={{ 
                                ml: 1,
                                backgroundColor: theme === 'dark' ? '#1e40af' : '#3b82f6',
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                height: '20px'
                              }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2">
                          lúc {selectedRequest.rawData.alternativeSession.startTime 
                            ? new Date(selectedRequest.rawData.alternativeSession.startTime).toLocaleString('vi-VN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Đang tải...'}
                        </Typography>
                        {selectedRequest.rawData.alternativeSession.duration && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            Thời lượng: {selectedRequest.rawData.alternativeSession.duration} phút
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2">
                        Đang tải thông tin...
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Khi approve, học sinh sẽ được chuyển sang buổi học này và bị xóa khỏi buổi học ban đầu.
                    </Typography>
                  </Alert>
                ) : (
                  <>
                {/* Student's Preferred Time Info */}
                {selectedRequest?.rawData?.preferredStartTime && (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2,
                      backgroundColor: theme === 'dark' ? '#1e3a5f' : '#dbeafe',
                      color: theme === 'dark' ? '#dbeafe' : '#1e40af',
                      '& .MuiAlert-icon': {
                        color: theme === 'dark' ? '#60a5fa' : '#3b82f6'
                      }
                    }}
                    action={
                      <MuiButton
                        size="small"
                        onClick={handleUseStudentPreferredTime}
                        startIcon={<AutoAwesome />}
                        sx={{
                          color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Dùng thời gian này
                      </MuiButton>
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Thời gian học sinh mong muốn:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedRequest.rawData.preferredStartTime).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} lúc {new Date(selectedRequest.rawData.preferredStartTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Alert>
                )}

                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Chọn ngày và giờ mới cho buổi học
                </Typography>
                  </>
                )}

                {/* Only show date/time pickers if not using alternative session */}
                {!(selectedRequest?.rawData?.classId && selectedRequest?.rawData?.alternativeSessionId) && (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Ngày mới"
                        value={newDateValue}
                        onChange={(newValue) => {
                          setNewDateValue(newValue)
                          if (newValue) {
                            setNewDate(newValue.toISOString().split('T')[0])
                          } else {
                            setNewDate('')
                          }
                        }}
                        minDate={new Date()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                color: theme === 'dark' ? '#ffffff' : '#111827',
                                '& fieldset': {
                                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                                },
                                '&:hover fieldset': {
                                  borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                                },
                                '& input::placeholder': {
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                  opacity: 1
                                },
                                '& .MuiInputBase-input': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                },
                                '& input': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                }
                              },
                              '& .MuiInputLabel-root': {
                                color: theme === 'dark' ? '#d1d5db' : '#374151',
                                '&.Mui-focused': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827'
                                }
                              },
                              // Target MUI X Date Pickers specific classes with !important
                              '& .MuiPickersInputBase-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& .MuiPickersOutlinedInput-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiPickersInputBase-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiPickersOutlinedInput-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              // Target SVG icons in DatePicker/TimePicker - CRITICAL for dark mode visibility
                              '& .MuiSvgIcon-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiSvgIcon-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              }
                            }
                          },
                          popper: {
                            sx: {
                              '& .MuiPaper-root': {
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                boxShadow: theme === 'dark' 
                                  ? '0 10px 25px rgba(0, 0, 0, 0.5)'
                                  : '0 10px 25px rgba(0, 0, 0, 0.15)',
                                // Style calendar popup content
                                '& .MuiPickersCalendarHeader-root': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                  '& .MuiPickersCalendarHeader-label': {
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                  },
                                  '& .MuiIconButton-root': {
                                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                      color: theme === 'dark' ? '#ffffff' : '#111827',
                                    }
                                  }
                                },
                                '& .MuiDayCalendar-weekContainer': {
                                  '& .MuiPickersDay-root': {
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                      color: '#ffffff',
                                      '&:hover': {
                                        backgroundColor: theme === 'dark' ? '#2563eb' : '#1d4ed8',
                                      },
                                      '&:focus': {
                                        backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                      }
                                    },
                                    '&.Mui-disabled': {
                                      color: theme === 'dark' ? '#4b5563' : '#9ca3af',
                                    }
                                  }
                                },
                                '& .MuiPickersCalendarHeader-weekDayLabel': {
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }
                              }
                            }
                          }
                        }}
                  />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TimePicker
                        label="Giờ mới"
                        value={newTimeValue}
                        onChange={(newValue) => {
                          setNewTimeValue(newValue)
                          if (newValue) {
                            const hours = newValue.getHours().toString().padStart(2, '0')
                            const minutes = newValue.getMinutes().toString().padStart(2, '0')
                            setNewTime(`${hours}:${minutes}`)
                          } else {
                            setNewTime('')
                          }
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                color: theme === 'dark' ? '#ffffff' : '#111827',
                                '& fieldset': {
                                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                                },
                                '&:hover fieldset': {
                                  borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                                },
                                '& input::placeholder': {
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                  opacity: 1
                                },
                                '& .MuiInputBase-input': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                },
                                '& input': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                }
                              },
                              '& .MuiInputLabel-root': {
                                color: theme === 'dark' ? '#d1d5db' : '#374151',
                                '&.Mui-focused': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827'
                                }
                              },
                              // Target MUI X Date Pickers specific classes with !important
                              '& .MuiPickersInputBase-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& .MuiPickersOutlinedInput-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiPickersInputBase-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiPickersOutlinedInput-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              // Target SVG icons in DatePicker/TimePicker - CRITICAL for dark mode visibility
                              '& .MuiSvgIcon-root': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              },
                              '& [class*="MuiSvgIcon-root"]': {
                                color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                              }
                            }
                          },
                          popper: {
                            sx: {
                              '& .MuiPaper-root': {
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                boxShadow: theme === 'dark' 
                                  ? '0 10px 25px rgba(0, 0, 0, 0.5)'
                                  : '0 10px 25px rgba(0, 0, 0, 0.15)',
                                // Style time picker popup content
                                '& .MuiTimePickerToolbar-root': {
                                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                },
                                '& .MuiTimeClock-root': {
                                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                  '& .MuiClock-pin': {
                                    backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                  },
                                  '& .MuiClock-pointer': {
                                    backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                  }
                                },
                                '& .MuiTimePickerToolbar-hourMinuteLabel': {
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                },
                                '& .MuiTimePickerToolbar-ampmLabel': {
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                  '&.Mui-selected': {
                                    color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                  }
                                },
                                '& .MuiTimeClock-meridiemText': {
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                  '&.Mui-selected': {
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                    backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                  }
                                },
                                // For desktop time picker (list view)
                                '& .MuiTimePickerToolbar-timeContainer': {
                                  '& .MuiTimePickerToolbar-hourMinuteLabel': {
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                  }
                                },
                                '& .MuiPickersList-root': {
                                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                  '& .MuiPickersListItem-root': {
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                                      color: '#ffffff',
                                      '&:hover': {
                                        backgroundColor: theme === 'dark' ? '#2563eb' : '#1d4ed8',
                                      }
                                    }
                                  }
                                },
                                // Style MultiSectionDigitalClock items (desktop time picker list)
                                '& .MuiMultiSectionDigitalClockSection-item': {
                                  color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  '&.Mui-selected': {
                                    backgroundColor: theme === 'dark' ? '#3b82f6 !important' : '#2563eb !important',
                                    color: '#ffffff !important',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#2563eb !important' : '#1d4ed8 !important',
                                    }
                                  },
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#374151 !important' : '#f3f4f6 !important',
                                  },
                                  '& .MuiTypography-root': {
                                    color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  },
                                  '& span': {
                                    color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  }
                                },
                                // Also target via MuiMenuItem-root for desktop time picker
                                '& .MuiMenuItem-root.MuiMultiSectionDigitalClockSection-item': {
                                  color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  '&.Mui-selected': {
                                    backgroundColor: theme === 'dark' ? '#3b82f6 !important' : '#2563eb !important',
                                    color: '#ffffff !important',
                                  },
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#374151 !important' : '#f3f4f6 !important',
                                  },
                                  '& .MuiTypography-root': {
                                    color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  }
                                },
                                // Target MuiButtonBase-root for time picker items
                                '& .MuiButtonBase-root.MuiMenuItem-root.MuiMultiSectionDigitalClockSection-item': {
                                  color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  '&.Mui-selected': {
                                    backgroundColor: theme === 'dark' ? '#3b82f6 !important' : '#2563eb !important',
                                    color: '#ffffff !important',
                                  },
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#374151 !important' : '#f3f4f6 !important',
                                  },
                                  '& .MuiTypography-root': {
                                    color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  },
                                  '& span': {
                                    color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                                  }
                                },
                                '& .MuiDialogActions-root': {
                                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                  '& .MuiButton-root': {
                                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                    '&:hover': {
                                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                      color: theme === 'dark' ? '#ffffff' : '#111827',
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }}
                  />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
                )}
              </Box>
            )}

            <div>
              <TextField
                fullWidth
                label="Response Message"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? 'Message to send to student about approval...'
                    : 'Reason for rejection...'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <MuiButton 
            onClick={() => setIsActionDialogOpen(false)} 
            disabled={refreshing}
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSubmitAction} 
            variant="contained"
            disabled={refreshing}
            sx={{
              backgroundColor: actionType === 'approve' 
                ? (theme === 'dark' ? '#10b981' : '#059669')
                : (theme === 'dark' ? '#ef4444' : '#dc2626'),
              color: '#ffffff',
              '&:hover': {
                backgroundColor: actionType === 'approve' 
                  ? (theme === 'dark' ? '#059669' : '#047857')
                  : (theme === 'dark' ? '#dc2626' : '#b91c1c')
              }
            }}
          >
            {refreshing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#111827'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: theme === 'dark' ? '#ffffff' : '#111827',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          Xóa yêu cầu đã xử lý
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 2 }}>
            Bạn có chắc chắn muốn xóa yêu cầu này không?
          </Typography>
          {selectedRequest && (
            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563', mb: 1 }}>
                <strong>Student:</strong> {selectedRequest.student}
              </Typography>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563', mb: 1 }}>
                <strong>Subject:</strong> {selectedRequest.subject}
              </Typography>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563', mb: 1 }}>
                <strong>Type:</strong> {selectedRequest.requestType}
              </Typography>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
                <strong>Status:</strong> {selectedRequest.status}
              </Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ 
              backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
              color: theme === 'dark' ? '#fca5a5' : '#991b1b'
            }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <MuiButton 
            onClick={() => setIsDeleteDialogOpen(false)} 
            disabled={refreshing}
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
          >
            Hủy
          </MuiButton>
          <MuiButton 
            onClick={handleDeleteRequest} 
            variant="contained"
            disabled={refreshing}
            startIcon={<DeleteIcon />}
            sx={{
              backgroundColor: theme === 'dark' ? '#ef4444' : '#dc2626',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: theme === 'dark' ? '#dc2626' : '#b91c1c'
              }
            }}
          >
            {refreshing ? 'Đang xóa...' : 'Xóa'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

// RequestsList Component
interface RequestsListProps {
  requests: any[]
  theme: string
  onAction: (request: any, type: string) => void
  onDelete: (request: any) => void
  getInitials: (name: string) => string
  getAvatarColor: (name: string) => string
}

const RequestsList: React.FC<RequestsListProps> = ({ 
  requests, 
  theme, 
  onAction, 
  onDelete,
  getInitials, 
  getAvatarColor 
}) => {
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', mb: 1 }}>
          Không có yêu cầu nào
        </Typography>
        <Typography variant="body2" sx={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
          Chưa có request nào trong danh mục này
        </Typography>
      </Box>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {requests.map((request) => (
        <Card
          key={request.id}
          sx={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: 2,
            boxShadow: theme === 'dark' 
              ? '0 1px 3px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: theme === 'dark' 
                ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent>
            {/* Request Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: getAvatarColor(request.student),
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(request.student)}
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 600,
                      mb: 0.5
                    }}
                  >
                    {request.student}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      mb: 1
                    }}
                  >
                    {request.subject} • {request.sessionId}
                    {request.classInfo && (
                      <Chip
                        label={`Lớp: ${request.classInfo.code}`}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                          color: theme === 'dark' ? '#93c5fd' : '#1e40af',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={request.requestType}
                      size="small"
                      sx={{
                        backgroundColor: request.requestType === 'cancel' 
                          ? (theme === 'dark' ? '#7f1d1d' : '#fee2e2')
                          : (theme === 'dark' ? '#78350f' : '#fef3c7'),
                        color: request.requestType === 'cancel'
                          ? (theme === 'dark' ? '#fca5a5' : '#991b1b')
                          : (theme === 'dark' ? '#fcd34d' : '#92400e'),
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                    {request.classId ? (
                      <Chip
                        label="Class Session"
                        size="small"
                        sx={{
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                          color: theme === 'dark' ? '#93c5fd' : '#1e40af',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    ) : (
                      <Chip
                        label="Individual"
                        size="small"
                        sx={{
                          backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    )}
                    <Chip
                      label={request.urgency}
                      size="small"
                      sx={{
                        backgroundColor: request.urgency === 'high'
                          ? (theme === 'dark' ? '#7f1d1d' : '#fee2e2')
                          : request.urgency === 'medium'
                          ? (theme === 'dark' ? '#78350f' : '#fef3c7')
                          : (theme === 'dark' ? '#1e3a8a' : '#dbeafe'),
                        color: request.urgency === 'high'
                          ? (theme === 'dark' ? '#fca5a5' : '#991b1b')
                          : request.urgency === 'medium'
                          ? (theme === 'dark' ? '#fcd34d' : '#92400e')
                          : (theme === 'dark' ? '#93c5fd' : '#1e40af'),
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              <Chip
                label={request.status}
                size="small"
                sx={{
                  backgroundColor: request.status === 'pending'
                    ? (theme === 'dark' ? '#78350f' : '#fef3c7')
                    : request.status === 'approved'
                    ? (theme === 'dark' ? '#065f46' : '#d1fae5')
                    : (theme === 'dark' ? '#7f1d1d' : '#fee2e2'),
                  color: request.status === 'pending'
                    ? (theme === 'dark' ? '#fcd34d' : '#92400e')
                    : request.status === 'approved'
                    ? (theme === 'dark' ? '#6ee7b7' : '#059669')
                    : (theme === 'dark' ? '#fca5a5' : '#991b1b'),
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>

            <Divider sx={{ my: 2, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />

            {/* Session Details */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ fontSize: 18, color: theme === 'dark' ? '#9ca3af' : '#6b7280', mr: 1 }} />
                <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
                  Original: {request.originalDate} at {request.originalTime}
                </Typography>
              </Box>
              {request.requestType === 'reschedule' && request.preferredDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ fontSize: 18, color: theme === 'dark' ? '#9ca3af' : '#6b7280', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
                    Preferred: {request.preferredDate} at {request.preferredTime}
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                Requested: {request.requestDate}
              </Typography>
            </Box>

            {/* Reason */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  mb: 1
                }}
              >
                Reason:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                  lineHeight: 1.6
                }}
              >
                {request.reason}
              </Typography>
            </Box>

            {/* Action Buttons */}
            {request.status === 'pending' ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <MuiButton
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => onAction(request, 'approve')}
                  fullWidth
                  sx={{
                    backgroundColor: theme === 'dark' ? '#10b981' : '#059669',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#059669' : '#047857'
                    }
                  }}
                >
                  Approve
                </MuiButton>
                <MuiButton
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => onAction(request, 'reject')}
                  fullWidth
                  sx={{
                    borderColor: theme === 'dark' ? '#ef4444' : '#dc2626',
                    color: theme === 'dark' ? '#fca5a5' : '#dc2626',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                      borderColor: theme === 'dark' ? '#dc2626' : '#b91c1c'
                    }
                  }}
                >
                  Reject
                </MuiButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <MuiButton
                  variant="outlined"
                  startIcon={<Info />}
                  onClick={() => onAction(request, 'view')}
                  sx={{
                    flex: 1,
                    borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                      borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af'
                    }
                  }}
                >
                  View Details
                </MuiButton>
                <IconButton
                  onClick={() => onDelete(request)}
                  sx={{
                    color: theme === 'dark' ? '#ef4444' : '#dc2626',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default HandleCancelReschedule
