import React from 'react'
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'

interface ButtonProps extends MuiButtonProps {
  variant?: 'contained' | 'outlined' | 'text'
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'contained',
  children,
  className,
  style,
  ...props 
}) => {
  return (
    <MuiButton 
      variant={variant} 
      className={className}
      style={{
        textTransform: 'none',
        ...style
      }}
      {...props}
    >
      {children}
    </MuiButton>
  )
}

export default Button
