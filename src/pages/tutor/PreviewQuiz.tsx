import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Menu as MenuIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material'
import {
  Button as MuiButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  IconButton,
  Divider
} from '@mui/material'
import Card from '../../components/ui/Card'

const PreviewQuiz: React.FC = () => {
  const { sessionId, classId, quizId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const isClassView = !!classId
  const entityId = classId || sessionId
  
  const [quiz, setQuiz] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<any>(null)
  
  // Helper to generate question ID
  const generateQuestionId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Add new question
  const handleAddQuestion = () => {
    if (!editingQuiz) return
    
    const newQuestion = {
      id: generateQuestionId(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    }
    
    setEditingQuiz({
      ...editingQuiz,
      questions: [...(editingQuiz.questions || []), newQuestion]
    })
  }
  
  // Remove question
  const handleRemoveQuestion = (index: number) => {
    if (!editingQuiz || !confirm('Are you sure you want to delete this question?')) return
    
    const updatedQuestions = editingQuiz.questions.filter((_: any, i: number) => i !== index)
    setEditingQuiz({
      ...editingQuiz,
      questions: updatedQuestions
    })
  }
  
  // Update question
  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    if (!editingQuiz) return
    
    const updatedQuestions = [...editingQuiz.questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    
    // Auto-generate True/False options
    if (field === 'type' && value === 'true_false') {
      updatedQuestions[index].options = ['True', 'False']
      updatedQuestions[index].correctAnswer = 0
    } else if (field === 'type' && value === 'multiple_choice') {
      updatedQuestions[index].options = ['', '', '', '']
      updatedQuestions[index].correctAnswer = 0
    } else if (field === 'type' && value === 'short_answer') {
      updatedQuestions[index].options = []
      updatedQuestions[index].correctAnswer = ''
    }
    
    setEditingQuiz({
      ...editingQuiz,
      questions: updatedQuestions
    })
  }
  
  // Update option for multiple choice
  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!editingQuiz) return
    
    const updatedQuestions = [...editingQuiz.questions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setEditingQuiz({
      ...editingQuiz,
      questions: updatedQuestions
    })
  }

  useEffect(() => {
    loadQuiz()
  }, [sessionId, classId, quizId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      
      if (!entityId || !quizId) {
        console.error('Missing entityId or quizId')
        setLoading(false)
        return
      }
      
      const [quizResponse, sessionResponse] = await Promise.all([
        api.quizzes.list(entityId),
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
    } catch (error) {
      console.error('Failed to load quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    // Deep copy quiz with questions and options
    setEditingQuiz({
      ...quiz,
      questions: quiz.questions ? quiz.questions.map((q: any) => ({
        ...q,
        options: q.options ? [...q.options] : []
      })) : []
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!entityId || !quizId || !editingQuiz) return
    
    // Validate
    if (!editingQuiz.title.trim()) {
      alert('Please enter a quiz title')
      return
    }
    
    if (!editingQuiz.questions || editingQuiz.questions.length === 0) {
      alert('Please add at least one question')
      return
    }
    
    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i]
      if (!q.question.trim()) {
        alert(`Please enter question text for question ${i + 1}`)
        return
      }
      
      if ((q.type === 'multiple_choice' || q.type === 'true_false') && q.options.some((opt: string) => !opt.trim())) {
        alert(`Please fill all options for question ${i + 1}`)
        return
      }
      
      if (q.type === 'short_answer' && !q.correctAnswer) {
        alert(`Please enter correct answer for question ${i + 1}`)
        return
      }
      
      if (q.points <= 0) {
        alert(`Please enter valid points for question ${i + 1}`)
        return
      }
    }
    
    try {
      const totalPoints = editingQuiz.questions.reduce((sum: number, q: any) => sum + q.points, 0)
      const updatedQuiz = {
        ...editingQuiz,
        totalPoints,
        questions: editingQuiz.questions.map((q: any) => ({
          ...q,
          id: q.id || generateQuestionId()
        }))
      }
      
      const response = await api.quizzes.update(entityId, quizId, updatedQuiz)
      
      if (response.success) {
        setQuiz(response.data)
        setIsEditDialogOpen(false)
        setEditingQuiz(null)
        loadQuiz() // Reload to get updated data
      }
    } catch (error) {
      console.error('Failed to update quiz:', error)
      alert('Failed to update quiz')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz?')) return
    if (!entityId || !quizId) return
    
    try {
      const response = await api.quizzes.delete(entityId, quizId)
      
      if (response.success) {
        navigate(isClassView ? `/tutor/class/${entityId}` : `/tutor/session/${entityId}`)
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
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

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setMobileOpen(false)
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

  const currentQuestion = quiz.questions?.[currentQuestionIndex]
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
                {quiz.duration && (
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration</span>
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {quiz.duration} minutes
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Navigation */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ boxShadow: 'none' }}>
              <h3 className={`text-xs font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Questions
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions?.map((q: any, index: number) => (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      aspect-square rounded text-xs font-medium
                      transition-colors border
                      ${index === currentQuestionIndex
                        ? theme === 'dark' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <MuiButton
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  padding: '10px'
                }}
              >
                Edit Quiz
              </MuiButton>
              
              <MuiButton
                variant="outlined"
                fullWidth
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  padding: '10px',
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: '#fee2e2'
                  }
                }}
              >
                Delete Quiz
              </MuiButton>
              
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
                    onClick={() => navigate(isClassView ? `/tutor/class/${entityId}` : `/tutor/session/${entityId}`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {session.subject || session.code}
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {quiz.title} (Preview)
                  </span>
                </div>
              </div>
            )}

            {/* Current Question Preview */}
            <div className="max-w-4xl mx-auto">
              <div 
                className={`p-8 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{ boxShadow: 'none' }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                    {currentQuestionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`font-semibold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'} block mb-2`}>
                      {currentQuestion.question}
                    </span>
                    <div className="flex items-center gap-2">
                      <Chip 
                        label={`${currentQuestion.points} points`}
                        size="small"
                        sx={{ backgroundColor: '#10b981', color: 'white', height: '24px' }}
                      />
                      <Chip 
                        label={currentQuestion.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        size="small"
                        sx={{ backgroundColor: '#8b5cf6', color: 'white', height: '24px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Multiple Choice and True/False */}
                  {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') && (
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option: string, index: number) => (
                        <div
                          key={option}
                          className={`p-4 rounded-lg border-2 ${
                            index === currentQuestion.correctAnswer
                              ? theme === 'dark' 
                                ? 'bg-green-900/20 border-green-500' 
                                : 'bg-green-50 border-green-500'
                              : theme === 'dark'
                              ? 'bg-gray-700 border-gray-600'
                              : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                              index === currentQuestion.correctAnswer
                                ? 'bg-green-500 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-600 text-gray-300'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className={`flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {option}
                            </span>
                            {index === currentQuestion.correctAnswer && (
                              <Chip 
                                label="Correct"
                                size="small"
                                sx={{ backgroundColor: '#10b981', color: 'white' }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer */}
                  {currentQuestion.type === 'short_answer' && (
                    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                      <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Correct Answer:
                      </p>
                      <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {currentQuestion.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-6">
                <MuiButton
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
                </MuiButton>

                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>

                <MuiButton
                  variant="contained"
                  size="large"
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === totalQuestions - 1}
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
                </MuiButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)}
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
          Edit Quiz
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <TextField
              fullWidth
              label="Title"
              value={editingQuiz?.title || ''}
              onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={editingQuiz?.description || ''}
              onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={editingQuiz?.duration || ''}
              onChange={(e) => setEditingQuiz({ ...editingQuiz, duration: e.target.value ? parseInt(e.target.value) : '' })}
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />

            <Divider sx={{ my: 2, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />

            {/* Questions Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Questions ({editingQuiz?.questions?.length || 0})
                </h3>
                <MuiButton
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                >
                  Add Question
                </MuiButton>
              </div>

              {editingQuiz?.questions?.map((question: any, qIndex: number) => (
                <div
                  key={question.id || qIndex}
                  className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Question {qIndex + 1}
                    </h4>
                    {editingQuiz.questions.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        sx={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>

                  <div className="space-y-4">
                    <TextField
                      fullWidth
                      label="Question Text"
                      value={question.question}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                      required
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                        '& .MuiOutlinedInput-root': {
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                          '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                        }
                      }}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}>Question Type</InputLabel>
                        <Select
                          value={question.type}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'type', e.target.value)}
                          label="Question Type"
                          sx={{
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)'
                            }
                          }}
                        >
                          <MenuItem value="multiple_choice">Multiple Choice (A, B, C, D)</MenuItem>
                          <MenuItem value="true_false">True/False</MenuItem>
                          <MenuItem value="short_answer">Short Answer</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Points"
                        type="number"
                        value={question.points}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                        required
                        inputProps={{ min: 1 }}
                        sx={{
                          '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                          '& .MuiOutlinedInput-root': {
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                          }
                        }}
                      />
                    </div>

                    {/* Multiple Choice Options */}
                    {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                      <div className="space-y-3">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Options (Select correct answer):
                        </p>
                        <RadioGroup
                          value={question.correctAnswer}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
                        >
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <Radio
                                value={optIndex}
                                sx={{
                                  color: theme === 'dark' ? '#9ca3af' : '#000',
                                  '&.Mui-checked': {
                                    color: '#3b82f6'
                                  }
                                }}
                              />
                              <TextField
                                fullWidth
                                size="small"
                                placeholder={question.type === 'true_false' ? option : `Option ${String.fromCharCode(65 + optIndex)}`}
                                value={option}
                                onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                                disabled={question.type === 'true_false'}
                                required
                                sx={{
                                  '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                                  '& .MuiOutlinedInput-root': {
                                    color: theme === 'dark' ? '#ffffff' : '#000000',
                                    '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Short Answer */}
                    {question.type === 'short_answer' && (
                      <TextField
                        fullWidth
                        label="Correct Answer"
                        value={question.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'correctAnswer', e.target.value)}
                        required
                        sx={{
                          '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                          '& .MuiOutlinedInput-root': {
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => {
              setIsEditDialogOpen(false)
              setEditingQuiz(null)
            }}
            sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSaveEdit}
            variant="contained"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            sx={{ textTransform: 'none' }}
          >
            Save Changes
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default PreviewQuiz

