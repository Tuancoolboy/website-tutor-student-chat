import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material'
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Menu as MenuIcon
} from '@mui/icons-material'

const TakeQuiz: React.FC = () => {
  const { sessionId, classId, quizId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  // Determine if this is a class or session quiz
  const isClassQuiz = !!classId
  const entityId = classId || sessionId
  
  const [quiz, setQuiz] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [sessionId, classId, quizId])

  useEffect(() => {
    if (quiz && quiz.duration && !submitted && timeLeft === null) {
      setTimeLeft(quiz.duration * 60)
    }
  }, [quiz])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev && prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev ? prev - 1 : null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft, submitted])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      
      if (!entityId) {
        console.error('No entityId found')
        setLoading(false)
        return
      }
      
      const [quizResponse, sessionResponse] = await Promise.all([
        api.quizzes.list(entityId),
        isClassQuiz ? api.classes.get(entityId) : api.sessions.get(entityId)
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
    } catch (error) {
      console.error('Failed to load quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitClick = () => {
    const totalQuestions = quiz?.questions?.length || 0
    const answeredCount = Object.keys(answers).length
    
    // If not all questions are answered, show confirmation dialog
    if (answeredCount < totalQuestions) {
      setShowSubmitConfirm(true)
    } else {
      // If all answered, submit directly
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setShowSubmitConfirm(false)
    try {
      setSubmitting(true)
      
      if (!entityId || !quizId) {
        console.error('Missing entityId or quizId')
        setSubmitting(false)
        return
      }
      
      const response = await api.quizzes.submit(entityId, quizId, answers as any)
      
      if (response.success) {
        setSubmitted(true)
        setResult(response.data)
        setCurrentQuestionIndex(0)
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981'
    if (percentage >= 80) return '#3b82f6'
    if (percentage >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setMobileOpen(false)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <LinearProgress style={{ width: '200px' }} />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <Alert severity="error">Quiz not found</Alert>
      </div>
    )
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions?.length || 0

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
            {!submitted && (
              <>
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ boxShadow: 'none' }}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Questions</span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Points</span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{quiz.totalPoints}</span>
                    </div>
                    {timeLeft !== null && (
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Time Left</span>
                        <span className={`text-sm font-semibold ${timeLeft < 60 ? 'text-red-600' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                    )}
                  </div>
                  {timeLeft !== null && (
                    <LinearProgress 
                      variant="determinate" 
                      value={quiz.duration ? (timeLeft / (quiz.duration * 60)) * 100 : 100}
                      sx={{
                        mt: 2,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: timeLeft < 60 ? '#ef4444' : '#2563eb'
                        }
                      }}
                    />
                  )}
                </div>

                {/* Progress */}
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ boxShadow: 'none' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Progress
                    </span>
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {answeredCount}/{totalQuestions}
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={(answeredCount / totalQuestions) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2563eb'
                      }
                    }}
                  />
                </div>

                {/* Question Navigation */}
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ boxShadow: 'none' }}>
                  <h3 className={`text-xs font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Questions
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {quiz.questions?.map((q: any, index: number) => {
                      const isAnswered = answers[q.id] && answers[q.id].trim() !== ''
                      const isCurrent = index === currentQuestionIndex
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => goToQuestion(index)}
                          className={`
                            aspect-square rounded text-xs font-medium
                            transition-colors border-2
                            ${isCurrent
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                              : isAnswered
                              ? theme === 'dark' 
                                ? 'bg-green-600/30 text-green-400 border-green-500 hover:bg-green-600/40' 
                                : 'bg-green-100 text-green-700 border-green-500 hover:bg-green-200'
                              : theme === 'dark'
                              ? 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            }
                          `}
                          style={{
                            fontWeight: isAnswered ? 600 : 500
                          }}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Result Display */}
            {submitted && result && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{ boxShadow: 'none' }}>
                <div className="text-center py-6">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getGradeColor((result.score / quiz.totalPoints) * 100) }}
                  >
                    {Math.round((result.score / quiz.totalPoints) * 100)}%
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Your Score
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {result.score}/{quiz.totalPoints} points
                  </p>
                </div>

                {result.feedback && (
                  <div className={`mt-3 p-3 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <strong className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Feedback:</strong>
                    <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{result.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {!submitted && (
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handleSubmitClick}
                  disabled={submitting || answeredCount === 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '10px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#1d4ed8'
                    },
                    '&:disabled': {
                      backgroundColor: theme === 'dark' ? '#1e3a8a' : '#93c5fd',
                      color: theme === 'dark' ? '#9ca3af' : '#ffffff'
                    }
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
              
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(isClassQuiz ? `/student/class/${entityId}` : `/student/session/${entityId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  padding: '10px'
                }}
              >
                {isClassQuiz ? 'Back to Class' : 'Back to Session'}
              </Button>
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

            {/* Breadcrumb Navigation */}
            {session && (
              <div className={`mb-6 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(isClassQuiz ? `/student/class/${entityId}` : `/student/session/${entityId}`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {session.subject || session.code}
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <button
                    onClick={() => navigate(isClassQuiz ? `/student/class/${entityId}?tab=1` : `/student/session/${entityId}?tab=1`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Quiz
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {quiz.title}
                  </span>
                </div>
              </div>
            )}

            {!submitted ? (
              /* Quiz Taking View */
              <div className="max-w-4xl mx-auto">
                {/* Current Question */}
                <div 
                  className={`p-8 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ boxShadow: 'none' }}
                >
                  <FormControl fullWidth>
                    <FormLabel>
                      <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                          {currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                          <span className={`font-semibold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'} block mb-2`}>
                            {currentQuestion.question}
                          </span>
                          <Chip 
                            label={`${currentQuestion.points} points`}
                            size="small"
                            sx={{ backgroundColor: '#10b981', color: 'white', height: '24px' }}
                          />
                        </div>
                      </div>
                    </FormLabel>

                    <div className="mt-4">
                      {/* Multiple Choice and True/False Questions */}
                      {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') && (
                        <RadioGroup
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        >
                          {currentQuestion.options?.map((option: string, index: number) => (
                            <FormControlLabel
                              key={option}
                              value={index.toString()}
                              control={<Radio />}
                              label={option}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  color: theme === 'dark' ? '#fff' : '#000',
                                  fontSize: '16px'
                                },
                                marginBottom: '12px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: `2px solid ${answers[currentQuestion.id] === index.toString() ? '#3b82f6' : 'transparent'}`,
                                backgroundColor: answers[currentQuestion.id] === index.toString()
                                  ? theme === 'dark' ? '#1e3a8a20' : '#dbeafe'
                                  : theme === 'dark' ? '#374151' : '#f9fafb',
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#4b5563' : '#f3f4f6'
                                }
                              }}
                            />
                          ))}
                        </RadioGroup>
                      )}

                      {/* Short Answer Questions */}
                      {currentQuestion.type === 'short_answer' && (
                        <TextField
                          multiline
                          rows={3}
                          fullWidth
                          variant="outlined"
                          placeholder="Nhập câu trả lời của bạn..."
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: theme === 'dark' ? '#fff' : '#000',
                              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                              fontSize: '16px',
                              '& fieldset': {
                                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
                              }
                            }
                          }}
                        />
                      )}

                      {/* Essay Questions */}
                      {currentQuestion.type === 'essay' && (
                        <TextField
                          multiline
                          rows={8}
                          fullWidth
                          variant="outlined"
                          placeholder="Enter your answer here..."
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: theme === 'dark' ? '#fff' : '#000',
                              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                              fontSize: '16px',
                              '& fieldset': {
                                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </FormControl>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    startIcon={<NavigateBeforeIcon />}
                    sx={{
                      borderRadius: '10px',
                      padding: '12px 24px',
                      textTransform: 'none',
                      fontSize: '16px',
                      fontWeight: 600,
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                  >
                    Previous
                  </Button>

                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>

                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmitClick}
                      disabled={submitting || answeredCount === 0}
                      sx={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        '&:hover': { 
                          backgroundColor: '#1d4ed8'
                        },
                        '&:disabled': {
                          backgroundColor: theme === 'dark' ? '#1e3a8a' : '#93c5fd',
                          color: theme === 'dark' ? '#9ca3af' : '#ffffff'
                        },
                        borderRadius: '10px',
                        padding: '12px 24px',
                        textTransform: 'none',
                        fontSize: '16px',
                        fontWeight: 600
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={nextQuestion}
                      endIcon={<NavigateNextIcon />}
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' },
                        borderRadius: '10px',
                        padding: '12px 24px',
                        textTransform: 'none',
                        fontSize: '16px',
                        fontWeight: 600
                      }}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Answer Review */
              <div className="max-w-4xl mx-auto space-y-4">
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Answer Review
                </h2>
                {quiz.questions?.map((question: any, index: number) => {
                  // Check if answer is correct based on question type
                  const isCorrect = question.type === 'short_answer' || question.type === 'essay'
                    ? false // Short answer and essay need manual grading
                    : answers[question.id] === question.correctAnswer?.toString()
                  return (
                    <div 
                      key={question.id} 
                      className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      style={{ boxShadow: 'none' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isCorrect ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium mb-3 text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {question.question}
                            <Chip 
                              label={`${question.points} pts`}
                              size="small"
                              sx={{ ml: 2, height: '22px', fontSize: '12px' }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Your answer: 
                              </span>
                              <span className={`ml-2 ${isCorrect ? 'text-green-600' : 'text-orange-600'} font-semibold`}>
                                {question.type === 'multiple_choice' || question.type === 'true_false'
                                  ? question.options?.[parseInt(answers[question.id])] || 'No answer'
                                  : answers[question.id] || 'No answer'}
                              </span>
                            </div>
                            {question.type !== 'essay' && question.type !== 'short_answer' && (
                              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'}`}>
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Correct answer: 
                                </span>
                                <span className="ml-2 text-green-600 font-semibold">
                                  {question.type === 'multiple_choice' || question.type === 'true_false'
                                    ? question.options?.[question.correctAnswer]
                                    : question.correctAnswer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
          Confirm Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            You have answered {answeredCount} out of {totalQuestions} questions. 
            Are you sure you want to submit your quiz now? 
            {totalQuestions - answeredCount > 0 && (
              <span className="font-semibold">
                {' '}You still have {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount > 1 ? 's' : ''}.
              </span>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSubmitConfirm(false)}
            sx={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              },
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Yes, Submit Quiz
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default TakeQuiz
