import React, { useRef } from 'react'
import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { AccessTime, LocationOn, Person, School as SchoolIcon, Schedule as ScheduleIcon, Event as EventIcon, Notifications as ReminderIcon } from '@mui/icons-material'
import { Session, EventType } from '../../types/calendar'
import { useTheme } from '../../contexts/ThemeContext'
import { animateSessionCardHover, animateSessionCardClick } from '../../utils/calendarAnimations'

interface SessionCardProps {
  session: Session
  onClick: (session: Session) => void
  isCompact?: boolean
  showTutor?: boolean
  showStudent?: boolean
  fullHeight?: boolean
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onClick,
  isCompact = false,
  showTutor = true,
  showStudent = false,
  fullHeight = false
}) => {
  const { theme } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)

  // Map màu theo palette Figma
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#0C41FF' // Primary blue
      case 'completed':
        return '#55D28F' // Green
      case 'cancelled':
        return '#BE1A1A' // Dark Red
      case 'rescheduled':
        return '#E7C160' // Amber Pastel Darker
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

  const handleClick = () => {
    if (cardRef.current) {
      animateSessionCardClick(cardRef.current)
    }
    onClick(session)
  }

  const handleMouseEnter = () => {
    if (cardRef.current) {
      animateSessionCardHover(cardRef.current, true)
    }
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      animateSessionCardHover(cardRef.current, false)
    }
  }

  // Determine event type and display properties
  const isClass = !!session.classId
  const eventType: EventType = session.eventType || (isClass ? 'session' : 'session')
  
  // Get icon and badge label based on event type
  const getEventIcon = () => {
    if (isClass) return SchoolIcon
    switch (eventType) {
      case 'personal':
        return EventIcon
      case 'reminder':
        return ReminderIcon
      default:
        return ScheduleIcon
    }
  }
  
  const getBadgeLabel = () => {
    if (isClass) return 'Class'
    switch (eventType) {
      case 'personal':
        return 'Personal'
      case 'reminder':
        return 'Reminder'
      default:
        return 'Session'
    }
  }
  
  const getBadgeColor = () => {
    if (isClass) {
      return {
        backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
        color: session.color
      }
    }
    switch (eventType) {
      case 'personal':
        return {
          backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
          color: session.color
        }
      case 'reminder':
        return {
          backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
          color: session.color
        }
      default:
        return {
          backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          color: session.color
        }
    }
  }
  
  const EventIconComponent = getEventIcon()

  return (
    <Card
      ref={cardRef}
      className="session-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme === 'dark' 
            ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
            : '0 8px 25px rgba(0, 0, 0, 0.15)',
        },
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `2px solid ${session.color}`,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        height: fullHeight ? '100%' : (isCompact ? 'auto' : 'auto'),
        minHeight: fullHeight ? 'auto' : (isCompact ? '140px' : '140px'),
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '100%',
          backgroundColor: session.color,
        }
      }}
    >
      <CardContent sx={{ 
        p: isCompact ? 1.5 : 2, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Header with type badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
          <EventIconComponent sx={{ fontSize: 16, color: session.color, flexShrink: 0 }} />
          <Chip
            label={getBadgeLabel()}
            size="small"
            sx={{
              ...getBadgeColor(),
              fontSize: '0.7rem',
              height: '18px',
              fontWeight: 600,
              border: `1px solid ${session.color}40`,
              '& .MuiChip-label': {
                px: 0.75
              }
            }}
          />
        </Box>

        {/* Subject name on separate line */}
        <Typography
          variant={isCompact ? 'body2' : 'subtitle1'}
          sx={{
            fontWeight: 600,
            color: theme === 'dark' ? '#ffffff' : '#111827',
            fontSize: isCompact ? '0.875rem' : '1rem',
            lineHeight: 1.4,
            mb: 0.75,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {session.subject}
        </Typography>

        {/* Time and Location combined */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime sx={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280', mr: 0.5 }} />
            <Typography
              variant="caption"
              sx={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn sx={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280', mr: 0.5 }} />
            <Typography
              variant="caption"
              sx={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {session.location.type === 'online' ? 'Online' : 'In-Person'}
            </Typography>
          </Box>
        </Box>

        {/* Notes preview (if not compact) */}
        {!isCompact && session.notes && (
          <Typography
            variant="caption"
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              fontSize: '0.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 1
            }}
          >
            {session.notes}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionCard
