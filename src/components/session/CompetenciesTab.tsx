import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Avatar,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  People as PeopleIcon
} from '@mui/icons-material'

interface CompetenciesTabProps {
  sessionId?: string
  classId?: string
  isTutor: boolean
}

const CompetenciesTab: React.FC<CompetenciesTabProps> = ({ sessionId, classId, isTutor }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [gradesMap, setGradesMap] = useState<{[studentId: string]: any}>({})
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')

  const isClassView = !!classId

  useEffect(() => {
    loadStudents()
  }, [sessionId, classId])

  const loadStudents = async () => {
    try {
      setLoading(true)
      
      if (isClassView && classId) {
        // Load students from class enrollments
        const enrollmentsRes = await api.enrollments.list({ classId, status: 'active' })
        
        if (enrollmentsRes.success && enrollmentsRes.data) {
          // Get student details for each enrollment
          const studentPromises = enrollmentsRes.data.map(async (enrollment: any) => {
            try {
              const studentRes = await api.users.get(enrollment.studentId)
              if (studentRes.success && studentRes.data) {
                return studentRes.data
              }
            } catch (error) {
              console.error(`Failed to load student ${enrollment.studentId}:`, error)
            }
            return null
          })
          
          const studentsData = await Promise.all(studentPromises)
          setStudents(studentsData.filter(s => s !== null))
        }
      } else if (sessionId) {
        // Load students from session
        const studentsRes = await api.sessionStudents.list(sessionId)
        
        if (studentsRes.success && studentsRes.data) {
          setStudents(studentsRes.data)
          
          // Load grades for each student if tutor
          if (isTutor) {
            const gradesData: {[key: string]: any} = {}
            for (const student of studentsRes.data) {
              try {
                const summaryRes = await api.grades.getSummary(sessionId, student.id)
                if (summaryRes.success) {
                  gradesData[student.id] = summaryRes.data
                }
              } catch (error) {
                console.error(`[CompetenciesTab] Failed to load grades for student ${student.id}:`, error)
              }
            }
            setGradesMap(gradesData)
          }
        }
      }
    } catch (error) {
      console.error('[CompetenciesTab] Failed to load students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async () => {
    try {
      // In real app, would search for student by email first
      console.log('Add student with email:', studentEmail)
      setIsAddDialogOpen(false)
      setStudentEmail('')
      loadStudents()
    } catch (error) {
      console.error('Failed to add student:', error)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student?')) {
      return
    }
    
    try {
      if (isClassView && classId) {
        // For classes, would need to update enrollment status
        console.log('Remove student from class not yet implemented')
        // TODO: Implement enrollment cancellation
      } else if (sessionId) {
        await api.sessionStudents.remove(sessionId, studentId)
      }
      loadStudents()
    } catch (error) {
      console.error('Failed to remove student:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      {isTutor && (
        <div className="flex justify-end mb-4">
          <MuiButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '6px',
              padding: '8px 20px'
            }}
          >
            Add Student
          </MuiButton>
        </div>
      )}

      {/* Students Section */}
      <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: 'none' }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center gap-2">
            <PeopleIcon className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Enrolled Students
            </h3>
            <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              ({students.length})
            </span>
          </div>
        </div>

        {/* Students List */}
        {students.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No students enrolled yet
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
            {students.map(student => (
              <div
                key={student.id}
                className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: getAvatarColor(student.name),
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {student.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-1">
                      {isTutor && (
                        <>
                          <div className="flex items-center gap-1">
                            <EmailIcon fontSize="small" className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} sx={{ fontSize: 14 }} />
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {student.email}
                            </span>
                          </div>
                          {student.major && (
                            <div className="flex items-center gap-1">
                              <SchoolIcon fontSize="small" className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} sx={{ fontSize: 14 }} />
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {student.major} - Year {student.year}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Show progress if tutor */}
                    {isTutor && gradesMap[student.id] && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          Grade: {gradesMap[student.id].earnedPoints}/{gradesMap[student.id].totalPoints} points ({gradesMap[student.id].percentage.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isTutor && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveStudent(student.id)}
                    sx={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }}
      >
        <DialogTitle sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Add Student to Session
        </DialogTitle>
        <DialogContent>
          <div className="mt-2">
            <TextField
              fullWidth
              label="Student Email"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@hcmut.edu.vn"
              helperText="Enter the email address of the student to add"
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': {
                    borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)'
                  }
                },
                '& .MuiFormHelperText-root': {
                  color: theme === 'dark' ? '#9ca3af' : 'inherit'
                }
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsAddDialogOpen(false)}
            sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleAddStudent}
            variant="contained"
            disabled={!studentEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CompetenciesTab
