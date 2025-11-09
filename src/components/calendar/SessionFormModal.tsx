import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Session, SessionStatus } from '../../types/calendar'
import { useTheme } from '../../contexts/ThemeContext'

interface SessionFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (session: Partial<Session>) => void
  session?: Session | null
  tutors?: Array<{ id: string; name: string; avatar?: string }>
  students?: Array<{ id: string; name: string; avatar?: string }>
  subjects?: Array<{ id: string; name: string; color: string }>
  showTutor?: boolean
  showStudent?: boolean
}

const SessionFormModal: React.FC<SessionFormModalProps> = ({
  open,
  onClose,
  onSave,
  session = null,
  tutors = [],
  students = [],
  subjects = [],
  showTutor = true,
  showStudent = false
}) => {
  const { theme } = useTheme()

  // Helper function for form field styling
  const getFormFieldStyles = () => ({
    inputLabel: {
      color: theme === 'dark' ? '#d1d5db' : '#374151',
      '&.Mui-focused': {
        color: theme === 'dark' ? '#ffffff' : '#111827'
      }
    },
    select: {
      color: theme === 'dark' ? '#ffffff' : '#111827',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
      },
      '& .MuiSelect-icon': {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
      }
    },
    textField: {
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
      // Target MUI X Date Pickers specific classes
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
      // Target SVG icons in DatePicker/TimePicker
      '& .MuiSvgIcon-root': {
        color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
      },
      '& [class*="MuiSvgIcon-root"]': {
        color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
      }
    }
  })
  const [eventType, setEventType] = useState<'session' | 'personal' | 'reminder'>('session')
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    tutorId: '',
    studentId: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    locationType: 'online' as 'online' | 'offline',
    address: '',
    meetingLink: '',
    notes: '',
    status: 'scheduled' as SessionStatus
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (session) {
      setEventType('session') // Edit mode always shows session type
      setFormData({
        subject: session.subject,
        title: session.subject,
        tutorId: session.tutor?.id || '',
        studentId: session.student?.id || '',
        date: new Date(session.date),
        startTime: new Date(`2000-01-01T${session.startTime}`),
        endTime: new Date(`2000-01-01T${session.endTime}`),
        locationType: session.location.type,
        address: session.location.address || '',
        meetingLink: session.location.meetingLink || '',
        notes: session.notes || '',
        status: session.status
      })
    } else {
      // Reset form for new event
      setEventType('session')
      setFormData({
        subject: '',
        title: '',
        tutorId: '',
        studentId: '',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        locationType: 'online',
        address: '',
        meetingLink: '',
        notes: '',
        status: 'scheduled'
      })
    }
    setErrors({})
  }, [session, open])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (eventType === 'session') {
      if (!formData.subject) {
        newErrors.subject = 'Subject is required'
      }

      if (showTutor && !formData.tutorId) {
        newErrors.tutorId = 'Tutor is required'
      }

      if (showStudent && !formData.studentId) {
        newErrors.studentId = 'Student is required'
      }

      if (formData.locationType === 'offline' && !formData.address) {
        newErrors.address = 'Address is required for offline sessions'
      }

      if (formData.locationType === 'online' && !formData.meetingLink) {
        newErrors.meetingLink = 'Meeting link is required for online sessions'
      }
    } else if (eventType === 'personal') {
      if (!formData.title) {
        newErrors.title = 'Event title is required'
      }
    } else if (eventType === 'reminder') {
      if (!formData.title) {
        newErrors.title = 'Reminder title is required'
      }
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (eventType !== 'reminder') {
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required'
      }

      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    // Determine subject/title based on event type
    const eventTitle = eventType === 'session' 
      ? formData.subject 
      : formData.title
    
    // Determine color based on event type
    let eventColor = '#3b82f6'
    if (eventType === 'session') {
      eventColor = subjects.find(s => s.name === formData.subject)?.color || '#3b82f6'
    } else if (eventType === 'personal') {
      eventColor = '#8b5cf6' // Purple for personal events (different from class green and session blue)
    } else if (eventType === 'reminder') {
      eventColor = '#f59e0b' // Amber/Orange for reminders (different from others)
    }

    const sessionData: Partial<Session> = {
      id: session?.id || `${eventType}_${Date.now()}`,
      subject: eventTitle,
      eventType: eventType, // Store event type
      date: formData.date.toISOString().split('T')[0],
      startTime: formData.startTime.toTimeString().slice(0, 5),
      endTime: eventType === 'reminder' 
        ? formData.startTime.toTimeString().slice(0, 5) 
        : formData.endTime.toTimeString().slice(0, 5),
      location: {
        type: eventType === 'session' ? formData.locationType : 'offline',
        address: eventType === 'session' && formData.locationType === 'offline' ? formData.address : undefined,
        meetingLink: eventType === 'session' && formData.locationType === 'online' ? formData.meetingLink : undefined
      },
      notes: formData.notes,
      status: formData.status,
      color: eventColor,
      createdAt: session?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (eventType === 'session' && showTutor && formData.tutorId) {
      const tutor = tutors.find(t => t.id === formData.tutorId)
      sessionData.tutor = tutor ? {
        id: tutor.id,
        name: tutor.name,
        avatar: tutor.avatar
      } : undefined
    }

    if (eventType === 'session' && showStudent && formData.studentId) {
      const student = students.find(s => s.id === formData.studentId)
      sessionData.student = student ? {
        id: student.id,
        name: student.name,
        avatar: student.avatar
      } : undefined
    }

    onSave(sessionData)
    onClose()
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '16px',
            boxShadow: theme === 'dark' 
              ? '0 25px 50px rgba(0, 0, 0, 0.5)' 
              : '0 25px 50px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            pt: 3,
            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
          }}
        >
          <Typography
            component="span"
            sx={{
              color: theme === 'dark' ? '#ffffff' : '#111827',
              fontWeight: 600,
              fontSize: '1.25rem'
            }}
          >
            {session ? 'Edit Event' : 'Add Event'}
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              '&:hover': {
                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 3, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Event Type Selector (only show when creating new event) */}
            {!session && (
              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel sx={getFormFieldStyles().inputLabel}>Event Type</InputLabel>
                <Select
                  value={eventType}
                  onChange={(e) => {
                    const newType = e.target.value as 'session' | 'personal' | 'reminder'
                    setEventType(newType)
                    // Reset relevant fields when switching types
                    if (newType !== 'session') {
                      setFormData(prev => ({ ...prev, subject: '', tutorId: '', studentId: '', locationType: 'offline' }))
                    }
                  }}
                  label="Event Type"
                  sx={getFormFieldStyles().select}
                >
                  <MenuItem value="session">Session</MenuItem>
                  <MenuItem value="personal">Personal Event</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Basic Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {eventType === 'session' ? (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth error={!!errors.subject}>
                    <InputLabel sx={getFormFieldStyles().inputLabel}>
                      Subject
                    </InputLabel>
                    <Select
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      label="Subject"
                      sx={getFormFieldStyles().select}
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.subject && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.subject}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label={eventType === 'personal' ? 'Event Title' : 'Reminder Title'}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder={eventType === 'personal' ? 'e.g., Meeting with John' : 'e.g., Submit assignment'}
                  sx={getFormFieldStyles().textField}
                />
              )}

              {eventType === 'session' && showTutor && (
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth error={!!errors.tutorId}>
                    <InputLabel sx={getFormFieldStyles().inputLabel}>Tutor</InputLabel>
                    <Select
                      value={formData.tutorId}
                      onChange={(e) => handleInputChange('tutorId', e.target.value)}
                      label="Tutor"
                      sx={getFormFieldStyles().select}
                    >
                      {tutors.map((tutor) => (
                        <MenuItem key={tutor.id} value={tutor.id}>
                          {tutor.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.tutorId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.tutorId}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              )}

              {eventType === 'session' && showStudent && (
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth error={!!errors.studentId}>
                    <InputLabel sx={getFormFieldStyles().inputLabel}>Student</InputLabel>
                    <Select
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      label="Student"
                      sx={getFormFieldStyles().select}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.studentId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.studentId}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              )}
            </Box>

            {/* Date and Time */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => handleInputChange('date', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date,
                      sx: {
                        ...getFormFieldStyles().textField,
                        '& .MuiInputBase-input': {
                          color: theme === 'dark' ? '#ffffff' : '#111827',
                        },
                        '& input': {
                          color: theme === 'dark' ? '#ffffff' : '#111827',
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
                        // Target SVG icons in DatePicker/TimePicker
                        '& .MuiSvgIcon-root': {
                          color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                        },
                        '& [class*="MuiSvgIcon-root"]': {
                          color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                        }
                      }
                    }
                  }}
                />
              </Box>
                <Box sx={{ flex: 1 }}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(newValue) => handleInputChange('startTime', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startTime,
                      helperText: errors.startTime,
                      sx: {
                        ...getFormFieldStyles().textField,
                        '& .MuiInputBase-input': {
                          color: theme === 'dark' ? '#ffffff' : '#111827',
                        },
                        '& input': {
                          color: theme === 'dark' ? '#ffffff' : '#111827',
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
                        // Target SVG icons in DatePicker/TimePicker
                        '& .MuiSvgIcon-root': {
                          color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                        },
                        '& [class*="MuiSvgIcon-root"]': {
                          color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                        }
                      }
                    }
                  }}
                />
              </Box>
                {eventType !== 'reminder' && (
                  <Box sx={{ flex: 1 }}>
                    <TimePicker
                      label="End Time"
                      value={formData.endTime}
                      onChange={(newValue) => handleInputChange('endTime', newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endTime,
                          helperText: errors.endTime,
                          sx: {
                            ...getFormFieldStyles().textField,
                            '& .MuiInputBase-input': {
                              color: theme === 'dark' ? '#ffffff' : '#111827',
                            },
                            '& input': {
                              color: theme === 'dark' ? '#ffffff' : '#111827',
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
                            // Target SVG icons in DatePicker/TimePicker
                            '& .MuiSvgIcon-root': {
                              color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                            },
                            '& [class*="MuiSvgIcon-root"]': {
                              color: theme === 'dark' ? '#ffffff !important' : '#111827 !important',
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                )}
            </Box>

            {/* Location (only for sessions) */}
            {eventType === 'session' && (
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.locationType === 'online'}
                      onChange={(e) => handleInputChange('locationType', e.target.checked ? 'online' : 'offline')}
                      sx={{
                        '& .MuiSwitch-thumb': {
                          backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                        },
                        '& .MuiSwitch-track': {
                          backgroundColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                        },
                        '&.Mui-checked .MuiSwitch-track': {
                          backgroundColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                        }
                      }}
                    />
                  }
                  label={formData.locationType === 'online' ? 'Online Session' : 'In-Person Session'}
                  sx={{ 
                    mb: 2,
                    '& .MuiFormControlLabel-label': {
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 500
                    }
                  }}
                />

                {formData.locationType === 'online' ? (
                  <TextField
                    fullWidth
                    label="Meeting Link"
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    error={!!errors.meetingLink}
                    helperText={errors.meetingLink}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    sx={getFormFieldStyles().textField}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    placeholder="Room 201, Building A"
                    sx={getFormFieldStyles().textField}
                  />
                )}
              </Box>
            )}

            {/* Location for personal events */}
            {eventType === 'personal' && (
              <TextField
                fullWidth
                label="Location (Optional)"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g., Coffee Shop, Room 201"
                sx={{ ...getFormFieldStyles().textField, mt: 2 }}
              />
            )}

            {/* Notes */}
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the session..."
              sx={{ ...getFormFieldStyles().textField, mt: 2 }}
            />

            {/* Status (only for editing) */}
            {session && (
              <FormControl fullWidth>
                <InputLabel sx={getFormFieldStyles().inputLabel}>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                  sx={getFormFieldStyles().select}
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="rescheduled">Rescheduled</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleClose}
            sx={{
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
              color: theme === 'dark' ? '#ffffff' : '#111827',
              '&:hover': {
                borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            {session ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default SessionFormModal
