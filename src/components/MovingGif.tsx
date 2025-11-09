import React, { useEffect, useRef, useState } from 'react'

interface MovingGifProps {
  containerWidth: number
  containerHeight: number
  ballSize?: number
  speed?: number
  gifUrl?: string
}

const MovingGif: React.FC<MovingGifProps> = ({
  containerWidth,
  containerHeight,
  ballSize = 100,
  speed = 2,
  gifUrl = '/tenor.gif'
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const positionRef = useRef({ x: 50, y: 50 })
  const velocityRef = useRef({ x: speed, y: speed })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Initialize position randomly
    positionRef.current = {
      x: Math.random() * (containerWidth - ballSize) + ballSize / 2,
      y: Math.random() * (containerHeight - ballSize) + ballSize / 2
    }

    const animate = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      if (!isDragging) {
        // Update position
        positionRef.current.x += velocityRef.current.x
        positionRef.current.y += velocityRef.current.y

        // Bounce off walls
        if (positionRef.current.x <= ballSize / 2 || positionRef.current.x >= containerWidth - ballSize / 2) {
          velocityRef.current.x = -velocityRef.current.x
          positionRef.current.x = positionRef.current.x <= ballSize / 2 ? ballSize / 2 : containerWidth - ballSize / 2
        }
        if (positionRef.current.y <= ballSize / 2 || positionRef.current.y >= containerHeight - ballSize / 2) {
          velocityRef.current.y = -velocityRef.current.y
          positionRef.current.y = positionRef.current.y <= ballSize / 2 ? ballSize / 2 : containerHeight - ballSize / 2
        }
      }

      // Update position of GIF element
      if (containerRef.current) {
        containerRef.current.style.left = `${positionRef.current.x - ballSize / 2}px`
        containerRef.current.style.top = `${positionRef.current.y - ballSize / 2}px`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [containerWidth, containerHeight, ballSize, isDragging, isPaused])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsPaused(true)
    setDragOffset({
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    positionRef.current.x = Math.max(ballSize / 2, Math.min(containerWidth - ballSize / 2, newX))
    positionRef.current.y = Math.max(ballSize / 2, Math.min(containerHeight - ballSize / 2, newY))
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setIsPaused(false)
      // Add some random velocity when released
      velocityRef.current.x = (Math.random() - 0.5) * speed * 2
      velocityRef.current.y = (Math.random() - 0.5) * speed * 2
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-auto"
      style={{
        width: `${ballSize}px`,
        height: `${ballSize}px`,
        zIndex: 1,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="w-full h-full rounded-full overflow-hidden"
        style={{
          background: `url(${gifUrl}) center/cover no-repeat`,
          border: '2px solid rgb(0, 0, 0)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      />
    </div>
  )
}

export default MovingGif
