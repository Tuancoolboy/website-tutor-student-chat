import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Visibility,
  VisibilityOff,
  Email,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Close as CloseIcon,
  Badge,
  PersonAdd,
  Person,
  Lock as LockIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import MovingGif from '../../components/MovingGif'
import BallControls from '../../components/BallControls'
import api from '../../lib/api'

const Register: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // 'student' or 'tutor'
    agreeTerms: false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [ballSize, setBallSize] = useState(100)
  const [ballSpeed, setBallSpeed] = useState(1.8)
  const [showBallControls, setShowBallControls] = useState(false)
  const [showBall, setShowBall] = useState(false)
  const [showThemeSettings, setShowThemeSettings] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mainContentRef = useRef<HTMLDivElement>(null)
  const themeSettingsRef = useRef<HTMLDivElement>(null)
  const registerFormRef = useRef<HTMLDivElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Check password strength
  useEffect(() => {
    if (formData.password.length === 0) {
      setPasswordStrength('')
      return
    }
    
    const password = formData.password
    let strength = 0
    
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    
    if (strength <= 1) setPasswordStrength('weak')
    else if (strength <= 2) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }, [formData.password])

  // GSAP animations for theme settings
  useEffect(() => {
    if (showThemeSettings && themeSettingsRef.current) {
      gsap.fromTo(themeSettingsRef.current, 
        { 
          opacity: 0, 
          x: 100, 
          scale: 0.95 
        },
        { 
          opacity: 1, 
          x: 0, 
          scale: 1, 
          duration: 0.4, 
          ease: "back.out(1.7)" 
        }
      )
    }
  }, [showThemeSettings])

  // GSAP animation for theme switching
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'neo-brutalism') => {
    if (registerFormRef.current) {
      gsap.to(registerFormRef.current, {
        scale: 0.98,
        opacity: 0.8,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          setTheme(newTheme)
          gsap.to(registerFormRef.current, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
          })
        }
      })
    } else {
      setTheme(newTheme)
    }
  }

  // Neo-brutalism styling helpers
  const getNeoBrutalismStyles = () => {
    if (theme !== 'neo-brutalism') return {}
    
    return {
      container: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
        minHeight: '100vh'
      },
      card: {
        backgroundColor: '#ffffff',
        border: '4px solid #000000',
        borderRadius: '0px',
        boxShadow: '8px 8px 0px #000000'
      },
      button: {
        backgroundColor: '#ff6b6b',
        color: '#ffffff',
        border: '3px solid #000000',
        borderRadius: '0px',
        boxShadow: '4px 4px 0px #000000',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      },
      input: {
        backgroundColor: '#ffffff',
        border: '3px solid #000000',
        borderRadius: '0px',
        boxShadow: 'inset 2px 2px 0px #000000'
      },
      sidebar: {
        backgroundColor: '#4ecdc4',
        border: '4px solid #000000',
        boxShadow: '4px 4px 0px #000000'
      }
    }
  }

  // Update container size when window resizes
  useEffect(() => {
    const updateSize = () => {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp!')
      setLoading(false)
      return
    }
    
    if (!formData.agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản và Điều kiện')
      setLoading(false)
      return
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }
    
    try {
      console.log('Register attempt:', formData)
      const result = await api.auth.register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        role: formData.role
      })
      
      if (result.success) {
        const { user, token } = result.data
        
        // Save token and user info
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Navigate to appropriate dashboard based on user role
        if (formData.role === 'student') {
          navigate('/student')
        } else if (formData.role === 'tutor') {
          navigate('/tutor')
        } else {
          navigate('/management')
        }
      } else {
        setError(result.error || 'Đăng ký thất bại')
      }
    } catch (error: any) {
      console.error('Register error:', error)
      setError('Có lỗi xảy ra khi đăng ký: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const neoStyles = getNeoBrutalismStyles()

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div 
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : theme === 'neo-brutalism' ? '' : 'bg-gray-50'}`}
      style={theme === 'neo-brutalism' ? neoStyles.container : {}}
    >
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <div 
          className={`w-full lg:w-60 lg:min-w-[240px] h-auto lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : theme === 'neo-brutalism' ? '' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? '' : 'border-gray-200'} lg:block`}
          style={theme === 'neo-brutalism' ? neoStyles.sidebar : {}}
        >
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* User Roles */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                REGISTER AS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${
                    formData.role === 'student' 
                      ? 'bg-blue-100 text-blue-700' 
                      : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                  }`}
                >
                  <Person className="mr-3 w-4 h-4" />
                  Student
                </button>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, role: 'tutor' }))}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${
                    formData.role === 'tutor' 
                      ? 'bg-blue-100 text-blue-700' 
                      : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                  }`}
                >
                  <Badge className="mr-3 w-4 h-4" />
                  Tutor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={mainContentRef} className="flex-1 p-4 lg:p-6 xl:p-8 relative overflow-y-auto overflow-x-hidden max-h-screen">
          {/* Moving GIF */}
          {showBall && containerSize.width > 0 && containerSize.height > 0 && (
            <MovingGif
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              ballSize={ballSize}
              speed={ballSpeed}
              gifUrl="/tenor.gif"
            />
          )}

          {/* Ball Controls */}
          {showBall && showBallControls && (
            <BallControls
              ballSize={ballSize}
              speed={ballSpeed}
              onSizeChange={setBallSize}
              onSpeedChange={setBallSpeed}
              theme={theme === 'neo-brutalism' ? 'light' : theme}
            />
          )}

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              {/* Mobile Ball Toggle */}
              <button
                onClick={() => setShowBall(!showBall)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                title={`${showBall ? 'Hide' : 'Show'} Moving Ball`}
              >
                <div className={`w-4 h-4 rounded-full ${showBall ? (theme === 'dark' ? 'bg-blue-400' : theme === 'neo-brutalism' ? 'bg-black' : 'bg-blue-600') : (theme === 'dark' ? 'bg-gray-400' : theme === 'neo-brutalism' ? 'bg-white' : 'bg-gray-600')}`} />
              </button>

              {/* Mobile Theme Settings Toggle */}
              <button
                onClick={() => setShowThemeSettings(!showThemeSettings)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-purple-400 hover:bg-purple-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                title="Theme Settings"
              >
                <PaletteIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-600'}`} />
              </button>
              
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-pink-400 hover:bg-pink-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? <LightModeIcon className="w-6 h-6 text-yellow-400" /> : theme === 'neo-brutalism' ? <DarkModeIcon className="w-6 h-6 text-black" /> : <DarkModeIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex-shrink-0">
                <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create Your Account
                </h1>
                <p className={`text-base lg:text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join HCMUT community and start your learning journey
                </p>
              </div>
              
              {/* Control Buttons */}
              <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
                {/* Ball Toggle */}
                <button
                  onClick={() => setShowBall(!showBall)}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                  style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                  title={`${showBall ? 'Hide' : 'Show'} Moving Ball`}
                >
                  <div className={`w-5 h-5 rounded-full ${showBall ? (theme === 'dark' ? 'bg-blue-400' : theme === 'neo-brutalism' ? 'bg-black' : 'bg-blue-600') : (theme === 'dark' ? 'bg-gray-400' : theme === 'neo-brutalism' ? 'bg-white' : 'bg-gray-600')}`} />
                </button>
                
                {/* Ball Controls Toggle */}
                <button
                  onClick={() => setShowBallControls(!showBallControls)}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-green-400 hover:bg-green-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                  style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                  title={`${showBallControls ? 'Hide' : 'Show'} Ball Controls`}
                >
                  <SettingsIcon className={`w-5 h-5 ${showBallControls ? (theme === 'dark' ? 'text-blue-400' : theme === 'neo-brutalism' ? 'text-black' : 'text-blue-600') : (theme === 'dark' ? 'text-gray-400' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-600')}`} />
                </button>

                {/* Theme Settings Toggle */}
                <button
                  onClick={() => setShowThemeSettings(!showThemeSettings)}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-purple-400 hover:bg-purple-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                  style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                  title="Theme Settings"
                >
                  <PaletteIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-600'}`} />
                </button>
              
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'neo-brutalism' ? 'bg-pink-400 hover:bg-pink-500' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'neo-brutalism' ? 'border-4 border-black' : 'border-gray-200'} transition-colors`}
                  style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : theme === 'neo-brutalism' ? <DarkModeIcon className="w-5 h-5 text-black" /> : <DarkModeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Theme Settings Panel */}
          {showThemeSettings && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowThemeSettings(false)}
              />
              <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50" ref={themeSettingsRef}>
                <div 
                  className={`h-full p-6 border-l overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'neo-brutalism' ? 'bg-white' : 'bg-white border-gray-200'}`}
                  style={theme === 'neo-brutalism' ? neoStyles.card : {}}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                      Theme Settings
                    </h3>
                    <button
                      onClick={() => setShowThemeSettings(false)}
                      className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'neo-brutalism' ? 'hover:bg-gray-100' : 'hover:bg-gray-100'}`}
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                        theme === 'light' 
                          ? 'bg-blue-100 border-2 border-blue-300 text-blue-700' 
                          : theme === 'dark' 
                            ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600' 
                            : theme === 'neo-brutalism'
                              ? 'bg-blue-400 border-2 border-black text-white hover:bg-blue-500'
                              : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                    >
                      <div className="flex items-center">
                        <LightModeIcon className="w-6 h-6 mr-3" />
                        <div>
                          <div className="font-semibold">Light Mode</div>
                          <div className="text-sm opacity-75">Clean & minimal</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'bg-blue-100 border-2 border-blue-300 text-blue-700' 
                          : theme === 'light' 
                            ? 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200' 
                            : theme === 'neo-brutalism'
                              ? 'bg-gray-800 border-2 border-black text-white hover:bg-gray-700'
                              : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                    >
                      <div className="flex items-center">
                        <DarkModeIcon className="w-6 h-6 mr-3" />
                        <div>
                          <div className="font-semibold">Dark Mode</div>
                          <div className="text-sm opacity-75">Easy on the eyes</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('neo-brutalism')}
                      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                        theme === 'neo-brutalism' 
                          ? 'bg-yellow-400 border-2 border-black text-black' 
                          : theme === 'dark' 
                            ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600' 
                            : theme === 'light'
                              ? 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                              : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={theme === 'neo-brutalism' ? { boxShadow: '4px 4px 0px #000000' } : {}}
                    >
                      <div className="flex items-center">
                        <PaletteIcon className="w-6 h-6 mr-3" />
                        <div>
                          <div className="font-semibold">Neo-Brutalism</div>
                          <div className="text-sm opacity-75">Bold & vibrant</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Register Form */}
          <div className="w-full max-w-md mx-auto px-4 sm:px-0" ref={registerFormRef}>
            <Card 
              className={`p-6 sm:p-8 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'neo-brutalism' ? 'bg-white' : 'bg-white border-gray-200'}`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : theme === 'neo-brutalism' ? '#000000' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : theme === 'neo-brutalism' ? '#ffffff' : '#ffffff',
                boxShadow: theme === 'neo-brutalism' ? '8px 8px 0px #000000' : 'none',
                borderWidth: theme === 'neo-brutalism' ? '4px' : '1px',
                borderRadius: theme === 'neo-brutalism' ? '0px' : '8px',
                ...(theme !== 'neo-brutalism' && {
                  boxShadow: 'none',
                  borderWidth: '1px',
                  borderRadius: '8px',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                })
              }}
            >
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                {/* Full Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 pl-10 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg' 
                          : theme === 'neo-brutalism'
                            ? 'bg-white border-black text-black placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      style={theme === 'neo-brutalism' ? { 
                        borderWidth: '3px', 
                        borderRadius: '0px',
                        boxShadow: 'inset 2px 2px 0px #000000'
                      } : {
                        borderWidth: '1px',
                        borderRadius: '8px',
                        boxShadow: 'none'
                      }}
                      placeholder="Enter your full name"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Person className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 pl-10 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg' 
                          : theme === 'neo-brutalism'
                            ? 'bg-white border-black text-black placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      style={theme === 'neo-brutalism' ? { 
                        borderWidth: '3px', 
                        borderRadius: '0px',
                        boxShadow: 'inset 2px 2px 0px #000000'
                      } : {
                        borderWidth: '1px',
                        borderRadius: '8px',
                        boxShadow: 'none'
                      }}
                      placeholder="Enter your email"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Email className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                    I want to register as
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white rounded-lg' 
                        : theme === 'neo-brutalism'
                          ? 'bg-white border-black text-black'
                          : 'bg-white border-gray-300 text-gray-900 rounded-lg'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    style={theme === 'neo-brutalism' ? { 
                      borderWidth: '3px', 
                      borderRadius: '0px',
                      boxShadow: 'inset 2px 2px 0px #000000'
                    } : {
                      borderWidth: '1px',
                      borderRadius: '8px',
                      boxShadow: 'none'
                    }}
                  >
                    <option value="student">Student</option>
                    <option value="tutor">Tutor</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 pl-10 pr-10 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg' 
                          : theme === 'neo-brutalism'
                            ? 'bg-white border-black text-black placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      style={theme === 'neo-brutalism' ? { 
                        borderWidth: '3px', 
                        borderRadius: '0px',
                        boxShadow: 'inset 2px 2px 0px #000000'
                      } : {
                        borderWidth: '1px',
                        borderRadius: '8px',
                        boxShadow: 'none'
                      }}
                      placeholder="Create a password"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <LockIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <VisibilityOff className="w-5 h-5 text-gray-400" /> : <Visibility className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ 
                              width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' 
                            }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength === 'weak' ? 'text-red-500' : 
                          passwordStrength === 'medium' ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : theme === 'neo-brutalism' ? 'text-black' : 'text-gray-900'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 pl-10 pr-10 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg' 
                          : theme === 'neo-brutalism'
                            ? 'bg-white border-black text-black placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-500' 
                          : ''
                      }`}
                      style={theme === 'neo-brutalism' ? { 
                        borderWidth: '3px', 
                        borderRadius: '0px',
                        boxShadow: 'inset 2px 2px 0px #000000'
                      } : {
                        borderWidth: '1px',
                        borderRadius: '8px',
                        boxShadow: 'none'
                      }}
                      placeholder="Confirm your password"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <LockIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <VisibilityOff className="w-5 h-5 text-gray-400" /> : <Visibility className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-1 mr-2"
                    required
                  />
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    I agree to the{' '}
                    <button
                      type="button"
                      className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                    >
                      Terms and Conditions
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full ${theme === 'neo-brutalism' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={theme === 'neo-brutalism' ? { 
                    border: '3px solid #000000',
                    borderRadius: '0px',
                    boxShadow: '4px 4px 0px #000000',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  } : {
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    fontWeight: 'normal',
                    textTransform: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      <PersonAdd className="mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/common/login')}
                    className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 max-w-[85vw] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl overflow-y-auto`}>
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
                  </div>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    HCMUT
                  </span>
                </div>
                <button
                  onClick={handleDrawerToggle}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Roles */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  REGISTER AS
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: 'student' }))
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${
                      formData.role === 'student' 
                        ? 'bg-blue-100 text-blue-700' 
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <Person className="mr-3 w-4 h-4" />
                    Student
                  </button>
                  <button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: 'tutor' }))
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${
                      formData.role === 'tutor' 
                        ? 'bg-blue-100 text-blue-700' 
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <Badge className="mr-3 w-4 h-4" />
                    Tutor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register

