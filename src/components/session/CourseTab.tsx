import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import QuizFormDialog from './QuizFormDialog'
import AssignmentFormDialog from './AssignmentFormDialog'
import ContentFormDialog from './ContentFormDialog'
import {
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  Announcement as AnnouncementIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  InsertDriveFile as FileIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material'

interface CourseTabProps {
  sessionId?: string
  classId?: string
  isTutor: boolean
}

const CourseTab: React.FC<CourseTabProps> = ({ sessionId, classId, isTutor }) => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  // Determine if this is a class or session
  const isClassView = !!classId
  const entityId = classId || sessionId
  const [loading, setLoading] = useState(true)
  const [contents, setContents] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  
  // Collapsible states
  const [materialsOpen, setMaterialsOpen] = useState(true)
  const [quizzesOpen, setQuizzesOpen] = useState(true)
  const [assignmentsOpen, setAssignmentsOpen] = useState(true)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false)
  const [addType, setAddType] = useState<'document' | 'announcement' | 'quiz' | 'assignment'>('document')

  useEffect(() => {
    loadCourseData()
  }, [sessionId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      
      const [contentsRes, quizzesRes, assignmentsRes] = await Promise.all([
        api.courseContents.list(entityId!),
        api.quizzes.list(entityId!),
        api.assignments.list(entityId!)
      ])
      
      if (contentsRes.success) {
        setContents(contentsRes.data || [])
      }
      
      if (quizzesRes.success) {
        setQuizzes(quizzesRes.data || [])
      }
      
      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data || [])
      }
    } catch (error) {
      console.error('[CourseTab] Failed to load course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContent = async () => {
    try {
      if (addType === 'document' || addType === 'announcement') {
        setIsAddDialogOpen(false)
        setIsContentDialogOpen(true)
        return
      } else if (addType === 'quiz') {
        setIsAddDialogOpen(false)
        setIsQuizDialogOpen(true)
        return
      } else if (addType === 'assignment') {
        setIsAddDialogOpen(false)
        setIsAssignmentDialogOpen(true)
        return
      }
    } catch (error) {
      console.error('Failed to add content:', error)
      alert('Failed to add content. Please try again.')
    }
  }

  const handleContentSubmit = async (contentData: any) => {
    try {
      // Add classId or sessionId to content data
      if (isClassView) {
        contentData.classId = entityId
      } else {
        contentData.sessionId = entityId
      }
      
      await api.courseContents.create(entityId!, contentData)
      setIsContentDialogOpen(false)
      setIsAddDialogOpen(false)
      loadCourseData()
    } catch (error) {
      console.error('Failed to create content:', error)
      alert('Failed to create content. Please try again.')
    }
  }

  const handleQuizSubmit = async (quizData: any) => {
    try {
      // Add classId or sessionId to quiz data
      if (isClassView) {
        quizData.classId = entityId
      } else {
        quizData.sessionId = entityId
      }
      
      await api.quizzes.create(entityId!, quizData)
      setIsQuizDialogOpen(false)
      setIsAddDialogOpen(false)
      loadCourseData()
    } catch (error) {
      console.error('Failed to create quiz:', error)
      alert('Failed to create quiz. Please try again.')
    }
  }

  const handleAssignmentSubmit = async (assignmentData: any) => {
    try {
      // Add classId or sessionId to assignment data
      if (isClassView) {
        assignmentData.classId = entityId
      } else {
        assignmentData.sessionId = entityId
      }
      
      await api.assignments.create(entityId!, assignmentData)
      setIsAssignmentDialogOpen(false)
      setIsAddDialogOpen(false)
      loadCourseData()
    } catch (error) {
      console.error('Failed to create assignment:', error)
      alert('Failed to create assignment. Please try again.')
    }
  }

  const handleDeleteContent = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      if (type === 'document' || type === 'announcement' || type === 'link' || type === 'material') {
        await api.courseContents.delete(entityId!, id)
      } else if (type === 'quiz') {
        await api.quizzes.delete(entityId!, id)
      } else if (type === 'assignment') {
        await api.assignments.delete(entityId!, id)
      }
      loadCourseData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileIcon className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} fontSize="small" />
      case 'announcement':
        return <AnnouncementIcon className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} fontSize="small" />
      case 'link':
        return <LinkIcon className={theme === 'dark' ? 'text-green-400' : 'text-green-600'} fontSize="small" />
      default:
        return <DescriptionIcon className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
    }
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
      {/* Add Content Button - Only for tutors */}
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
            Add Content
          </MuiButton>
        </div>
      )}

      {/* Materials Section */}
      <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: 'none' }}>
        {/* Materials Header */}
        <button
          onClick={() => setMaterialsOpen(!materialsOpen)}
          className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors rounded-t-lg`}
        >
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Materials
          </h3>
          <ExpandMoreIcon 
            className={`transform transition-transform ${materialsOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          />
        </button>

        {/* Materials Content */}
        {materialsOpen && (
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {contents.length === 0 ? (
              <div className="p-6 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No materials yet
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                {contents.map((content) => (
                  <div
                    key={content.id}
                    className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {getContentIcon(content.type)}
                      <div className="flex-1">
                        <a
                          href={content.fileUrl || content.url || '#'}
                          target={content.fileUrl || content.url ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className={`text-base font-medium hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-gray-900'}`}
                        >
                          {content.title}
                        </a>
                        {content.description && (
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                            {content.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isTutor && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteContent(content.type, content.id)}
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
        )}
      </div>

      {/* Quizzes Section */}
      <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: 'none' }}>
        {/* Quizzes Header */}
        <button
          onClick={() => setQuizzesOpen(!quizzesOpen)}
          className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors rounded-t-lg`}
        >
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Quizzes
          </h3>
          <ExpandMoreIcon 
            className={`transform transition-transform ${quizzesOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          />
        </button>

        {/* Quizzes Content */}
        {quizzesOpen && (
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {quizzes.length === 0 ? (
              <div className="p-6 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No quizzes yet
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => navigate(isTutor 
                      ? (isClassView 
                        ? `/tutor/class/${entityId}/quiz/${quiz.id}` 
                        : `/tutor/session/${entityId}/quiz/${quiz.id}`)
                      : (isClassView 
                        ? `/student/class/${entityId}/quiz/${quiz.id}` 
                        : `/student/session/${entityId}/quiz/${quiz.id}`))}
                    className={`p-4 flex items-center justify-between cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <QuizIcon className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} fontSize="small" />
                      <div className="flex-1">
                        <div className={`text-base font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-gray-900'}`}>
                          {quiz.title}
                        </div>
                        {quiz.description && (
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                            {quiz.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            {quiz.questions?.length || 0} questions • {quiz.totalPoints} points
                            {quiz.duration && ` • ${quiz.duration} min`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isTutor && (
                      <div className="flex items-center gap-1">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(isClassView 
                              ? `/tutor/class/${entityId}/quiz/${quiz.id}/results` 
                              : `/tutor/session/${entityId}/quiz/${quiz.id}/results`)
                          }}
                          sx={{ color: theme === 'dark' ? '#8b5cf6' : '#7c3aed' }}
                          title="View Results"
                        >
                          <BarChartIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteContent('quiz', quiz.id)
                          }}
                          sx={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: 'none' }}>
        {/* Assignments Header */}
        <button
          onClick={() => setAssignmentsOpen(!assignmentsOpen)}
          className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors rounded-t-lg`}
        >
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Assignments
          </h3>
          <ExpandMoreIcon 
            className={`transform transition-transform ${assignmentsOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          />
        </button>

        {/* Assignments Content */}
        {assignmentsOpen && (
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {assignments.length === 0 ? (
              <div className="p-6 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No assignments yet
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => navigate(isClassView 
                      ? `/student/class/${entityId}/assignment/${assignment.id}` 
                      : `/student/session/${entityId}/assignment/${assignment.id}`)}
                    className={`p-4 flex items-center justify-between cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <AssignmentIcon className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} fontSize="small" />
                      <div className="flex-1">
                        <div className={`text-base font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-gray-900'}`}>
                          {assignment.title}
                        </div>
                        {assignment.description && (
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            {assignment.totalPoints} points
                            {assignment.dueDate && ` • Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isTutor && (
                      <div className="flex items-center gap-1">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(isClassView 
                              ? `/tutor/class/${entityId}/assignment/${assignment.id}/submissions` 
                              : `/tutor/session/${entityId}/assignment/${assignment.id}/submissions`)
                          }}
                          sx={{ color: theme === 'dark' ? '#fb923c' : '#ea580c' }}
                          title="View Submissions"
                        >
                          <BarChartIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteContent('assignment', assignment.id)
                          }}
                          sx={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Dialog */}
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
          Add New Content
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <FormControl fullWidth>
              <InputLabel sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}>Content Type</InputLabel>
              <Select
                value={addType}
                onChange={(e) => setAddType(e.target.value as any)}
                label="Content Type"
                sx={{
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)'
                  }
                }}
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
              </Select>
            </FormControl>

            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {addType === 'quiz' && 'Click "Add" to open the Quiz Creation form with question editor.'}
              {addType === 'assignment' && 'Click "Add" to open the Assignment Creation form.'}
              {addType === 'document' && 'Click "Add" to open the Document Creation form.'}
              {addType === 'announcement' && 'Click "Add" to open the Announcement Creation form.'}
            </p>

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
            onClick={handleAddContent}
            variant="contained"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Quiz Form Dialog */}
      <QuizFormDialog
        open={isQuizDialogOpen}
        onClose={() => {
          setIsQuizDialogOpen(false)
          setIsAddDialogOpen(false)
        }}
        onSubmit={handleQuizSubmit}
      />

      {/* Assignment Form Dialog */}
      <AssignmentFormDialog
        open={isAssignmentDialogOpen}
        onClose={() => {
          setIsAssignmentDialogOpen(false)
          setIsAddDialogOpen(false)
        }}
        onSubmit={handleAssignmentSubmit}
      />

      {/* Content Form Dialog (Document/Announcement) */}
      <ContentFormDialog
        open={isContentDialogOpen}
        onClose={() => {
          setIsContentDialogOpen(false)
          setIsAddDialogOpen(false)
        }}
        onSubmit={handleContentSubmit}
        type={addType === 'document' ? 'document' : 'announcement'}
      />
    </div>
  )
}

export default CourseTab
