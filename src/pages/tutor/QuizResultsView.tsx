import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
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
  LinearProgress
} from '@mui/material'
import Card from '../../components/ui/Card'

const QuizResultsView: React.FC = () => {
  const { sessionId, classId, quizId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const isClassView = !!classId
  const entityId = classId || sessionId
  
  const [quiz, setQuiz] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [students, setStudents] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId, classId, quizId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (!entityId || !quizId) {
        console.error('Missing entityId or quizId')
        setLoading(false)
        return
      }
      
      // Load session/class, quiz and submissions in parallel
      const [quizResponse, submissionsResponse, sessionResponse] = await Promise.all([
        api.quizzes.list(entityId),
        api.quizzes.getSubmissions(entityId, quizId),
        isClassView ? api.classes.get(entityId) : api.sessions.get(entityId)
      ])
      
      if (quizResponse.success && quizResponse.data) {
        const foundQuiz = quizResponse.data.find((q: any) => q.id === quizId)
        if (foundQuiz) {
          setQuiz(foundQuiz)
        }
      }
      
      if (sessionResponse.success && sessionResponse.data) {
        setSession(sessionResponse.data)
      }
      
      if (submissionsResponse.success && submissionsResponse.data) {
        const submissionsData = submissionsResponse.data
        
        // Load student details for all unique student IDs
        const studentIds = [...new Set(submissionsData.map((s: any) => s.studentId))] as string[]
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
        setSubmissions(submissionsData)
      }
    } catch (error) {
      console.error('Failed to load quiz results:', error)
    } finally {
      setLoading(false)
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

  const handleViewDetails = (submission: any) => {
    setSelectedSubmission(submission)
    setIsDetailOpen(true)
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Quiz not found
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

  const avgScore = submissions.length > 0
    ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
    : 0
  const avgPercentage = (avgScore / quiz.totalPoints) * 100

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
            {/* Quiz Header */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ boxShadow: 'none' }}>
              <h2 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {quiz.title}
              </h2>
              {quiz.description && (
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.description}
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
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average Score</span>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {avgScore.toFixed(1)} / {quiz.totalPoints}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average</span>
                  <Chip 
                    label={`${avgPercentage.toFixed(1)}% (${getGradeLabel(avgPercentage)})`}
                    size="small"
                    sx={{ 
                      backgroundColor: getGradeColor(avgPercentage), 
                      color: 'white',
                      fontSize: '0.75rem',
                      height: '24px'
                    }}
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
                    {quiz?.title} - Results
                  </span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <BarChartIcon className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} sx={{ fontSize: 32 }} />
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Quiz Results
                </h1>
              </div>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                View submissions and scores for: <span className="font-semibold">{quiz?.title}</span>
              </p>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
              <Card 
                className={`border ${theme === 'dark' ? '!bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-12`}
                style={{ boxShadow: 'none' }}
              >
                <div className="text-center">
                  <QuizIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    No submissions yet
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    Students haven't submitted this quiz yet
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {submissions.map((submission) => {
                  const student = students[submission.studentId]
                  const studentName = student?.name || 'Unknown Student'
                  const score = parseFloat((submission.score || 0).toFixed(2))
                  const percentage = (score / quiz.totalPoints) * 100
                  const formattedPercentage = parseFloat(percentage.toFixed(2))
                  
                  return (
                    <Card
                      key={submission.id}
                      className={`border ${theme === 'dark' ? '!bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500`}
                      style={{ boxShadow: 'none' }}
                      onClick={() => handleViewDetails(submission)}
                    >
                      {/* Student Info Header */}
                      <div className="flex items-start justify-between mb-4 relative">
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: getAvatarColor(studentName),
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              flexShrink: 0,
                              '@media (min-width: 1024px)': {
                                width: 56,
                                height: 56,
                                fontSize: '1.25rem'
                              }
                            }}
                          >
                            {getInitials(studentName)}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm lg:text-lg font-semibold mb-1 break-words ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {studentName}
                            </h3>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              {student?.email || 'No email'}
                            </p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(submission.submittedAt).toLocaleDateString('vi-VN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div 
                          className="w-1 h-12 lg:h-16 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getGradeColor(percentage) }}
                        />
                      </div>

                      {/* Score Section */}
                      <div className={`p-3 lg:p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3">
                          <div className="text-center">
                            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Score</p>
                            <p className={`text-lg lg:text-2xl font-bold mb-0.5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {score.toFixed(2)}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              / {quiz.totalPoints}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Percentage</p>
                            <p 
                              className={`text-lg lg:text-2xl font-bold break-words`}
                              style={{ color: getGradeColor(percentage) }}
                            >
                              {formattedPercentage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Grade</p>
                            <div className="flex justify-center">
                              <Chip 
                                label={getGradeLabel(percentage)}
                                size="small"
                                sx={{ 
                                  backgroundColor: getGradeColor(percentage), 
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  height: '24px',
                                  fontWeight: 'bold',
                                  '@media (min-width: 1024px)': {
                                    fontSize: '0.875rem',
                                    height: '28px'
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage}
                          sx={{ 
                            height: 8,
                            '@media (min-width: 1024px)': {
                              height: 10
                            },
                            borderRadius: 5,
                            backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getGradeColor(percentage),
                              borderRadius: 5
                            }
                          }}
                        />
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog 
        open={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Submission Details
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && quiz && (() => {
            const student = students[selectedSubmission.studentId]
            const studentName = student?.name || 'Unknown Student'
            const percentage = (selectedSubmission.score || 0) / quiz.totalPoints * 100
            
            return (
              <div className="space-y-4 mt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Student Info */}
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: getAvatarColor(studentName),
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(studentName)}
                    </Avatar>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {studentName}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {student?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score Summary */}
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Score</p>
                      <p className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {parseFloat((selectedSubmission.score || 0).toFixed(2))}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        / {quiz.totalPoints}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Percentage</p>
                      <p 
                        className={`text-xl lg:text-2xl font-bold`} 
                        style={{ color: getGradeColor(percentage) }}
                      >
                        {parseFloat(percentage.toFixed(2))}%
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Grade</p>
                      <Chip 
                        label={getGradeLabel(percentage)}
                        sx={{ 
                          backgroundColor: getGradeColor(percentage), 
                          color: 'white',
                          fontSize: '0.875rem',
                          height: '32px',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage}
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getGradeColor(percentage),
                          borderRadius: 5
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Answers */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Answers
                  </h3>
                  <div className="space-y-3">
                    {quiz.questions.map((question: any, index: number) => {
                      const answer = selectedSubmission.answers.find((a: any) => a.questionId === question.id)
                      const studentAnswer = answer?.answer
                      const isCorrect = question.type === 'multiple_choice' || question.type === 'true_false'
                        ? studentAnswer === question.correctAnswer?.toString()
                        : null
                      
                      return (
                        <div
                          key={question.id}
                          className={`p-4 rounded-lg border ${
                            isCorrect === true
                              ? theme === 'dark' ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'
                              : isCorrect === false
                              ? theme === 'dark' ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'
                              : theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                  Q{index + 1}:
                                </span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {question.points} pts
                                </span>
                              </div>
                              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {question.question}
                              </p>
                            </div>
                            {isCorrect !== null && (
                              <Chip 
                                label={isCorrect ? 'Correct' : 'Incorrect'}
                                size="small"
                                sx={{ 
                                  backgroundColor: isCorrect ? '#10b981' : '#ef4444', 
                                  color: 'white',
                                  height: '24px',
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </div>
                          
                          {/* Student Answer */}
                          <div className="mt-3">
                            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Student Answer:
                            </p>
                            {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                              <div className={`p-3 rounded-lg ${
                                isCorrect 
                                  ? theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                                  : theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                              }`}>
                                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {question.options?.[studentAnswer] || studentAnswer}
                                </p>
                              </div>
                            ) : (
                              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {studentAnswer || 'No answer'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Correct Answer */}
                          {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'short_answer') && (
                            <div className="mt-2">
                              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Correct Answer:
                              </p>
                              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-500' : 'bg-blue-50 border border-blue-300'}`}>
                                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {question.type === 'short_answer' 
                                    ? question.correctAnswer
                                    : question.options?.[question.correctAnswer] || question.correctAnswer
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsDetailOpen(false)}
            sx={{ 
              color: theme === 'dark' ? '#9ca3af' : 'inherit',
              textTransform: 'none'
            }}
          >
            Close
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default QuizResultsView

