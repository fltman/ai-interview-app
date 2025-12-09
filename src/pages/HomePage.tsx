import { Settings, Mic, Plus } from 'lucide-react'
import type { InterviewProfile } from '../types'

interface HomePageProps {
  onNavigate: (route: 'home' | 'settings' | 'interview') => void
  hasApiKey: boolean
  profiles: InterviewProfile[]
  onStartInterview: (profileId: string) => void
}

export default function HomePage({ onNavigate, hasApiKey, profiles, onStartInterview }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="pt-safe px-6 py-4 flex justify-between items-center">
        <div className="text-lg font-medium text-gray-400">AI Interview</div>
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      {/* Main content */}
      <main className="px-6 py-8">
        <div className="max-w-sm w-full mx-auto space-y-8">

          {/* Hero icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-2xl opacity-50" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold">Voice Interviews</h1>
            <p className="text-gray-400 text-lg">
              Choose an interview type to start
            </p>
          </div>

          {/* Profile buttons */}
          {hasApiKey ? (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => onStartInterview(profile.id)}
                  className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 border-0 text-lg text-white transition-all text-left flex items-center justify-between"
                >
                  <span>{profile.name}</span>
                  <span className="text-white/60 text-sm font-normal">
                    {profile.questions.length} questions
                  </span>
                </button>
              ))}

              {/* Add new profile button */}
              <button
                onClick={() => onNavigate('settings')}
                className="w-full py-3 px-6 rounded-xl font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Interview Type
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('settings')}
                className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 border-0 text-lg text-white transition-all"
              >
                Get Started
              </button>
              <p className="text-sm text-gray-500 text-center">
                Add your OpenAI API key to begin
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
    </div>
  )
}
