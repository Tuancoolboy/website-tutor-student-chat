import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

// GSAP Animation Utilities for Calendar Components

/**
 * Animate session card hover effects
 */
export const animateSessionCardHover = (element: HTMLElement, isHovering: boolean) => {
  if (isHovering) {
    gsap.to(element, {
      scale: 1.02,
      y: -2,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  } else {
    gsap.to(element, {
      scale: 1,
      y: 0,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  }
}

/**
 * Animate session card click (pulse effect)
 */
export const animateSessionCardClick = (element: HTMLElement) => {
  gsap.fromTo(element, 
    { scale: 1 },
    {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
      force3D: true
    }
  )
}

/**
 * Animate modal open (scale + fade in from center)
 */
export const animateModalOpen = (element: HTMLElement) => {
  gsap.fromTo(element, 
    {
      scale: 0.8,
      opacity: 0,
      y: 20
    },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      force3D: true
    }
  )
}

/**
 * Animate modal close (scale + fade out)
 */
export const animateModalClose = (element: HTMLElement, onComplete?: () => void) => {
  gsap.to(element, {
    scale: 0.8,
    opacity: 0,
    y: 20,
    duration: 0.3,
    ease: 'power2.in',
    force3D: true,
    onComplete
  })
}

/**
 * Animate week transition (smooth slide left/right)
 */
export const animateWeekTransition = (element: HTMLElement, direction: 'left' | 'right', onComplete?: () => void) => {
  const xOffset = direction === 'left' ? -100 : 100
  
  gsap.fromTo(element,
    {
      x: xOffset,
      opacity: 0
    },
    {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out',
      force3D: true,
      onComplete
    }
  )
}

/**
 * Animate filter panel open (slide in from right)
 */
export const animateFilterOpen = (element: HTMLElement) => {
  gsap.fromTo(element,
    {
      x: '100%',
      opacity: 0
    },
    {
      x: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power3.out',
      force3D: true
    }
  )
}

/**
 * Animate filter panel close (slide out to right)
 */
export const animateFilterClose = (element: HTMLElement, onComplete?: () => void) => {
  gsap.to(element, {
    x: '100%',
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    force3D: true,
    onComplete
  })
}

/**
 * Animate session appear (stagger animation when load sessions)
 */
export const animateSessionAppear = (elements: HTMLElement[]) => {
  gsap.fromTo(elements,
    {
      scale: 0.8,
      opacity: 0,
      y: 20
    },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      stagger: 0.1,
      force3D: true
    }
  )
}

/**
 * Animate calendar cell hover
 */
export const animateCalendarCellHover = (element: HTMLElement, isHovering: boolean) => {
  if (isHovering) {
    gsap.to(element, {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      duration: 0.2,
      ease: 'power2.out'
    })
  } else {
    gsap.to(element, {
      backgroundColor: 'transparent',
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

/**
 * Animate success feedback (for create/update operations)
 */
export const animateSuccessFeedback = (element: HTMLElement) => {
  gsap.fromTo(element,
    {
      scale: 0,
      opacity: 0
    },
    {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'back.out(1.7)',
      force3D: true,
      onComplete: () => {
        gsap.to(element, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          delay: 2,
          ease: 'power2.in'
        })
      }
    }
  )
}

/**
 * Animate loading state
 */
export const animateLoading = (element: HTMLElement) => {
  gsap.to(element, {
    rotation: 360,
    duration: 1,
    ease: 'none',
    repeat: -1,
    force3D: true
  })
}

/**
 * Animate swipe gesture for mobile
 */
export const animateSwipeGesture = (element: HTMLElement, direction: 'left' | 'right', distance: number) => {
  const xOffset = direction === 'left' ? -distance : distance
  
  gsap.to(element, {
    x: xOffset,
    duration: 0.3,
    ease: 'power2.out',
    force3D: true
  })
}

/**
 * Animate FAB button (for mobile add session)
 */
export const animateFABHover = (element: HTMLElement, isHovering: boolean) => {
  if (isHovering) {
    gsap.to(element, {
      scale: 1.1,
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  } else {
    gsap.to(element, {
      scale: 1,
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  }
}

/**
 * Animate form field focus
 */
export const animateFormFieldFocus = (element: HTMLElement, isFocused: boolean) => {
  if (isFocused) {
    gsap.to(element, {
      scale: 1.02,
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      duration: 0.2,
      ease: 'power2.out',
      force3D: true
    })
  } else {
    gsap.to(element, {
      scale: 1,
      boxShadow: '0 0 0 0px rgba(59, 130, 246, 0.1)',
      duration: 0.2,
      ease: 'power2.out',
      force3D: true
    })
  }
}

/**
 * Animate calendar grid entrance
 */
export const animateCalendarGridEntrance = (elements: HTMLElement[]) => {
  gsap.fromTo(elements,
    {
      opacity: 0,
      y: 30
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.05,
      force3D: true
    }
  )
}

/**
 * Animate time slot highlight
 */
export const animateTimeSlotHighlight = (element: HTMLElement, isHighlighted: boolean) => {
  if (isHighlighted) {
    gsap.to(element, {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      duration: 0.3,
      ease: 'power2.out'
    })
  } else {
    gsap.to(element, {
      backgroundColor: 'transparent',
      borderColor: '#e5e7eb',
      duration: 0.3,
      ease: 'power2.out'
    })
  }
}

/**
 * Custom hook for GSAP animations in React components
 */
export const useCalendarAnimations = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Set initial styles for performance
    gsap.set('.session-card', {
      willChange: 'transform, box-shadow'
    })
    
    gsap.set('.calendar-cell', {
      willChange: 'background-color, border-color'
    })

    // Cleanup on unmount
    return () => {
      gsap.killTweensOf('.session-card, .calendar-cell')
    }
  }, { scope: containerRef })

  return containerRef
}

/**
 * Animate session status change
 */
export const animateSessionStatusChange = (element: HTMLElement, newStatus: string) => {
  const statusColors = {
    scheduled: '#3b82f6',
    completed: '#10b981',
    cancelled: '#ef4444',
    rescheduled: '#f59e0b'
  }

  gsap.to(element, {
    backgroundColor: statusColors[newStatus as keyof typeof statusColors] || '#6b7280',
    duration: 0.5,
    ease: 'power2.out',
    force3D: true
  })
}

/**
 * Animate calendar header
 */
export const animateCalendarHeader = (element: HTMLElement) => {
  gsap.fromTo(element,
    {
      y: -20,
      opacity: 0
    },
    {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
      force3D: true
    }
  )
}

/**
 * Animate filter button active state
 */
export const animateFilterButtonActive = (element: HTMLElement, isActive: boolean) => {
  if (isActive) {
    gsap.to(element, {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  } else {
    gsap.to(element, {
      backgroundColor: 'transparent',
      color: 'inherit',
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
      force3D: true
    })
  }
}
