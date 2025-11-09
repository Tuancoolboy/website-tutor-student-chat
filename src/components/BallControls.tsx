import React from 'react'

interface BallControlsProps {
  ballSize: number
  speed: number
  onSizeChange: (size: number) => void
  onSpeedChange: (speed: number) => void
  theme: 'dark' | 'light'
}

const BallControls: React.FC<BallControlsProps> = ({
  ballSize,
  speed,
  onSizeChange,
  onSpeedChange,
  theme
}) => {
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    } shadow-lg z-50`}>
      <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        Ball Controls
      </h3>
      
      <div className="space-y-3">
        {/* Size Control */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Size: {ballSize}px
          </label>
          <input
            type="range"
            min="20"
            max="100"
            value={ballSize}
            onChange={(e) => onSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(ballSize - 20) / 80 * 100}%, #e5e7eb ${(ballSize - 20) / 80 * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Speed Control */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(speed - 0.5) / 4.5 * 100}%, #e5e7eb ${(speed - 0.5) / 4.5 * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}

export default BallControls
