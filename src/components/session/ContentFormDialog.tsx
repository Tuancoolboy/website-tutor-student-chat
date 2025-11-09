import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material'

interface ContentFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (contentData: any) => void
  type: 'document' | 'announcement'
}

const ContentFormDialog: React.FC<ContentFormDialogProps> = ({ open, onClose, onSubmit, type }) => {
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('') // For announcements
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState<number | ''>('')
  const [url, setUrl] = useState('')
  const [contentType, setContentType] = useState<'file' | 'link'>('file') // For documents

  const handleSubmit = () => {
    // Validate
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (type === 'document') {
      if (contentType === 'file' && (!fileUrl.trim() || !fileName.trim())) {
        alert('Please enter file name and URL')
        return
      } else if (contentType === 'link' && !url.trim()) {
        alert('Please enter a URL')
        return
      }

      // Validate URLs
      if (contentType === 'file' && fileUrl.trim()) {
        try {
          new URL(fileUrl)
        } catch {
          alert('Please enter a valid file URL')
          return
        }
      }
      
      if (contentType === 'link' && url.trim()) {
        try {
          new URL(url)
        } catch {
          alert('Please enter a valid URL')
          return
        }
      }
    }
    
    const contentData: any = {
      title,
      description: description.trim() || undefined,
      type
    }

    if (type === 'document') {
      if (contentType === 'file') {
        contentData.fileUrl = fileUrl
        contentData.fileName = fileName
        contentData.fileSize = fileSize ? (typeof fileSize === 'string' ? parseInt(fileSize) : fileSize) : undefined
      } else {
        contentData.url = url
      }
    } else if (type === 'announcement') {
      contentData.content = content.trim() || undefined
      // Announcements can also have files or links
      if (fileUrl.trim()) {
        contentData.fileUrl = fileUrl
        contentData.fileName = fileName || 'Attachment'
      }
      if (url.trim()) {
        contentData.url = url
      }
    }
    
    onSubmit(contentData)
    // Reset form
    setTitle('')
    setDescription('')
    setContent('')
    setFileUrl('')
    setFileName('')
    setFileSize('')
    setUrl('')
    setContentType('file')
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
          color: theme === 'dark' ? '#ffffff' : '#000000'
        }
      }}
    >
      <DialogTitle sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
        Create New {type === 'document' ? 'Document' : 'Announcement'}
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-2">
          <TextField
            fullWidth
            label="Title"
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
            rows={3}
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

          {type === 'announcement' && (
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content..."
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />
          )}

          {type === 'document' && (
            <FormControl component="fieldset">
              <FormLabel sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }}>
                Content Type
              </FormLabel>
              <RadioGroup
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'file' | 'link')}
                row
              >
                <FormControlLabel
                  value="file"
                  control={<Radio sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }} />}
                  label="File"
                  sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                />
                <FormControlLabel
                  value="link"
                  control={<Radio sx={{ color: theme === 'dark' ? '#9ca3af' : 'inherit' }} />}
                  label="External Link"
                  sx={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                />
              </RadioGroup>
            </FormControl>
          )}

          {/* File Upload Fields */}
          {(type === 'document' && contentType === 'file') || type === 'announcement' ? (
            <div className="space-y-3">
              <TextField
                fullWidth
                label="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g., lecture_notes.pdf"
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
                label="File URL"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/files/document.pdf"
                required={type === 'document' && contentType === 'file'}
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
                label="File Size (bytes)"
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Optional"
                sx={{
                  '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                  }
                }}
              />
            </div>
          ) : null}

          {/* External Link Field */}
          {(type === 'document' && contentType === 'link') || (type === 'announcement') ? (
            <TextField
              fullWidth
              label="External Link (Optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required={type === 'document' && contentType === 'link'}
              sx={{
                '& .MuiInputLabel-root': { color: theme === 'dark' ? '#9ca3af' : 'inherit' },
                '& .MuiOutlinedInput-root': {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& fieldset': { borderColor: theme === 'dark' ? '#4b5563' : 'rgba(0, 0, 0, 0.23)' }
                }
              }}
            />
          ) : null}
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
          Create {type === 'document' ? 'Document' : 'Announcement'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  )
}

export default ContentFormDialog

