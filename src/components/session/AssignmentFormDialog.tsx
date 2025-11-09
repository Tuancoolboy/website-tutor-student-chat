import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material'

interface AssignmentFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (assignmentData: any) => void
}

const AssignmentFormDialog: React.FC<AssignmentFormDialogProps> = ({ open, onClose, onSubmit }) => {
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [totalPoints, setTotalPoints] = useState<number | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; fileSize: number }>>([])
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentFileName, setAttachmentFileName] = useState('')

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim() || !attachmentFileName.trim()) {
      alert('Please enter both file name and URL')
      return
    }

    // Basic URL validation
    try {
      new URL(attachmentUrl)
    } catch {
      alert('Please enter a valid URL')
      return
    }

    setAttachments([...attachments, {
      fileName: attachmentFileName,
      fileUrl: attachmentUrl,
      fileSize: 0 // Could be improved with actual file size
    }])
    setAttachmentUrl('')
    setAttachmentFileName('')
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    // Validate
    if (!title.trim()) {
      alert('Please enter an assignment title')
      return
    }
    
    if (!description.trim() || description.length < 10) {
      alert('Please enter a description with at least 10 characters')
      return
    }
    
    if (!totalPoints || totalPoints <= 0) {
      alert('Please enter valid points (greater than 0)')
      return
    }
    
    if (!dueDate) {
      alert('Please select a due date')
      return
    }

    // Convert dueDate to ISO string
    const dueDateISO = new Date(dueDate).toISOString()
    
    const assignmentData = {
      title,
      description,
      instructions: instructions.trim() || undefined,
      totalPoints: typeof totalPoints === 'string' ? parseInt(totalPoints) : totalPoints,
      dueDate: dueDateISO,
      attachments: attachments.length > 0 ? attachments : undefined
    }
    
    onSubmit(assignmentData)
    // Reset form
    setTitle('')
    setDescription('')
    setInstructions('')
    setTotalPoints('')
    setDueDate('')
    setAttachments([])
    setAttachmentUrl('')
    setAttachmentFileName('')
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
        Create New Assignment
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <TextField
            fullWidth
            label="Assignment Title"
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
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            helperText="At least 10 characters"
            sx={{
              '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
              '& .MuiOutlinedInput-root': {
                color: theme === 'dark' ? '#ffffff' : '#000000',
                '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
              },
              '& .MuiFormHelperText-root': {
                color: theme === 'dark' ? '#9ca3af' : 'rgba(0, 0, 0, 0.6)'
              }
            }}
          />

          <TextField
            fullWidth
            label="Instructions (Optional)"
            multiline
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide detailed instructions for students..."
            sx={{
              '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
              '& .MuiOutlinedInput-root': {
                color: theme === 'dark' ? '#ffffff' : '#000000',
                '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
              }
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="Total Points"
              type="number"
              value={totalPoints}
              onChange={(e) => setTotalPoints(e.target.value ? parseInt(e.target.value) : '')}
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

            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />
          </div>

          {/* Attachments Section */}
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Attachments (Optional)
            </h4>
            
            {/* Add Attachment */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <TextField
                fullWidth
                size="small"
                label="File Name"
                value={attachmentFileName}
                onChange={(e) => setAttachmentFileName(e.target.value)}
                placeholder="e.g., Assignment_Guide.pdf"
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
                size="small"
                label="File URL"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
                sx={{
                  '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                  }
                }}
              />
              <MuiButton
                startIcon={<AddIcon />}
                onClick={handleAddAttachment}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  color: theme === 'dark' ? '#fff' : '#000',
                  height: '40px'
                }}
              >
                Add
              </MuiButton>
            </div>

            {/* List of Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <AttachFileIcon className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                      >
                        {attachment.fileName}
                      </a>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveAttachment(index)}
                      sx={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
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
          Create Assignment
        </MuiButton>
      </DialogActions>
    </Dialog>
  )
}

export default AssignmentFormDialog

