import React from 'react'
import { Avatar as MuiAvatar, AvatarGroup } from '@mui/material'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'small' | 'medium' | 'large' | 'xl'
  showBadge?: boolean
  badgeColor?: string
  children?: React.ReactNode
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'medium',
  showBadge: _showBadge = false,
  badgeColor: _badgeColor = 'green',
  children
}) => {
  const muiSize = size === 'small' ? 32 : size === 'large' ? 56 : size === 'xl' ? 80 : 40

  return (
    <MuiAvatar
      src={src}
      alt={alt}
      sx={{ width: muiSize, height: muiSize }}
    >
      {children || name?.charAt(0)}
    </MuiAvatar>
  )
}

export { AvatarGroup }
export default Avatar
