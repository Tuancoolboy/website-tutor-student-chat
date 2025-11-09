import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  FilePresent as FilePresentIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material'
import {
  Button as MuiButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import Card from '../../components/ui/Card'

const AssignmentSubmissionsView: React.FC = () => {
  const { sessionId, classId, assignmentId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const isClassView = !!classId
  const entityId = classId || sessionId
  
  const [assignment, setAssignment] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [students, setStudents] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [isGradingOpen, setIsGradingOpen] = useState(false)
  const [gradeScore, setGradeScore] = useState<string>('')
  const [gradeFeedback, setGradeFeedback] = useState<string>('')
  const [gradingLoading, setGradingLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId, classId, assignmentId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (!entityId || !assignmentId) {
        console.error('Missing entityId or assignmentId')
        setLoading(false)
        return
      }
      
      // Load session/class, assignment and submissions
      const [assignmentsResponse, submissionsResponse, sessionResponse] = await Promise.all([
        api.assignments.list(entityId),
        api.submissions.list(entityId),
        isClassView ? api.classes.get(entityId) : api.sessions.get(entityId)
      ])
      
      if (assignmentsResponse.success && assignmentsResponse.data) {
        const foundAssignment = assignmentsResponse.data.find((a: any) => a.id === assignmentId)
        if (foundAssignment) {
          setAssignment(foundAssignment)
        }
      }
      
      if (sessionResponse.success && sessionResponse.data) {
        setSession(sessionResponse.data)
      }
      
      if (submissionsResponse.success && submissionsResponse.data) {
        const allSubmissions = submissionsResponse.data
        // Filter submissions for this assignment
        const assignmentSubmissions = allSubmissions.filter((s: any) => s.assignmentId === assignmentId)
        
        // Load student details
        const studentIds = [...new Set(assignmentSubmissions.map((s: any) => s.studentId))] as string[]
        const studentsMap: Record<string, any> = {}
        
        await Promise.all(
          studentIds.map(async (studentId) => {
            try {
              const userResponse = await api.users.get(studentId as string)
              const userData = userResponse.success ? userResponse.data : userResponse
              if (userData) {
                studentsMap[studentId as string] = userData
              }
            } catch (err) {
              console.error(`Error loading student ${studentId}:`, err)
            }
          })
        )
        
        setStudents(studentsMap)
        setSubmissions(assignmentSubmissions)
      }
    } catch (error) {
      console.error('Failed to load assignment submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async () => {
    if (!entityId || !selectedSubmission || !gradeScore) return

    try {
      setGradingLoading(true)
      const response = await api.submissions.grade(entityId, selectedSubmission.id, {
        score: parseFloat(gradeScore),
        feedback: gradeFeedback || undefined
      })

      if (response.success) {
        setIsGradingOpen(false)
        setSelectedSubmission(null)
        setGradeScore('')
        setGradeFeedback('')
        loadData()
      }
    } catch (error) {
      console.error('Failed to grade submission:', error)
      alert('Error grading submission')
    } finally {
      setGradingLoading(false)
    }
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981'
    if (percentage >= 70) return '#3b82f6'
    if (percentage >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Assignment not found
          </p>
          <MuiButton
            onClick={() => navigate(isClassView ? `/tutor/class/${entityId}` : `/tutor/session/${entityId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back
          </MuiButton>
        </div>
      </div>
    )
  }

  const pendingCount = submissions.filter(s => !s.score || s.score === null).length
  const gradedCount = submissions.filter(s => s.score).length

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-50
          w-80 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
          border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          overflow-y-auto
        `}>
          <div className="p-6 space-y-4">
            {/* Assignment Header */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ boxShadow: 'none' }}>
              <h2 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {assignment.title}
              </h2>
              {assignment.description && (
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {assignment.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ boxShadow: 'none' }}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Submissions</span>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{submissions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Graded</span>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{gradedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</span>
                  <Chip 
                    label={pendingCount}
                    size="small"
                    color="warning"
                    sx={{ height: '24px' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <MuiButton
                variant="outlined"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(isClassView ? `/tutor/class/${entityId}` : `/tutor/session/${entityId}`)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  padding: '10px',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              >
                Back to {isClassView ? 'Class' : 'Session'}
              </MuiButton>
            </div>
          </div>
        </div>

        {/* Backdrop for mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`p-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-100'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Breadcrumb */}
            {session && (
              <div className={`mb-6 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(isClassView ? `/tutor/class/${entityId}?tab=1` : `/tutor/session/${entityId}?tab=1`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {session.subject || session.code}
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {assignment?.title} - Submissions
                  </span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <BarChartIcon className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} sx={{ fontSize: 32 }} />
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Assignment Submissions
                </h1>
              </div>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Grade submissions for: <span className="font-semibold">{assignment?.title}</span>
              </p>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
              <Card 
                className={`border ${theme === 'dark' ? '!bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-12`}
                style={{ boxShadow: 'none' }}
              >
                <div className="text-center">
                  <AssignmentIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    No submissions yet
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    Students haven't submitted this assignment yet
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => {
                  const student = students[submission.studentId]
                  const studentName = student?.name || 'Unknown Student'
                  const isGraded = !!submission.score
                  const percentage = isGraded ? (submission.score / assignment.totalPoints) * 100 : 0
                  
                  return (
                    <Card
                      key={submission.id}
                      className={`border ${theme === 'dark' ? '!bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                      style={{ boxShadow: 'none' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: getAvatarColor(studentName),
                              fontSize: '1.2rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {getInitials(studentName)}
                          </Avatar>
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {studentName}
                            </h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              {submission.status === 'late' && (
                                <span className="ml-2 text-red-500">(Late)</span>
                              )}
                            </p>
                            {submission.content && (
                              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                                {submission.content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {isGraded ? (
                              <>
                                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {submission.score} / {assignment.totalPoints}
                                </div>
                                <Chip 
                                  label={`${percentage.toFixed(1)}% (${getGradeLabel(percentage)})`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: getGradeColor(percentage), 
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    height: '24px',
                                    marginTop: '4px'
                                  }}
                                />
                                <div className="mt-2">
                                  <Chip 
                                    icon={<CheckCircleIcon />}
                                    label="Graded"
                                    size="small"
                                    color="success"
                                    sx={{ height: '20px', fontSize: '0.7rem' }}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="mt-2">
                                <Chip 
                                  label="Pending"
                                  size="small"
                                  color="warning"
                                  sx={{ height: '20px', fontSize: '0.7rem' }}
                                />
                              </div>
                            )}
                          </div>
                          <MuiButton
                            variant={isGraded ? "outlined" : "contained"}
                            startIcon={<GradeIcon />}
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setGradeScore(isGraded ? submission.score.toString() : '')
                              setGradeFeedback(submission.feedback || '')
                              setIsGradingOpen(true)
                            }}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              backgroundColor: isGraded ? 'transparent' : '#2563eb',
                              color: isGraded ? (theme === 'dark' ? '#ffffff' : '#000000') : '#ffffff',
                              borderColor: isGraded ? (theme === 'dark' ? '#4b5563' : '#d1d5db') : '#2563eb'
                            }}
                          >
                            {isGraded ? 'Update' : 'Grade'}
                          </MuiButton>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Dialog */}
      <Dialog 
        open={isGradingOpen} 
        onClose={() => setIsGradingOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }}
      >
        <DialogTitle sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Grade Submission
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (() => {
            const student = students[selectedSubmission.studentId]
            const studentName = student?.name || 'Unknown Student'
            
            return (
              <div className="space-y-4 mt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Student:</strong> {studentName}
                  </p>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>
                
                {selectedSubmission.content && (
                  <div>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Submission Content:
                    </p>
                    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <p className={`text-sm whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedSubmission.content}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Attachments:
                    </p>
                    <div className="space-y-2">
                      {selectedSubmission.attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-3 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          } transition-colors`}
                        >
                          <FilePresentIcon className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {att.fileName || 'Attachment'}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {(att.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <TextField
                  fullWidth
                  label="Score"
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  inputProps={{ min: 0, max: assignment.totalPoints, step: 0.1 }}
                  helperText={`Max: ${assignment.totalPoints} points`}
                  sx={{
                    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                    '& .MuiOutlinedInput-root': {
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                    },
                    '& .MuiFormHelperText-root': { color: theme === 'dark' ? '#6b7280' : 'inherit' }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Feedback (optional)"
                  multiline
                  rows={4}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  sx={{
                    '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                    '& .MuiOutlinedInput-root': {
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                    }
                  }}
                />
              </div>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => {
              setIsGradingOpen(false)
              setGradeScore('')
              setGradeFeedback('')
            }}
            disabled={gradingLoading}
            sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit', textTransform: 'none' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleGrade}
            variant="contained"
            disabled={!gradeScore || gradingLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            sx={{ textTransform: 'none' }}
          >
            {gradingLoading ? 'Grading...' : 'Submit Grade'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AssignmentSubmissionsView

