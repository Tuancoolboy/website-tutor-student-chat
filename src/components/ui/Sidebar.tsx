import React from 'react'
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography } from '@mui/material'
import { 
  Dashboard, 
  School, 
  List as ListIcon, 
  BarChart, 
  Star, 
  WorkspacePremium, 
  Folder,
  Download,
  Person as _Person,
  CalendarMonth
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 280

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/student' },
  { text: 'Courses', icon: <School />, path: '/student/search' },
  { text: 'Lessons', icon: <ListIcon />, path: '/student/book' },
  { text: 'Calendar', icon: <CalendarMonth />, path: '/student/calendar' },
  { text: 'Assessments', icon: <BarChart />, path: '/student/progress' },
  { text: 'Challenges', icon: <Star />, path: '/student/evaluate' },
  { text: 'Certification', icon: <WorkspacePremium />, path: '/student/session' },
  { text: 'Project', icon: <Folder />, path: '/student/progress' },
  { text: 'Download', icon: <Download />, path: '/student/chatbot' },
]

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #f0f0f0',
        },
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 2,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Box sx={{ 
          width: 32, 
          height: 32, 
          backgroundColor: '#000000', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            S
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
          SkillUp
        </Typography>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ px: 2, py: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#f8f9fa',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: location.pathname === item.path ? '#000000' : '#666666'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiListItemText-primary': {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      color: location.pathname === item.path ? '#000000' : '#666666',
                      fontSize: '14px'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
      </Box>
    </Drawer>
  )
}

export default Sidebar
