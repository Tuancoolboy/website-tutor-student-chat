import React, { useState } from 'react'
import '../styles/weather-animations.css'

const WeatherEffectsDemo: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState('clear')

  const weatherOptions = [
    { value: 'clear', label: 'Sunny ☀️', description: 'Clear sky with animated sun' },
    { value: 'clouds', label: 'Cloudy ☁️', description: 'Cloudy sky with floating clouds' },
    { value: 'rain', label: 'Rainy 🌧️', description: 'Rainy weather with falling drops' },
    { value: 'snow', label: 'Snowy ❄️', description: 'Snowy weather with falling flakes' }
  ]

  const getWeatherBackground = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return 'weather-sunny'
      case 'clouds':
        return 'weather-cloudy'
      case 'rain':
        return 'weather-rainy'
      case 'snow':
        return 'weather-snowy'
      default:
        return 'weather-sunny'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Weather Effects Demo</h1>
        
        {/* Weather Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose Weather Condition:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {weatherOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setCurrentWeather(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentWeather === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Weather Widget Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Weather Widget:</h2>
          <div className={`rounded-xl p-6 shadow-lg relative overflow-hidden bg-white border border-gray-200 ${getWeatherBackground(currentWeather)}`}>
            {/* Weather Background Effects */}
            <>
              {/* Sunny Effect */}
              {currentWeather === 'clear' && (
                <div className="absolute inset-0 opacity-20">
                  <div className="sun-animation absolute top-4 right-4 w-16 h-16 bg-yellow-400 rounded-full"></div>
                  <div className="sun-rays absolute top-0 right-0 w-20 h-20">
                    <div className="ray ray-1"></div>
                    <div className="ray ray-2"></div>
                    <div className="ray ray-3"></div>
                    <div className="ray ray-4"></div>
                    <div className="ray ray-5"></div>
                    <div className="ray ray-6"></div>
                    <div className="ray ray-7"></div>
                    <div className="ray ray-8"></div>
                  </div>
                </div>
              )}
              
              {/* Cloudy Effect */}
              {currentWeather === 'clouds' && (
                <div className="absolute inset-0 opacity-30">
                  <div className="cloud cloud-1"></div>
                  <div className="cloud cloud-2"></div>
                  <div className="cloud cloud-3"></div>
                </div>
              )}
              
              {/* Rainy Effect */}
              {currentWeather === 'rain' && (
                <div className="absolute inset-0 opacity-40">
                  <div className="rain">
                    <div className="drop drop-1"></div>
                    <div className="drop drop-2"></div>
                    <div className="drop drop-3"></div>
                    <div className="drop drop-4"></div>
                    <div className="drop drop-5"></div>
                    <div className="drop drop-6"></div>
                    <div className="drop drop-7"></div>
                    <div className="drop drop-8"></div>
                    <div className="drop drop-9"></div>
                    <div className="drop drop-10"></div>
                  </div>
                </div>
              )}
              
              {/* Snowy Effect */}
              {currentWeather === 'snow' && (
                <div className="absolute inset-0 opacity-30">
                  <div className="snow">
                    <div className="flake flake-1"></div>
                    <div className="flake flake-2"></div>
                    <div className="flake flake-3"></div>
                    <div className="flake flake-4"></div>
                    <div className="flake flake-5"></div>
                    <div className="flake flake-6"></div>
                  </div>
                </div>
              )}
            </>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
              {/* Time Section */}
              <div className="flex-1 mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Current Time</span>
                </div>
                <div className="text-3xl lg:text-4xl font-bold mb-1 font-mono text-gray-900">
                  09:47:40
                </div>
                <div className="text-lg mb-2 text-gray-600">
                  Thứ Ba, 14 tháng 10, 2025
                </div>
                <div className="text-sm text-gray-500">
                  Good Morning, User
                </div>
              </div>

              {/* Weather Section */}
              <div className="flex-1 lg:ml-8">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Ho Chi Minh City</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-2">
                      {currentWeather === 'clear' && '☀️'}
                      {currentWeather === 'clouds' && '☁️'}
                      {currentWeather === 'rain' && '🌧️'}
                      {currentWeather === 'snow' && '❄️'}
                    </div>
                    <div>
                      <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {currentWeather === 'clear' && '30°C'}
                        {currentWeather === 'clouds' && '25°C'}
                        {currentWeather === 'rain' && '22°C'}
                        {currentWeather === 'snow' && '0°C'}
                      </div>
                      <div className="text-sm capitalize text-gray-600">
                        {currentWeather === 'clear' && 'Clear Sky'}
                        {currentWeather === 'clouds' && 'Cloudy'}
                        {currentWeather === 'rain' && 'Light Rain'}
                        {currentWeather === 'snow' && 'Snow'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Humidity: 75%</div>
                    <div>Feels like: 32°C</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How it works:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Sunny:</strong> Animated sun with rotating rays and pulsing effect</li>
            <li><strong>Cloudy:</strong> Floating clouds with gentle movement</li>
            <li><strong>Rainy:</strong> Falling rain drops with realistic animation</li>
            <li><strong>Snowy:</strong> Falling snow flakes with gentle drift</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            All effects are created using pure CSS animations and are automatically applied based on real weather data from the API.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WeatherEffectsDemo
