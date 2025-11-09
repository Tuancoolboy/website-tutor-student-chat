import React from 'react'
import { Card as MuiCard, CardContent, CardActions, CardHeader, CardMedia } from '@mui/material'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  image?: string
  actions?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  sx?: any
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle, 
  image, 
  actions,
  className,
  style,
  sx,
  onClick
}) => {
  return (
    <MuiCard 
      className={className} 
      elevation={0}
      sx={sx}
      onClick={onClick}
      style={{
        boxShadow: 'none',
        border: '1px solid',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {title && (
        <CardHeader 
          title={title} 
          subheader={subtitle}
        />
      )}
      {image && (
        <CardMedia
          component="img"
          height="140"
          image={image}
          alt={title}
        />
      )}
      <CardContent>
        {children}
      </CardContent>
      {actions && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </MuiCard>
  )
}

export default Card
