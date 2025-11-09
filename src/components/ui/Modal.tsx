import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  fullWidth = false
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={size}
      fullWidth={fullWidth}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default Modal
