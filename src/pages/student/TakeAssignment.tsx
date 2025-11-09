import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../lib/api'
import {
  Button,
  TextField,
  Alert
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Menu as MenuIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material'

const TakeAssignment: React.FC = () => {
  const { sessionId, classId, assignmentId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const isClassAssignment = !!classId
  const entityId = classId || sessionId
  
  const [assignment, setAssignment] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [classData, setClassData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    loadAssignment()
  }, [sessionId, classId, assignmentId])

  const loadAssignment = async () => {
    if (!entityId || !assignmentId) return
    
    try {
      setLoading(true)
      const [assignmentResponse, entityResponse] = await Promise.all([
        api.assignments.list(entityId!),
        isClassAssignment ? api.classes.get(entityId) : api.sessions.get(entityId)
      ])
      
      if (assignmentResponse.success && assignmentResponse.data) {
        const foundAssignment = assignmentResponse.data.find((a: any) => a.id === assignmentId)
        if (foundAssignment) {
          setAssignment(foundAssignment)
        }
      }
      
      if (entityResponse.success && entityResponse.data) {
        if (isClassAssignment) {
          setClassData(entityResponse.data)
        } else {
          setSession(entityResponse.data)
        }
      }
    } catch (error) {
      console.error('Failed to load assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!entityId || !assignmentId) return
    
    if (!content && !fileUrl) {
      alert('Please enter content or attach a file')
      return
    }

    try {
      setSubmitting(true)
      const attachments = fileUrl ? [{ fileUrl, fileName: fileName || 'attachment' }] : []
      
      const response = await api.assignments.submit(entityId!, assignmentId!, {
        content,
        attachments
      })

      if (response.success) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error)
      alert('Error submitting assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date()
  const hasContent = content.trim().length > 0 || fileUrl.trim().length > 0

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
        <Alert severity="error">Assignment not found</Alert>
      </div>
    )
  }

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
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Points</span>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{assignment.totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date</span>
                  <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No deadline'}
                  </span>
                </div>
                {!submitted && (
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Status</span>
                    <span className={`text-xs font-semibold ${hasContent ? 'text-green-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {hasContent ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                )}
              </div>
              {isOverdue && (
                <div className={`mt-3 p-2 rounded text-xs ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  ⚠️ This assignment is overdue
                </div>
              )}
            </div>

            {/* Submission Status */}
            {submitted && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}`}
                style={{ boxShadow: 'none' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                  <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-900'}`}>Submitted!</span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-green-500' : 'text-green-700'}`}>
                  {new Date().toLocaleString('en-US')}
                </p>
              </div>
            )}

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{ boxShadow: 'none' }}>
                <h3 className={`text-xs font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Resources
                </h3>
                <div className="space-y-2">
                  {assignment.attachments.map((att: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => window.open(att.fileUrl, '_blank')}
                      className={`w-full p-2 rounded text-left flex items-center gap-2 transition-colors text-xs ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <AttachFileIcon sx={{ fontSize: 16 }} />
                      <span className="truncate">
                        {att.fileName || 'File'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {!submitted && (
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handleSubmit}
                  disabled={submitting || (!content && !fileUrl)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '10px',
                    backgroundColor: theme === 'dark' ? '#2563eb' : '#2563eb',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#1d4ed8' : '#1d4ed8'
                    },
                    '&:disabled': {
                      backgroundColor: theme === 'dark' ? '#1e3a8a' : '#93c5fd',
                      color: theme === 'dark' ? '#9ca3af' : '#ffffff'
                    }
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              )}
              
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(isClassAssignment ? `/student/class/${entityId}` : `/student/session/${entityId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  padding: '10px'
                }}
              >
                {isClassAssignment ? 'Back to Class' : 'Back to Session'}
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
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                    : 'bg-white hover:bg-gray-100 border-gray-200'
                } border`}
                style={{
                  backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                  borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb'
                }}
              >
                <MenuIcon 
                  className="w-6 h-6" 
                  sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}
                />
              </button>
            </div>

            {/* Breadcrumb Navigation */}
            {(session || classData) && (
              <div className={`mb-6 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(isClassAssignment ? '/student/session?view=classes' : '/student/session')}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {isClassAssignment ? 'My Classes' : 'My Sessions'}
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <button
                    onClick={() => navigate(isClassAssignment ? `/student/class/${entityId}` : `/student/session/${entityId}`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {isClassAssignment ? `${classData?.code || ''} - ${classData?.subject || ''}` : session?.subject}
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <button
                    onClick={() => navigate(isClassAssignment ? `/student/class/${entityId}?tab=1` : `/student/session/${entityId}?tab=1`)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Assignment
                  </button>
                  <NavigateNextIcon sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {assignment.title}
                  </span>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              {submitted ? (
                /* Success View */
                <div className={`p-12 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{ boxShadow: 'none' }}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
                      <CheckCircleIcon sx={{ fontSize: 56, color: '#10b981' }} />
                    </div>
                    <h3 className={`text-3xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Successfully Submitted!
                    </h3>
                    <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your tutor will grade your assignment soon.
                    </p>
                    <Alert severity="success" sx={{ maxWidth: '600px', margin: '0 auto' }}>
                      <strong>Submitted on:</strong> {new Date().toLocaleString('en-US')}
                    </Alert>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Instructions */}
                  {assignment.instructions && (
                    <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      style={{ boxShadow: 'none' }}>
                      <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        📋 Instructions
                      </h3>
                      <p className={`whitespace-pre-wrap leading-relaxed text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {assignment.instructions}
                      </p>
                    </div>
                  )}

                  {/* Answer Area */}
                  <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{ boxShadow: 'none' }}>
                    <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ✍️ Your Work
                    </h3>

                    <TextField
                      fullWidth
                      multiline
                      rows={16}
                      variant="outlined"
                      label="Assignment Content *"
                      placeholder="Enter your work here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: theme === 'dark' ? '#fff' : '#000',
                          backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          '& fieldset': {
                            borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                        }
                      }}
                    />

                    <div className={`text-xs text-right mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {content.length} characters
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{ boxShadow: 'none' }}>
                    <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      📎 Attach File (Optional)
                    </h3>

                    <div className={`p-8 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
                      <div className="text-center">
                        <CloudUploadIcon 
                          sx={{ 
                            fontSize: 56, 
                            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                            marginBottom: '16px'
                          }} 
                        />
                        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Add a file URL to your submission
                        </p>
                        <TextField
                          fullWidth
                          variant="outlined"
                          label="File URL"
                          placeholder="https://..."
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          sx={{
                            maxWidth: '500px',
                            margin: '0 auto',
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                              color: theme === 'dark' ? '#fff' : '#000'
                            }
                          }}
                        />
                        {fileUrl && (
                          <TextField
                            fullWidth
                            variant="outlined"
                            label="File name"
                            placeholder="my-assignment.pdf"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            sx={{
                              maxWidth: '500px',
                              margin: '16px auto 0',
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                                color: theme === 'dark' ? '#fff' : '#000'
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {fileUrl && (
                      <Alert severity="info" sx={{ mt: 3 }}>
                        File attached: <strong>{fileName || fileUrl}</strong>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeAssignment
