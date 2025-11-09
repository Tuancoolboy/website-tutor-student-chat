import React from 'react'
import { TextField, InputAdornment } from '@mui/material'

interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  error?: boolean
  helperText?: string
  fullWidth?: boolean
  disabled?: boolean
  required?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  startIcon,
  endIcon,
  error,
  helperText,
  fullWidth = true,
  disabled,
  required
}) => {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      variant="outlined"
      type={type}
      fullWidth={fullWidth}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: startIcon ? (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        ) : undefined,
        endAdornment: endIcon ? (
          <InputAdornment position="end">{endIcon}</InputAdornment>
        ) : undefined,
      }}
    />
  )
}

export default Input
