import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useTheme } from '../../contexts/ThemeContext'
import { Session } from '../../types/calendar'
import SessionCard from './SessionCard'

type DayViewProps = {
  date: string
  timeSlots: { start: string; end: string; display: string }[]
  sessions: Session[]
  onSessionClick: (session: Session) => void
  showTutor?: boolean
  showStudent?: boolean
}

const DayView: React.FC<DayViewProps> = ({
  date,
  timeSlots,
  sessions,
  onSessionClick,
  showTutor = true,
  showStudent = false
}) => {
  const { theme } = useTheme()

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }

  // helper kept previously for cell-based rendering; not used in absolute layout

  const slotHeight = 120
  const pxPerMinute = slotHeight / 60
  const dayStartMin = 7 * 60
  const dayEndMin = 18 * 60
  const totalHeight = timeSlots.length * slotHeight

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, backgroundColor: theme === 'dark' ? '#1f2937' : '#fff' }}>
        <Typography sx={{ fontWeight: 600, color: theme === 'dark' ? '#fff' : '#111827' }}>{date}</Typography>
        <Button size="small" variant="contained">Add event</Button>
      </Box>

      {/* Time labels */}
      <Box>
        {timeSlots.map((slot, idx) => (
          <Box key={idx} sx={{ height: slotHeight, borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>{slot.start}</Typography>
          </Box>
        ))}
      </Box>

      {/* Day column */}
      <Box sx={{ position: 'relative', backgroundColor: theme === 'dark' ? '#111827' : '#fff', borderLeft: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
        {/* Grid rows */}
        {timeSlots.map((_, idx) => (
          <Box key={idx} sx={{ height: slotHeight, borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }} />
        ))}

        {/* Absolute event blocks spanning rows */}
        <Box sx={{ position: 'absolute', inset: 0 }}>
          {sessions.filter(s => s.date === date).map((s) => {
            const sStartAbs = toMinutes(s.startTime)
            // For reminders, use startTime for both start and end, with minimum height
            const sEndAbs = s.eventType === 'reminder' 
              ? sStartAbs + 30 // 30 minutes minimum height for reminders
              : toMinutes(s.endTime)
            const clampedStartAbs = Math.max(dayStartMin, Math.min(dayEndMin, sStartAbs))
            const clampedEndAbs = Math.max(clampedStartAbs + 1, Math.min(dayEndMin, sEndAbs))
            const startMin = clampedStartAbs - dayStartMin
            const endMin = clampedEndAbs - dayStartMin
            const top = startMin * pxPerMinute
            const height = Math.max(32, Math.min(totalHeight - top, (endMin - startMin) * pxPerMinute))
            return (
              <Box key={s.id} sx={{ position: 'absolute', left: 4, right: 4, top, height }}>
                <SessionCard session={s} onClick={onSessionClick} isCompact={false} showTutor={showTutor} showStudent={showStudent} fullHeight />
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

export default DayView


