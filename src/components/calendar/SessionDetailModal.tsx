import React, { useRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Card,
  CardContent
} from '@mui/material'
import { animateModalOpen, animateModalClose } from '../../utils/calendarAnimations'
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  VideoCall as VideoCallIcon,
  Phone as PhoneIcon
} from '@mui/icons-material'
import { Session } from '../../types/calendar'
import { useTheme } from '../../contexts/ThemeContext'
import RequestDialog from '../session/RequestDialog'

interface SessionDetailModalProps {
  open: boolean
  onClose: () => void
  session: Session | null
  onEdit?: (session: Session) => void
  onCancel?: (session: Session) => void
  onReschedule?: (session: Session) => void
  onJoin?: (session: Session) => void
  showTutor?: boolean
  showStudent?: boolean
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  open,
  onClose,
  session,
  onEdit,
  onCancel,
  onReschedule,
  onJoin,
  showTutor = true,
  showStudent = false
}) => {
  const { theme } = useTheme()
  const modalRef = useRef<HTMLDivElement>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestType, setRequestType] = useState<'cancel' | 'reschedule'>('cancel')
  const [sessionData, setSessionData] = useState<any>(null)
  const [classInfo, setClassInfo] = useState<any>(null)

  useEffect(() => {
    if (open && modalRef.current) {
      animateModalOpen(modalRef.current)
    }
  }, [open])

  const handleClose = () => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose)
    } else {
      onClose()
    }
  }

  if (!session) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme === 'dark' ? '#3b82f6' : '#2563eb'
      case 'completed':
        return theme === 'dark' ? '#10b981' : '#059669'
      case 'cancelled':
        return theme === 'dark' ? '#ef4444' : '#dc2626'
      case 'rescheduled':
        return theme === 'dark' ? '#f59e0b' : '#d97706'
      default:
        return theme === 'dark' ? '#6b7280' : '#9ca3af'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'rescheduled':
        return 'Rescheduled'
      default:
        return status
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (date: string) => {
    const sessionDate = new Date(date)
    return sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(session)
    }
    onClose()
  }

  const handleCancel = () => {
    // If onCancel provided (tutor), use it directly
    // If not (student), open request dialog
    if (onCancel) {
      onCancel(session)
      onClose()
    } else {
      // Student: open request dialog
      setRequestType('cancel')
      // Convert Session type to request dialog format
      const sessionObj: any = {
        id: session.id,
        subject: session.subject,
        startTime: session.date + 'T' + session.startTime,
        endTime: session.date + 'T' + session.endTime,
        classId: (session as any).classId
      }
      setSessionData(sessionObj)
      setClassInfo((session as any).classInfo)
      setIsRequestDialogOpen(true)
    }
  }

  const handleReschedule = () => {
    // If onReschedule provided (tutor), use it directly
    // If not (student), open request dialog
    if (onReschedule) {
      onReschedule(session)
      onClose()
    } else {
      // Student: open request dialog
      setRequestType('reschedule')
      // Convert Session type to request dialog format
      const sessionObj: any = {
        id: session.id,
        subject: session.subject,
        startTime: session.date + 'T' + session.startTime,
        endTime: session.date + 'T' + session.endTime,
        classId: (session as any).classId
      }
      setSessionData(sessionObj)
      setClassInfo((session as any).classInfo)
      setIsRequestDialogOpen(true)
    }
  }

  const handleRequestSuccess = () => {
    setIsRequestDialogOpen(false)
    onClose()
    // Dialog will show success message, parent component can refresh if needed
    // No need to reload entire page
  }

  const handleJoin = () => {
    if (onJoin) {
      onJoin(session)
    }
  }

  return (
    <Dialog
      ref={modalRef}
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
          pb: 1,
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: session.color
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: theme === 'dark' ? '#ffffff' : '#111827',
              fontWeight: 600
            }}
          >
            {session.subject}
          </Typography>
          <Chip
            label={getStatusText(session.status)}
            size="small"
            sx={{
              backgroundColor: getStatusColor(session.status),
              color: '#ffffff',
              fontWeight: 500
            }}
          />
        </Box>
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

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Session Info */}
          <Card
            sx={{
              backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px'
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <AccessTimeIcon sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 600
                    }}
                  >
                    {formatDate(session.date)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                    }}
                  >
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LocationOnIcon sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: 600
                    }}
                  >
                    {session.location.type === 'online' ? 'Online Session' : 'In-Person Session'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                    }}
                  >
                    {session.location.type === 'online' 
                      ? session.location.meetingLink 
                      : session.location.address
                    }
                  </Typography>
                </Box>
              </Box>

              {/* Tutor/Student Info */}
              {(showTutor && session.tutor) || (showStudent && session.student) ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <Avatar
                    src={showTutor && session.tutor ? session.tutor.avatar : session.student?.avatar}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: theme === 'dark' ? '#ffffff' : '#111827',
                        fontWeight: 600
                      }}
                    >
                      {showTutor && session.tutor ? session.tutor.name : session.student?.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                      }}
                    >
                      {showTutor ? 'Tutor' : 'Student'}
                    </Typography>
                  </Box>
                </Box>
              ) : null}
            </CardContent>
          </Card>

          {/* Notes */}
          {session.notes && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  mb: 1
                }}
              >
                Notes
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme === 'dark' ? '#d1d5db' : '#374151',
                  lineHeight: 1.6
                }}
              >
                {session.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {session.status === 'scheduled' && session.location.type === 'online' && onJoin && (
            <Button
              variant="contained"
              startIcon={<VideoCallIcon />}
              onClick={handleJoin}
              sx={{
                backgroundColor: '#10b981',
                '&:hover': {
                  backgroundColor: '#059669'
                }
              }}
            >
              Join Session
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                color: theme === 'dark' ? '#ffffff' : '#111827',
                '&:hover': {
                  borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb'
                }
              }}
            >
              Edit
            </Button>
          )}

          {session.status === 'scheduled' && onReschedule && (
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={handleReschedule}
              sx={{
                borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                color: theme === 'dark' ? '#ffffff' : '#111827',
                '&:hover': {
                  borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb'
                }
              }}
            >
              Reschedule
            </Button>
          )}

          {session.status === 'scheduled' && onCancel && (
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': {
                  borderColor: '#dc2626',
                  backgroundColor: '#fef2f2'
                }
              }}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="text"
            onClick={handleClose}
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              '&:hover': {
                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
              }
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>

      {/* Request Dialog for Students */}
      {sessionData && (
        <RequestDialog
          open={isRequestDialogOpen}
          onClose={() => {
            setIsRequestDialogOpen(false)
            setSessionData(null)
            setClassInfo(null)
          }}
          session={sessionData}
          type={requestType}
          classInfo={classInfo}
          onSuccess={handleRequestSuccess}
        />
      )}
    </Dialog>
  )
}

export default SessionDetailModal
