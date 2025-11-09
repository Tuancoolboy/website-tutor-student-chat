import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  IconButton
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

interface GradesTabProps {
  sessionId?: string
  classId?: string
  isTutor: boolean
  currentUserId: string
}

const GradesTab: React.FC<GradesTabProps> = ({ sessionId, classId, isTutor, currentUserId }) => {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [gradeScore, setGradeScore] = useState<string>('')
  const [gradeFeedback, setGradeFeedback] = useState<string>('')

  const entityId = classId || sessionId
  const isClassView = !!classId

  useEffect(() => {
    loadData()
  }, [entityId])

  const loadData = async () => {
    if (!entityId) return
    
    try {
      setLoading(true)
      
      const [gradesRes, summaryRes] = await Promise.all([
        api.grades.list(entityId),
        api.grades.getSummary(entityId)
      ])
      
      if (gradesRes.success) {
        setGrades(gradesRes.data || [])
      }
      
      if (summaryRes.success) {
        setSummary(summaryRes.data)
      }

      // Load submissions for tutor to grade
      if (isTutor) {
        try {
          const submissionsRes = await api.submissions.list(entityId)
          if (submissionsRes.success && submissionsRes.data) {
            setSubmissions(submissionsRes.data || [])
          }
        } catch (error) {
          console.error('[GradesTab] Failed to load submissions:', error)
        }
      }
    } catch (error) {
      console.error('[GradesTab] Failed to load grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async () => {
    if (!entityId || !selectedSubmission || !gradeScore) return

    try {
      const score = parseFloat(gradeScore)
      const response = await api.submissions.grade(entityId, selectedSubmission.id, {
        score,
        feedback: gradeFeedback || undefined
      })

      if (response.success) {
        setIsGradingDialogOpen(false)
        setSelectedSubmission(null)
        setGradeScore('')
        setGradeFeedback('')
        loadData() // Reload data
      }
    } catch (error) {
      console.error('Failed to grade submission:', error)
      alert('Error grading submission')
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success'
    if (percentage >= 80) return 'primary'
    if (percentage >= 70) return 'warning'
    return 'error'
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
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
      {/* Summary Card */}
      {summary && (
        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ boxShadow: 'none' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Grade Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Points Earned
              </p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {summary.earnedPoints} / {summary.totalPoints}
              </p>
            </div>
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Percentage
              </p>
              <div className="flex items-center space-x-3">
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {summary.percentage.toFixed(1)}%
                </p>
                <Chip 
                  label={getGradeLetter(summary.percentage)}
                  color={getGradeColor(summary.percentage)}
                  size="small"
                />
              </div>
            </div>
            <div>
              <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Progress
              </p>
              <LinearProgress 
                variant="determinate" 
                value={summary.percentage}
                color={getGradeColor(summary.percentage)}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: 'none' }}>
        <div className="p-4 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Grade Details
          </h3>
        </div>
        
        {grades.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No grades yet
            </p>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                }}>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }} align="center">
                    Score
                  </TableCell>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }} align="center">
                    Percentage
                  </TableCell>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }} align="center">
                    Grade
                  </TableCell>
                  <TableCell sx={{ 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px'
                  }}>
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow 
                    key={grade.id}
                    sx={{ 
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      '&:hover': { 
                        backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb' 
                      },
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <TableCell sx={{ 
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      padding: '12px 16px'
                    }}>
                      <div className="flex items-center gap-2">
                        {grade.itemType === 'quiz' ? (
                          <QuizIcon className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} fontSize="small" />
                        ) : (
                          <AssignmentIcon className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} fontSize="small" />
                        )}
                        <span className="text-sm">
                          {grade.itemType === 'quiz' ? 'Quiz' : 'Assignment'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell sx={{ 
                      color: theme === 'dark' ? '#ffffff' : '#111827',
                      padding: '12px 16px',
                      fontSize: '0.875rem'
                    }}>
                      {grade.itemTitle}
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        color: theme === 'dark' ? '#ffffff' : '#111827', 
                        fontWeight: 600,
                        padding: '12px 16px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {grade.score} / {grade.maxScore}
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                        padding: '12px 16px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {grade.percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell align="center" sx={{ padding: '12px 16px' }}>
                      <Chip 
                        label={getGradeLetter(grade.percentage)}
                        color={getGradeColor(grade.percentage)}
                        size="small"
                        sx={{ height: '24px', fontSize: '12px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280', 
                      fontSize: '0.75rem',
                      padding: '12px 16px'
                    }}>
                      {new Date(grade.gradedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Submissions to Grade - Tutor Only */}
      {isTutor && submissions.length > 0 && (
        <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ boxShadow: 'none' }}>
          <div className="p-4 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Submissions to Grade
              </h3>
              <Chip 
                label={`${submissions.filter(s => !s.score).length} pending`}
                color="warning"
                size="small"
              />
            </div>
          </div>
          
          <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
            {submissions.map((submission) => {
              const isGraded = !!submission.score
              return (
                <div
                  key={submission.id}
                  className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AssignmentIcon className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} fontSize="small" />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Submission #{submission.id.slice(-6)}
                      </span>
                      {isGraded ? (
                        <Chip 
                          icon={<CheckCircleIcon />}
                          label="Graded"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label="Pending"
                          color="warning"
                          size="small"
                        />
                      )}
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      {submission.status === 'late' && (
                        <span className="ml-2 text-red-500">(Late)</span>
                      )}
                    </p>
                    {isGraded && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        Score: {submission.score} / {submission.maxScore || 'N/A'}
                      </p>
                    )}
                  </div>
                  <MuiButton
                    size="small"
                    variant={isGraded ? "outlined" : "contained"}
                    startIcon={<GradeIcon />}
                    onClick={() => {
                      setSelectedSubmission(submission)
                      setGradeScore(isGraded ? submission.score.toString() : '')
                      setGradeFeedback(submission.feedback || '')
                      setIsGradingDialogOpen(true)
                    }}
                    sx={{
                      backgroundColor: isGraded ? 'transparent' : '#2563eb',
                      color: isGraded ? (theme === 'dark' ? '#ffffff' : '#000000') : '#ffffff',
                      borderColor: isGraded ? (theme === 'dark' ? '#4b5563' : '#d1d5db') : '#2563eb',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {isGraded ? 'Update Grade' : 'Grade'}
                  </MuiButton>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {grades.some(g => g.feedback) && (
        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ boxShadow: 'none' }}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Tutor Feedback
          </h3>
          <div className="space-y-3">
            {grades
              .filter(g => g.feedback)
              .map(grade => (
                <div 
                  key={grade.id}
                  className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <h4 className={`font-semibold text-sm mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {grade.itemTitle}
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {grade.feedback}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog 
        open={isGradingDialogOpen} 
        onClose={() => setIsGradingDialogOpen(false)}
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
          Grade Submission
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <div className="space-y-4 mt-2">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </p>
                {selectedSubmission.content && (
                  <div className="mt-2">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Content:</p>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedSubmission.content}
                    </p>
                  </div>
                )}
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Attachments:</p>
                    {selectedSubmission.attachments.map((att: any, idx: number) => (
                      <a
                        key={idx}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm text-blue-500 hover:underline block mt-1`}
                      >
                        {att.fileName || 'Attachment'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <TextField
                fullWidth
                label="Score"
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                sx={{
                  '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)'
                    }
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="Feedback (optional)"
                multiline
                rows={4}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)'
                    }
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsGradingDialogOpen(false)}
            sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleGradeSubmission}
            variant="contained"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!gradeScore}
          >
            {selectedSubmission?.score ? 'Update Grade' : 'Submit Grade'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default GradesTab
