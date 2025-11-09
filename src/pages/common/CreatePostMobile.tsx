import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import Button from '../../components/ui/Button'
import { forumAPI, authAPI } from '../../lib/api'

const CreatePostMobile: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [] as string[],
    images: [] as string[]
  })
  
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string[]>([])

  const categories = [
    'General',
    'Programming',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Engineering',
    'Study Tips',
    'Questions',
    'Resources'
  ]

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await authAPI.getMe()
        if (response.success && response.data) {
          setCurrentUser(response.data)
        }
      } catch (error) {
        console.error('Failed to load current user:', error)
      }
    }
    loadCurrentUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file hình ảnh')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64String]
        }))
        setImagePreview(prev => [...prev, base64String])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      newErrors.title = 'Tiêu đề phải có ít nhất 5 ký tự'
    }

    if (!formData.content.trim() || formData.content.trim().length < 20) {
      newErrors.content = 'Nội dung phải có ít nhất 20 ký tự'
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!currentUser) {
      alert('Vui lòng đăng nhập để tạo bài viết')
      return
    }

    setLoading(true)

    try {
      const response = await forumAPI.posts.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        images: formData.images
      })

      if (response.success) {
        alert('Tạo bài viết thành công!')
        navigate('/common/forum')
      } else {
        alert('Lỗi: ' + (response.error || 'Không thể tạo bài viết'))
      }
    } catch (error: any) {
      console.error('Error creating post:', error)
      alert('Lỗi: ' + (error.message || 'Không thể tạo bài viết'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/common/forum')}
            className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <ArrowBackIcon className="w-6 h-6" />
          </button>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Tạo Bài Viết Mới
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Nhập tiêu đề bài viết (tối thiểu 5 ký tự)"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.title
                ? 'border-red-500'
                : theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Danh mục <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.category
                ? 'border-red-500'
                : theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Nội dung <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={10}
            placeholder="Nhập nội dung bài viết (tối thiểu 20 ký tự)"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.content
                ? 'border-red-500'
                : theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {formData.content.length} ký tự (tối thiểu 20 ký tự)
          </p>
        </div>

        {/* Images */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Hình ảnh (tùy chọn)
          </label>
          <div className="space-y-4">
            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Button */}
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            } transition-colors`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className={`w-10 h-10 mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-semibold">Click để upload</span>
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  PNG, JPG, GIF (Tối đa 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Tags (tùy chọn)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tag và nhấn Enter"
              className={`flex-1 px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              Thêm
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    theme === 'dark'
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Tạo Bài Viết'}
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/common/forum')}
            className={`px-6 py-3 ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreatePostMobile

