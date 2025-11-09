import React from 'react'
import { Box, Typography } from '@mui/material'
import { Session } from '../../types/calendar'
import SessionCard from './SessionCard'
import { useTheme } from '../../contexts/ThemeContext'

interface CalendarCellProps {
  time: string
  sessions: Session[]
  onSessionClick: (session: Session) => void
  isToday?: boolean
  isCurrentHour?: boolean
  showTutor?: boolean
  showStudent?: boolean
}

const CalendarCell: React.FC<CalendarCellProps> = ({
  time,
  sessions,
  onSessionClick,
  // isToday = false,
  isCurrentHour = false,
  showTutor = true,
  showStudent = false
}) => {
  const { theme } = useTheme()

  // Time label removed; keep helper only if needed in future

  return (
    <Box
      className="calendar-cell"
      sx={{
        minHeight: '120px',
        border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderTop: 'none',
        borderLeft: 'none',
        backgroundColor: isCurrentHour 
          ? (theme === 'dark' ? '#1e3a8a20' : '#dbeafe') 
          : (theme === 'dark' ? '#111827' : '#ffffff'),
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        },
        '&:last-child': {
          borderRight: 'none'
        }
      }}
    >
      {/* Time label removed per requirement */}

      {/* Current time indicator */}
      {isCurrentHour && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#3b82f6',
            zIndex: 2
          }}
        />
      )}

      {/* Sessions */}
      <Box
        sx={{
          pt: 1,
          px: 0.5,
          pb: 0.5,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {sessions.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {sessions.slice(0, 2).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={onSessionClick}
                isCompact={true}
                showTutor={showTutor}
                showStudent={showStudent}
              />
            ))}
            {sessions.length > 2 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 0.5,
                  px: 1,
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                  }
                }}
                onClick={() => {
                  // Handle "show more" click
                  console.log('Show more sessions for', time)
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  +{sessions.length - 2} more
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.3
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                fontSize: '0.75rem'
              }}
            >
              Available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default CalendarCell
