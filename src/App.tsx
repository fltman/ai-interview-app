import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import InterviewPage from './pages/InterviewPage'
import { ToastProvider } from './components/ui/Toast'
import type { RouteType, AppSettings, InterviewProfile } from './types'
import { DEFAULT_APP_SETTINGS, DEFAULT_PROFILE, STORAGE_KEYS, profileToSettings } from './types'

function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteType>('home')
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setAppSettings(parsed)
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    } else {
      // Migrate from old settings format if exists
      const oldSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (oldSettings) {
        try {
          const parsed = JSON.parse(oldSettings)
          const migratedSettings: AppSettings = {
            apiKey: parsed.apiKey || '',
            profiles: [{
              id: 'migrated',
              name: 'My Interview',
              voice: parsed.voice || 'alloy',
              systemPrompt: parsed.systemPrompt || DEFAULT_PROFILE.systemPrompt,
              questions: parsed.questions || DEFAULT_PROFILE.questions,
              documentTemplate: parsed.documentTemplate || DEFAULT_PROFILE.documentTemplate,
              documentLanguage: parsed.documentLanguage || '',
              language: parsed.language || 'en-US',
              targetLanguage: parsed.targetLanguage,
              documentFormat: parsed.documentFormat || 'pdf',
            }],
            activeProfileId: 'migrated',
          }
          setAppSettings(migratedSettings)
          localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(migratedSettings))
        } catch (error) {
          console.error('Failed to migrate old settings:', error)
        }
      }
    }
    setIsLoading(false)
  }, [])

  // Save app settings to localStorage
  const handleSaveAppSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings)
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(newSettings))
  }

  // Save API key
  const handleSaveApiKey = (apiKey: string) => {
    const newSettings = { ...appSettings, apiKey }
    handleSaveAppSettings(newSettings)
  }

  // Save profile
  const handleSaveProfile = (profile: InterviewProfile) => {
    const existingIndex = appSettings.profiles.findIndex(p => p.id === profile.id)
    let newProfiles: InterviewProfile[]

    if (existingIndex >= 0) {
      newProfiles = [...appSettings.profiles]
      newProfiles[existingIndex] = profile
    } else {
      newProfiles = [...appSettings.profiles, profile]
    }

    handleSaveAppSettings({ ...appSettings, profiles: newProfiles })
  }

  // Delete profile
  const handleDeleteProfile = (profileId: string) => {
    if (appSettings.profiles.length <= 1) return // Keep at least one profile
    const newProfiles = appSettings.profiles.filter(p => p.id !== profileId)
    handleSaveAppSettings({ ...appSettings, profiles: newProfiles })
  }

  // Start interview with specific profile
  const handleStartInterview = (profileId: string) => {
    setSelectedProfileId(profileId)
    setCurrentRoute('interview')
  }

  // Get current profile for interview (with fallback to default)
  const getProfile = (): InterviewProfile => {
    if (selectedProfileId) {
      const found = appSettings.profiles.find(p => p.id === selectedProfileId)
      if (found) return found
    }
    return appSettings.profiles[0] || DEFAULT_PROFILE
  }
  const currentProfile = getProfile()

  // Convert to Settings for compatibility with existing components
  const currentSettings = profileToSettings(currentProfile, appSettings.apiKey)

  // Check if API key is configured
  const hasApiKey = appSettings.apiKey.length > 0

  // Show loading screen while settings load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-violet-900 border-t-violet-400 rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="app">
        {currentRoute === 'home' && (
          <HomePage
            onNavigate={setCurrentRoute}
            hasApiKey={hasApiKey}
            profiles={appSettings.profiles}
            onStartInterview={handleStartInterview}
          />
        )}
        {currentRoute === 'settings' && (
          <SettingsPage
            onNavigate={setCurrentRoute}
            apiKey={appSettings.apiKey}
            profiles={appSettings.profiles}
            onSaveApiKey={handleSaveApiKey}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        )}
        {currentRoute === 'interview' && (
          <InterviewPage
            onNavigate={setCurrentRoute}
            settings={currentSettings}
          />
        )}
      </div>
    </ToastProvider>
  )
}

export default App
