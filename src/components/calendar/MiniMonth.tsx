import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { useTheme } from '../../contexts/ThemeContext'

type MiniMonthProps = {
  date: Date
  onChange: (date: Date) => void
}

const getMonthMatrix = (anchor: Date) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const startDay = (start.getDay() + 6) % 7 // Monday first
  const first = new Date(start)
  first.setDate(start.getDate() - startDay)
  const weeks: string[][] = []
  for (let w = 0; w < 6; w++) {
    const row: string[] = []
    for (let d = 0; d < 7; d++) {
      const cur = new Date(first)
      cur.setDate(first.getDate() + w * 7 + d)
      row.push(cur.toISOString().split('T')[0])
    }
    weeks.push(row)
  }
  return weeks
}

const MiniMonth: React.FC<MiniMonthProps> = ({ date, onChange }) => {
  const { theme } = useTheme()
  const [anchor, setAnchor] = React.useState(new Date(date))
  const matrix = getMonthMatrix(anchor)

  const isSameDay = (a: Date, iso: string) => iso === a.toISOString().split('T')[0]
  const inCurrentMonth = (iso: string) => new Date(iso).getMonth() === anchor.getMonth()

  return (
    <Box sx={{ border: `1px solid ${theme==='dark'?'#374151':'#e5e7eb'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: theme==='dark'?'#1f2937':'#ffffff', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, backgroundColor: theme==='dark'?'#1f2937':'#ffffff', borderBottom: `1px solid ${theme==='dark'?'#374151':'#e5e7eb'}` }}>
        <Typography sx={{ fontWeight: 600, color: theme==='dark'?'#fff':'#111827' }}>
          {anchor.toLocaleDateString('en-US',{ month:'long', year:'numeric'})}
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()-1, 1))} sx={{ color: theme==='dark'?'#9ca3af':'#6b7280', '&:hover': { backgroundColor: theme==='dark'?'#374151':'#f3f4f6' } }}><ChevronLeft/></IconButton>
          <IconButton size="small" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()+1, 1))} sx={{ color: theme==='dark'?'#9ca3af':'#6b7280', '&:hover': { backgroundColor: theme==='dark'?'#374151':'#f3f4f6' } }}><ChevronRight/></IconButton>
        </Box>
      </Box>
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:0, p: 0.5 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <Box key={d} sx={{ textAlign:'center', py:0.5, fontSize:12, color: theme==='dark'?'#9ca3af':'#6b7280' }}>{d}</Box>
        ))}
        {matrix.flat().map((iso) => {
          const selected = isSameDay(date, iso)
          const muted = !inCurrentMonth(iso)
          return (
            <button
              key={iso}
              onClick={() => onChange(new Date(iso))}
              className="focus:outline-none transition-colors duration-200"
              style={{
                padding: '8px',
                margin: '2px',
                borderRadius: '8px',
                border: selected ? `2px solid ${theme==='dark'?'#3b82f6':'#3b82f6'}` : '2px solid transparent',
                background: selected ? (theme==='dark'?'#1e40af':'#3b82f6') : 'transparent',
                color: selected ? '#ffffff' : (muted ? (theme==='dark'?'#6b7280':'#9ca3af') : (theme==='dark'?'#e5e7eb':'#111827')),
                cursor: 'pointer',
                fontWeight: selected ? 600 : 500,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
              aria-label={`Select ${iso}`}
            >
              {new Date(iso).getDate().toString().padStart(2,'0')}
            </button>
          )
        })}
      </Box>
    </Box>
  )
}

export default MiniMonth


