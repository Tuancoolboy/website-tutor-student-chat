import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  Typography,
  Alert,
  Chip,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Badge,
  Snackbar
} from '@mui/material'
import {
  CalendarToday,
  AccessTime,
  EventAvailable,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material'
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { vi, enUS } from 'date-fns/locale'
import { api } from '../../lib/api'

interface RequestDialogProps {
  open: boolean
  onClose: () => void
  session: {
    id: string
    subject: string
    startTime: string
    endTime: string
    classId?: string
    tutorId?: string
  }
  type: 'cancel' | 'reschedule'
  classInfo?: {
    id: string
    code: string
    subject: string
  }
  onSuccess?: () => void
}

interface AvailableSlot {
  date: string // YYYY-MM-DD
  dateObj: Date
  startTime: string // ISO string
  endTime: string // ISO string
  displayDate: string // Formatted date
  displayTime: string // Formatted time (e.g., "9:00 AM - 10:00 AM")
}

const RequestDialog: React.FC<RequestDialogProps> = ({
  open,
  onClose,
  session,
  type,
  classInfo,
  onSuccess
}) => {
  const { theme } = useTheme()
  const [reason, setReason] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [preferredDateValue, setPreferredDateValue] = useState<Date | null>(null)
  const [preferredTimeValue, setPreferredTimeValue] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [selectedDateForSlot, setSelectedDateForSlot] = useState<string>('') // Selected date for slot selection
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(new Date()) // Start date of current week in calendar

  // Alternative sessions for class reschedule
  const [alternativeSessions, setAlternativeSessions] = useState<any[]>([])
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null)

  const handleClose = () => {
    setReason('')
    setPreferredDate('')
    setPreferredTime('')
    setPreferredDateValue(null)
    setPreferredTimeValue(null)
    setError('')
    setSuccessMessage('')
    setShowSuccessSnackbar(false)
    setAvailableSlots([])
    setSelectedSlot(null)
    setSelectedDateForSlot('')
    setCalendarWeekStart(new Date())
    setAlternativeSessions([])
    setSelectedAlternative(null)
    onClose()
  }

  // Load alternative sessions for class reschedule
  useEffect(() => {
    const loadAlternatives = async () => {
      if (!open || type !== 'reschedule' || !classInfo) {
        setAlternativeSessions([])
        return
      }

      try {
        setLoadingAlternatives(true)
        const params: any = {}
        
        // Use classId if available, otherwise use sessionId
        if (classInfo.id) {
          params.classId = classInfo.id
        } else if (session.id) {
          params.sessionId = session.id
        }

        const response = await api.sessionRequests.getAlternatives(params)
        
        if (response.success && response.data?.alternatives) {
          setAlternativeSessions(response.data.alternatives)
        } else {
          setAlternativeSessions([])
        }
      } catch (err) {
        console.error('Failed to load alternative sessions:', err)
        setAlternativeSessions([])
      } finally {
        setLoadingAlternatives(false)
      }
    }

    loadAlternatives()
  }, [open, type, classInfo, session.id])

  // Load available slots when dialog opens for reschedule (for individual sessions)
  useEffect(() => {
    const loadAvailableSlots = async () => {
      // Skip if this is a class reschedule (we use alternatives instead)
      if (!open || type !== 'reschedule' || !session.tutorId || classInfo) {
        setAvailableSlots([])
        return
      }

      try {
        setLoadingSlots(true)
        
        // Get availability excluding class schedules
        const availabilityResponse = await api.availability.get(session.tutorId, true)
        
        if (!availabilityResponse || !availabilityResponse.data || !availabilityResponse.data.timeSlots) {
          setAvailableSlots([])
          return
        }

        // Get tutor's existing sessions to exclude them
        const sessionsResponse = await api.sessions.list({
          tutorId: session.tutorId,
          status: 'confirmed,pending',
          page: 1,
          limit: 200
        })

        const existingSessions = sessionsResponse?.data?.data || sessionsResponse?.data || []
        
        // Calculate session duration
        const sessionDuration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
        const durationMinutes = Math.floor(sessionDuration / 60000)

        // Generate available slots for next 60 days (increased from 14)
        const slots: AvailableSlot[] = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 0; i < 60; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
          
          // Find availability for this day
          const dayAvailability = availabilityResponse.data.timeSlots.filter(
            (slot: any) => slot.day === dayName
          )

          if (dayAvailability.length === 0) continue

          dayAvailability.forEach((avail: any) => {
            const [startHour, startMin] = avail.startTime.split(':').map(Number)
            const [endHour, endMin] = avail.endTime.split(':').map(Number)
            
            const startMinutes = startHour * 60 + startMin
            const endMinutes = endHour * 60 + endMin

            // Generate slots based on session duration
            for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += 30) {
              const slotHour = Math.floor(minutes / 60)
              const slotMin = minutes % 60
              
              const slotStart = new Date(date)
              slotStart.setHours(slotHour, slotMin, 0, 0)
              
              const slotEnd = new Date(slotStart)
              slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)

              // Check if slot conflicts with existing sessions
              const hasConflict = existingSessions.some((existingSession: any) => {
                if (existingSession.id === session.id) return false // Exclude current session
                if (existingSession.classId) return false // Don't check class sessions
                
                const existingStart = new Date(existingSession.startTime)
                const existingEnd = new Date(existingSession.endTime)

                // Check if same date and times overlap
                return (
                  existingStart.toDateString() === slotStart.toDateString() &&
                  (
                    (slotStart >= existingStart && slotStart < existingEnd) ||
                    (slotEnd > existingStart && slotEnd <= existingEnd) ||
                    (slotStart <= existingStart && slotEnd >= existingEnd)
                  )
                )
              })

              if (!hasConflict && slotStart >= new Date()) {
                // Format for display
                const displayDate = slotStart.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })
                
                const startTimeStr = slotStart.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
                const endTimeStr = slotEnd.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })

                slots.push({
                  date: date.toISOString().split('T')[0],
                  dateObj: date,
                  startTime: slotStart.toISOString(),
                  endTime: slotEnd.toISOString(),
                  displayDate: displayDate.charAt(0).toUpperCase() + displayDate.slice(1),
                  displayTime: `${startTimeStr} - ${endTimeStr}`
                })
              }
            }
          })
        }

        // Sort by date and time
        slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        setAvailableSlots(slots)
      } catch (err) {
        console.error('Failed to load available slots:', err)
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    loadAvailableSlots()
  }, [open, type, session.tutorId, session.id, session.startTime, session.endTime])

  const handleSelectDate = (date: string) => {
    setSelectedDateForSlot(date)
    setSelectedSlot(null)
    setError('')
  }

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday is day 1
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

  // Navigate weeks
  const handlePreviousWeek = () => {
    const newWeek = new Date(calendarWeekStart)
    newWeek.setDate(newWeek.getDate() - 7)
    setCalendarWeekStart(getWeekStart(newWeek))
  }

  const handleNextWeek = () => {
    const newWeek = new Date(calendarWeekStart)
    newWeek.setDate(newWeek.getDate() + 7)
    setCalendarWeekStart(getWeekStart(newWeek))
  }

  const handleTodayWeek = () => {
    setCalendarWeekStart(getWeekStart(new Date()))
  }

  const handleSelectTimeSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot)
    setPreferredDate(slot.date)
    // Extract time from ISO string (HH:MM format) - convert to local time
    const slotDate = new Date(slot.startTime)
    const hours = slotDate.getHours().toString().padStart(2, '0')
    const minutes = slotDate.getMinutes().toString().padStart(2, '0')
    setPreferredTime(`${hours}:${minutes}`)
    // Also update picker values
    setPreferredDateValue(slotDate)
    setPreferredTimeValue(slotDate)
    setError('')
  }

  const handleSubmit = async () => {
    setError('')

    // Validate
    if (!reason.trim() || reason.length < 10) {
      setError('Vui lòng nhập lý do (ít nhất 10 ký tự)')
      return
    }

    if (type === 'reschedule') {
      // For class reschedule, check if alternative session is selected
      if (classInfo) {
        if (!selectedAlternative) {
          setError('Vui lòng chọn buổi học thay thế')
          return
        }

        // For class reschedule with alternative session
        setLoading(true)
        try {
          const requestData: any = {
            sessionId: session.id,
            type: 'reschedule',
            reason: reason,
            alternativeSessionId: selectedAlternative // Send selected alternative session ID
          };
          // Don't include preferredStartTime/preferredEndTime for class reschedule with alternative
          
          const response = await api.sessionRequests.create(requestData)
          
          if (response.success) {
            setSuccessMessage('Yêu cầu đổi lịch đã được gửi thành công! Gia sư sẽ xem xét và phản hồi sớm.')
            setShowSuccessSnackbar(true)
            setLoading(false)
            return
          } else {
            setError(response.error || 'Có lỗi xảy ra khi tạo yêu cầu')
          }
        } catch (err: any) {
          setError(err.message || 'Có lỗi xảy ra khi tạo yêu cầu')
        } finally {
          setLoading(false)
        }
        return
      }

      // For individual session reschedule, use existing logic
      // If slot is selected, use its ISO string directly to avoid timezone issues
      let preferredStartTime: Date
      if (selectedSlot) {
        preferredStartTime = new Date(selectedSlot.startTime)
      } else if (preferredDateValue && preferredTimeValue) {
        // Use picker values (preferred)
        preferredStartTime = new Date(preferredDateValue)
        preferredStartTime.setHours(preferredTimeValue.getHours(), preferredTimeValue.getMinutes(), 0, 0)
      } else if (preferredDate && preferredTime) {
        // Fallback to manual input
        const [hours, minutes] = preferredTime.split(':').map(Number)
        preferredStartTime = new Date(preferredDate)
        preferredStartTime.setHours(hours, minutes, 0, 0)
      } else {
        setError('Vui lòng chọn ngày và giờ mong muốn cho buổi học mới')
        return
      }

      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      let preferredEndTime: Date
      if (selectedSlot) {
        preferredEndTime = new Date(selectedSlot.endTime)
      } else {
        preferredEndTime = new Date(preferredStartTime.getTime() + duration)
      }

      // Compare with current time (add 1 minute buffer to avoid edge cases)
      const now = new Date()
      const oneMinuteFromNow = new Date(now.getTime() + 60000)
      
      if (preferredStartTime < oneMinuteFromNow) {
        setError('Thời gian mong muốn phải ở tương lai (ít nhất 1 phút từ bây giờ)')
        return
      }

      // Frontend basic validation passed, backend will do detailed validation
      // (availability check, conflict check with sessions/classes)
      setLoading(true)
      try {
        const response = await api.sessionRequests.create({
          sessionId: session.id,
          type: 'reschedule',
          reason: reason,
          preferredStartTime: preferredStartTime.toISOString(),
          preferredEndTime: preferredEndTime.toISOString()
        })

        if (response.success) {
          // Show success message
          setSuccessMessage('Yêu cầu đổi lịch đã được gửi thành công! Gia sư sẽ xem xét và phản hồi sớm.')
          setShowSuccessSnackbar(true)
          setLoading(false) // Stop loading state
          
          // Don't close dialog immediately, let user see the success message
          // onSuccess will be called after snackbar auto-closes
        } else {
          // Backend validation error (availability, conflicts, etc.)
          setError(response.error || 'Có lỗi xảy ra khi tạo yêu cầu')
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tạo yêu cầu')
      } finally {
        setLoading(false)
      }
    } else {
      // Cancel request
      setLoading(true)
      try {
        const response = await api.sessionRequests.create({
          sessionId: session.id,
          type: 'cancel',
          reason: reason
        })

        if (response.success) {
          // Show success message
          setSuccessMessage('Yêu cầu hủy buổi học đã được gửi thành công! Gia sư sẽ xem xét và phản hồi sớm.')
          setShowSuccessSnackbar(true)
          setLoading(false) // Stop loading state
          
          // Don't close dialog immediately, let user see the success message
          // onSuccess will be called after snackbar auto-closes
        } else {
          setError(response.error || 'Có lỗi xảy ra khi tạo yêu cầu')
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tạo yêu cầu')
      } finally {
        setLoading(false)
      }
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          borderRadius: '16px'
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          pb: 2
        }}
      >
        <div className="flex items-center justify-between">
          <Typography
            variant="h6"
            sx={{
              color: theme === 'dark' ? '#ffffff' : '#111827',
              fontWeight: 600
            }}
          >
            {type === 'cancel' ? 'Yêu cầu hủy buổi học' : 'Yêu cầu đổi lịch buổi học'}
          </Typography>
          {classInfo && (
            <Chip
              label={`Lớp: ${classInfo.code}`}
              size="small"
              sx={{
                backgroundColor: theme === 'dark' ? '#3b82f6' : '#dbeafe',
                color: theme === 'dark' ? '#ffffff' : '#1e40af'
              }}
            />
          )}
        </div>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <div className="space-y-4">
          {/* Session Info */}
          <div
            className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                mb: 1
              }}
            >
              Buổi học hiện tại
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme === 'dark' ? '#ffffff' : '#111827',
                fontWeight: 600,
                mb: 0.5
              }}
            >
              {session.subject}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme === 'dark' ? '#d1d5db' : '#374151'
              }}
            >
              {formatDateTime(session.startTime)}
            </Typography>
          </div>

          {/* Class Session Warning */}
          {classInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Đây là buổi học thuộc lớp {classInfo.code}. Việc {type === 'cancel' ? 'hủy' : 'đổi lịch'} có thể ảnh hưởng đến lịch trình lớp học.
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Reason Field */}
          <TextField
            fullWidth
            label="Lý do"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Vui lòng giải thích lý do ${type === 'cancel' ? 'hủy' : 'đổi lịch'} buổi học...`}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#111827'
              },
              '& .MuiInputLabel-root': {
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }
            }}
            helperText={`Tối thiểu 10 ký tự (${reason.length}/10)`}
          />

          {/* Preferred Date/Time for Reschedule */}
          {type === 'reschedule' && (
            <div className="space-y-4">
              {/* Alternative Sessions for Class Reschedule */}
              {classInfo ? (
                <>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      mb: 2,
                      fontWeight: 600
                    }}
                  >
                    Chọn buổi học thay thế (cùng môn học, cùng gia sư, khác ngày)
                  </Typography>
                  
                  {loadingAlternatives ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : alternativeSessions.length > 0 ? (
                    <Grid container spacing={2}>
                      {alternativeSessions.map((altSession: any) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={altSession.id}>
                          <Card
                            sx={{
                              border: selectedAlternative === altSession.id
                                ? `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`
                                : `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                              backgroundColor: selectedAlternative === altSession.id
                                ? theme === 'dark' ? '#1e3a5f' : '#dbeafe'
                                : theme === 'dark' ? '#1f2937' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb'
                              }
                            }}
                            onClick={() => {
                              setSelectedAlternative(altSession.id)
                              setError('')
                            }}
                          >
                            <CardContent>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: theme === 'dark' ? '#ffffff' : '#111827',
                                    fontWeight: 600
                                  }}
                                >
                                  {altSession.subject}
                                </Typography>
                                {altSession.classInfo && (
                                  <Chip
                                    label={altSession.classInfo.code}
                                    size="small"
                                    sx={{
                                      backgroundColor: theme === 'dark' ? '#3b82f6' : '#dbeafe',
                                      color: theme === 'dark' ? '#ffffff' : '#1e40af',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                              </Box>
                              
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme === 'dark' ? '#d1d5db' : '#374151',
                                  mb: 1
                                }}
                              >
                                {new Date(altSession.startTime).toLocaleString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                              
                              <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <AccessTime sx={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}
                                  >
                                    {altSession.duration} phút
                                  </Typography>
                                </Box>
                                
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <EventAvailable sx={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}
                                  >
                                    {altSession.availableSlots} chỗ trống
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {altSession.isOnline && (
                                <Chip
                                  label="Online"
                                  size="small"
                                  sx={{
                                    mt: 1,
                                    backgroundColor: theme === 'dark' ? '#10b981' : '#d1fae5',
                                    color: theme === 'dark' ? '#ffffff' : '#065f46',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Không tìm thấy buổi học thay thế phù hợp. Vui lòng liên hệ gia sư để được hỗ trợ.
                    </Alert>
                  )}
                </Box>
                </>
              ) : (
                <>
                {/* Available Slots Selection for Individual Sessions */}
              {loadingSlots ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={40} />
                </Box>
              ) : availableSlots.length > 0 ? (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      mb: 2,
                      fontWeight: 600
                    }}
                  >
                    Chọn thời gian trống của gia sư (hoặc nhập thủ công bên dưới)
                  </Typography>
                  
                  {/* Step 1: Select Date */}
                  {!selectedDateForSlot ? (
                    <Box>
                      <Box display="flex" alignItems="center" mb={3}>
                        <CalendarToday 
                          sx={{ 
                            mr: 1.5, 
                            color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                            fontSize: '1.5rem'
                          }} 
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            color: theme === 'dark' ? '#ffffff' : '#111827',
                            fontWeight: 600
                          }}
                        >
                          Bước 1: Chọn ngày
                        </Typography>
                      </Box>
                      
                      {/* Weekly Calendar View */}
                      <Box>
                          {/* Calendar Header */}
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <MuiButton
                              size="small"
                              onClick={handlePreviousWeek}
                              sx={{
                                minWidth: 'auto',
                                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                              }}
                            >
                              <ChevronLeft />
                            </MuiButton>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                  fontWeight: 600,
                                  minWidth: '200px',
                                  textAlign: 'center'
                                }}
                              >
                                {getWeekDates(calendarWeekStart)[0] && new Date(getWeekDates(calendarWeekStart)[0]).toLocaleDateString('vi-VN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })} - {getWeekDates(calendarWeekStart)[6] && new Date(getWeekDates(calendarWeekStart)[6]).toLocaleDateString('vi-VN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </Typography>
                              <MuiButton
                                size="small"
                                variant="outlined"
                                onClick={handleTodayWeek}
                                sx={{
                                  minWidth: 'auto',
                                  px: 1.5,
                                  borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                  color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                                }}
                              >
                                Hôm nay
                              </MuiButton>
                            </Box>
                            <MuiButton
                              size="small"
                              onClick={handleNextWeek}
                              sx={{
                                minWidth: 'auto',
                                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                              }}
                            >
                              <ChevronRight />
                            </MuiButton>
                          </Box>

                          {/* Calendar Grid - Enhanced UI */}
                          <Grid container spacing={2}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                              const weekDates = getWeekDates(calendarWeekStart)
                              const dateStr = weekDates[index]
                              const dateObj = new Date(dateStr)
                              const dateSlots = availableSlots.filter(s => s.date === dateStr)
                              const count = dateSlots.length
                              
                              // Check if today
                              const today = new Date()
                              const isToday = dateObj.toDateString() === today.toDateString()
                              
                              // Check if date has slots
                              const hasSlots = count > 0
                              
                              // Get time range for slots
                              const getTimeRange = () => {
                                if (dateSlots.length === 0) return null
                                const times = dateSlots.map(s => {
                                  const slotDate = new Date(s.startTime)
                                  return slotDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
                                }).sort()
                                return { earliest: times[0], latest: times[times.length - 1] }
                              }
                              const timeRange = getTimeRange()
                              
                              // Color based on availability
                              const getColor = () => {
                                if (!hasSlots) return theme === 'dark' ? '#374151' : '#e5e7eb'
                                if (count >= 10) return theme === 'dark' ? '#10b981' : '#34d399'
                                if (count >= 5) return theme === 'dark' ? '#3b82f6' : '#60a5fa'
                                return theme === 'dark' ? '#f59e0b' : '#fbbf24'
                              }
                              
                              const color = getColor()

                              return (
                                <Grid size={{ xs: 12, sm: 6, md: 12/7 }} key={dateStr}>
                                  <Card
                                    sx={{
                                      border: isToday 
                                        ? `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`
                                        : hasSlots
                                        ? `2px solid ${color}`
                                        : `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                      backgroundColor: hasSlots 
                                        ? (theme === 'dark' ? '#1f2937' : '#ffffff')
                                        : (theme === 'dark' ? '#111827' : '#f9fafb'),
                                      cursor: hasSlots ? 'pointer' : 'not-allowed',
                                      opacity: hasSlots ? 1 : 0.6,
                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      minHeight: '160px',
                                      height: '100%',
                                      position: 'relative',
                                      overflow: 'hidden',
                                      background: hasSlots 
                                        ? (theme === 'dark' 
                                          ? `linear-gradient(135deg, #1f2937 0%, #111827 100%)`
                                          : `linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)`)
                                        : 'none',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '6px',
                                        backgroundColor: color,
                                        transition: 'height 0.3s'
                                      },
                                      '&:hover': hasSlots ? {
                                        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                        borderColor: color,
                                        transform: 'translateY(-4px) scale(1.02)',
                                        boxShadow: theme === 'dark'
                                          ? `0 8px 24px rgba(59, 130, 246, 0.4)`
                                          : `0 8px 24px rgba(37, 99, 235, 0.2)`,
                                        '&::before': {
                                          height: '8px'
                                        }
                                      } : {}
                                    }}
                                    onClick={() => hasSlots && handleSelectDate(dateStr)}
                                  >
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="space-between" height="100%">
                                        {/* Day Header */}
                                        <Box display="flex" flexDirection="column" alignItems="center" width="100%" mb={2}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                              fontSize: '0.875rem',
                                              fontWeight: 600,
                                              mb: 1,
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.5px'
                                            }}
                                          >
                                            {day}
                                          </Typography>
                                          <Box
                                            sx={{
                                              width: 56,
                                              height: 56,
                                              borderRadius: '16px',
                                              backgroundColor: hasSlots ? color : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              mb: 1,
                                              boxShadow: hasSlots ? `0 4px 12px ${color}40` : 'none'
                                            }}
                                          >
                                            <Typography
                                              variant="h4"
                                              sx={{
                                                color: '#ffffff',
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                lineHeight: 1
                                              }}
                                            >
                                              {dateObj.getDate()}
                                            </Typography>
                                          </Box>
                                          {isToday && (
                                            <Chip
                                              label="Hôm nay"
                                              size="small"
                                              sx={{
                                                mt: 0.5,
                                                height: '22px',
                                                fontSize: '0.7rem',
                                                backgroundColor: theme === 'dark' ? '#3b82f6' : '#dbeafe',
                                                color: theme === 'dark' ? '#ffffff' : '#1e40af',
                                                fontWeight: 600
                                              }}
                                            />
                                          )}
                                        </Box>
                                        
                                        {/* Availability Info */}
                                        {hasSlots ? (
                                          <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} width="100%">
                                            <Box display="flex" alignItems="center" gap={1}>
                                              <EventAvailable 
                                                sx={{ 
                                                  color: color,
                                                  fontSize: '1.5rem'
                                                }} 
                                              />
                                              <Typography
                                                variant="h6"
                                                sx={{
                                                  color: theme === 'dark' ? '#ffffff' : '#111827',
                                                  fontSize: '1.25rem',
                                                  fontWeight: 700
                                                }}
                                              >
                                                {count}
                                              </Typography>
                                            </Box>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                textAlign: 'center'
                                              }}
                                            >
                                              khung giờ có sẵn
                                            </Typography>
                                            {timeRange && (
                                              <Box 
                                                sx={{
                                                  mt: 1,
                                                  p: 1,
                                                  borderRadius: '8px',
                                                  backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6',
                                                  width: '100%'
                                                }}
                                              >
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                                                    fontSize: '0.7rem',
                                                    display: 'block',
                                                    textAlign: 'center'
                                                  }}
                                                >
                                                  {timeRange.earliest === timeRange.latest 
                                                    ? `Lúc ${timeRange.earliest}`
                                                    : `${timeRange.earliest} - ${timeRange.latest}`
                                                  }
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        ) : (
                                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                              }}
                                            >
                                              Không có
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: theme === 'dark' ? '#4b5563' : '#d1d5db',
                                                fontSize: '0.75rem',
                                                textAlign: 'center'
                                              }}
                                            >
                                              khung giờ trống
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              )
                            })}
                          </Grid>
                        </Box>
                    </Box>
                  ) : (
                    /* Step 2: Select Time */
                    <Box>
                      <Box display="flex" alignItems="center" mb={2}>
                        <MuiButton
                          size="small"
                          onClick={() => {
                            setSelectedDateForSlot('')
                            setSelectedSlot(null)
                          }}
                          sx={{
                            minWidth: 'auto',
                            mr: 2,
                            color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                          }}
                        >
                          ← Quay lại
                        </MuiButton>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                          }}
                        >
                          Bước 2: Chọn giờ cho {new Date(selectedDateForSlot).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </Typography>
                      </Box>
                      <Grid container spacing={2} sx={{ maxHeight: '300px', overflowY: 'auto', pb: 2 }}>
                        {availableSlots
                          .filter(slot => slot.date === selectedDateForSlot)
                          .map((slot, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                              <Card
                                sx={{
                                  border: selectedSlot?.startTime === slot.startTime
                                    ? `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`
                                    : `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                                  backgroundColor: selectedSlot?.startTime === slot.startTime
                                    ? theme === 'dark' ? '#1e3a5f' : '#dbeafe'
                                    : theme === 'dark' ? '#1f2937' : '#ffffff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                                    borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb'
                                  }
                                }}
                              >
                                <CardActionArea onClick={() => handleSelectTimeSlot(slot)}>
                                  <Box p={2}>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: theme === 'dark' ? '#ffffff' : '#111827',
                                        fontWeight: 600
                                      }}
                                    >
                                      {slot.displayTime}
                                    </Typography>
                                  </Box>
                                </CardActionArea>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  Không có thời gian trống trong 14 ngày tới. Vui lòng nhập thời gian mong muốn thủ công bên dưới.
                </Alert>
                )}
                </>
              )}

              {/* Manual Date/Time Input */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Hoặc nhập thời gian mong muốn thủ công
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Ngày mong muốn"
                        value={preferredDateValue}
                        onChange={(newValue) => {
                          setPreferredDateValue(newValue)
                          if (newValue) {
                            setPreferredDate(newValue.toISOString().split('T')[0])
                          } else {
                            setPreferredDate('')
                          }
                          setSelectedSlot(null)
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
                        label="Giờ mong muốn"
                        value={preferredTimeValue}
                        onChange={(newValue) => {
                          setPreferredTimeValue(newValue)
                          if (newValue) {
                            const hours = newValue.getHours().toString().padStart(2, '0')
                            const minutes = newValue.getMinutes().toString().padStart(2, '0')
                            setPreferredTime(`${hours}:${minutes}`)
                          } else {
                            setPreferredTime('')
                          }
                          setSelectedSlot(null)
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
              </Box>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <MuiButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: theme === 'dark' ? '#9ca3af' : '#6b7280'
          }}
        >
          Hủy
        </MuiButton>
        <MuiButton
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || 
            !reason.trim() || 
            reason.length < 10 ||
            (type === 'reschedule' && classInfo && !selectedAlternative)
          }
          sx={{
            backgroundColor: type === 'cancel' ? '#ef4444' : '#3b82f6',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: type === 'cancel' ? '#dc2626' : '#2563eb'
            },
            '&:disabled': {
              backgroundColor: theme === 'dark' ? '#374151' : '#9ca3af',
              color: theme === 'dark' ? '#6b7280' : '#ffffff'
            }
          }}
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </MuiButton>
      </DialogActions>

      {/* Success Snackbar - Enhanced with better visibility */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={() => {
          setShowSuccessSnackbar(false)
          // Close dialog and call onSuccess after snackbar closes
          setTimeout(() => {
            handleClose()
            if (onSuccess) onSuccess()
          }, 300)
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          zIndex: 9999,
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'transparent',
            padding: 0,
            boxShadow: 'none'
          }
        }}
      >
        <Alert 
          onClose={() => {
            setShowSuccessSnackbar(false)
            setTimeout(() => {
              handleClose()
              if (onSuccess) onSuccess()
            }, 300)
          }} 
          severity="success" 
          icon={false}
          sx={{ 
            width: '100%',
            minWidth: '400px',
            maxWidth: '600px',
            backgroundColor: theme === 'dark' ? '#10b981' : '#059669',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: '12px',
            boxShadow: theme === 'dark' 
              ? '0 8px 24px rgba(16, 185, 129, 0.5)'
              : '0 8px 24px rgba(5, 150, 105, 0.4)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '& .MuiAlert-message': {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              color: '#ffffff',
              fontWeight: 500
            },
            '& .MuiAlert-action': {
              color: '#ffffff',
              '& .MuiIconButton-root': {
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                color: '#ffffff'
              }}
            >
              ✓
            </Typography>
          </Box>
          <Typography
            sx={{
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              flex: 1
            }}
          >
            {successMessage}
          </Typography>
        </Alert>
      </Snackbar>
    </Dialog>
  )
}

export default RequestDialog

