import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'neo-brutalism'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as Theme) || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    const body = document.body
    
    // Check if DOM elements exist
    if (!root || !body) {
      return
    }
    
    // Toggle dark mode class
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('neo-brutalism', theme === 'neo-brutalism')
    
    // Set background colors to prevent flash
    if (theme === 'dark') {
      root.style.backgroundColor = '#111827' // bg-gray-900
      body.style.backgroundColor = '#111827'
    } else {
      root.style.backgroundColor = '#f9fafb' // bg-gray-50
      body.style.backgroundColor = '#f9fafb'
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
