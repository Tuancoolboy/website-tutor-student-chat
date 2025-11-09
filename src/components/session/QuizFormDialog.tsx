import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button as MuiButton,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

interface QuizFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (quizData: any) => void
}

const QuizFormDialog: React.FC<QuizFormDialogProps> = ({ open, onClose, onSubmit }) => {
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [questions, setQuestions] = useState<any[]>([{
    id: `q_${Date.now()}`,
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  }])

  const generateQuestionId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      id: generateQuestionId(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-generate True/False options
    if (field === 'type' && value === 'true_false') {
      updated[index].options = ['True', 'False']
      updated[index].correctAnswer = 0
    } else if (field === 'type' && value === 'multiple_choice') {
      updated[index].options = ['', '', '', '']
      updated[index].correctAnswer = 0
    } else if (field === 'type' && value === 'short_answer') {
      updated[index].options = []
      updated[index].correctAnswer = ''
    }
    
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const handleSubmit = () => {
    // Validate
    if (!title.trim()) {
      alert('Please enter a quiz title')
      return
    }
    
    if (questions.length === 0) {
      alert('Please add at least one question')
      return
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
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
    
    const quizData = {
      title,
      description,
      duration: duration ? (typeof duration === 'string' ? parseInt(duration) : duration) : undefined,
      questions: questions.map(q => ({
        ...q,
        id: q.id || generateQuestionId()
      }))
    }
    
    onSubmit(quizData)
    // Reset form
    setTitle('')
    setDescription('')
    setDuration('')
    setQuestions([{
      id: generateQuestionId(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    }])
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        Create New Quiz
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <TextField
            fullWidth
            label="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            value={duration}
            onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
            sx={{
              '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
              '& .MuiOutlinedInput-root': {
                color: theme === 'dark' ? '#ffffff' : '#000000',
                '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
              }
            }}
          />

          <Divider sx={{ my: 2, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Questions ({questions.length})
              </h3>
              <MuiButton
                startIcon={<AddIcon />}
                onClick={addQuestion}
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

            {questions.map((question, qIndex) => (
              <div
                key={question.id}
                className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Question {qIndex + 1}
                  </h4>
                  {questions.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeQuestion(qIndex)}
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
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
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
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
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
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
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
                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
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
                              onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
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
                      onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
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
          onClick={handleClose}
          sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}
        >
          Cancel
        </MuiButton>
        <MuiButton
          onClick={handleSubmit}
          variant="contained"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          sx={{ textTransform: 'none' }}
        >
          Create Quiz
        </MuiButton>
      </DialogActions>
    </Dialog>
  )
}

export default QuizFormDialog

