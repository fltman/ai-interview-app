import { ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { InterviewProfile, VoiceOption, DocumentFormat } from '../types'
import { DEFAULT_PROFILE, VOICE_OPTIONS } from '../types'
import { Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { AssistantButton, SettingsAssistant } from '../components/settings'
import { useSettingsAssistant } from '../hooks/useSettingsAssistant'

interface SettingsPageProps {
  onNavigate: (route: 'home' | 'settings' | 'interview') => void
  apiKey: string
  profiles: InterviewProfile[]
  onSaveApiKey: (apiKey: string) => void
  onSaveProfile: (profile: InterviewProfile) => void
  onDeleteProfile: (profileId: string) => void
}

export default function SettingsPage({
  onNavigate,
  apiKey,
  profiles,
  onSaveApiKey,
  onSaveProfile,
  onDeleteProfile,
}: SettingsPageProps) {
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [editingProfile, setEditingProfile] = useState<InterviewProfile | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const { success, error: showError } = useToast()

  // Settings assistant for voice-guided configuration
  const assistant = useSettingsAssistant((suggestedSettings) => {
    if (editingProfile) {
      setEditingProfile({
        ...editingProfile,
        ...suggestedSettings,
      })
      setShowAssistant(false)
      success('Settings applied!')
    }
  })

  const handleStartAssistant = async () => {
    if (!apiKey) {
      showError('Add your API key first')
      return
    }
    try {
      setShowAssistant(true)
      await assistant.startAssistant(apiKey)
    } catch {
      showError('Could not start assistant')
      setShowAssistant(false)
    }
  }

  const handleSaveApiKey = () => {
    onSaveApiKey(localApiKey)
    success('API key saved!')
  }

  const handleCreateProfile = () => {
    const newProfile: InterviewProfile = {
      ...DEFAULT_PROFILE,
      id: Date.now().toString(),
      name: 'New Interview',
    }
    setEditingProfile(newProfile)
  }

  const handleSaveProfile = () => {
    if (editingProfile) {
      onSaveProfile(editingProfile)
      setEditingProfile(null)
      success('Profile saved!')
    }
  }

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      return
    }
    if (window.confirm('Delete this interview type?')) {
      onDeleteProfile(profileId)
      success('Profile deleted')
    }
  }

  const addQuestion = () => {
    if (!editingProfile) return
    const newQuestion = {
      id: Date.now().toString(),
      text: '',
      order: editingProfile.questions.length + 1,
    }
    setEditingProfile({
      ...editingProfile,
      questions: [...editingProfile.questions, newQuestion],
    })
  }

  const removeQuestion = (id: string) => {
    if (!editingProfile) return
    setEditingProfile({
      ...editingProfile,
      questions: editingProfile.questions.filter(q => q.id !== id),
    })
  }

  const updateQuestion = (id: string, text: string) => {
    if (!editingProfile) return
    setEditingProfile({
      ...editingProfile,
      questions: editingProfile.questions.map(q =>
        q.id === id ? { ...q, text } : q
      ),
    })
  }

  // Profile edit view
  if (editingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="pt-safe px-4 py-4 border-b border-gray-800 sticky top-0 z-10 bg-gray-950/95 backdrop-blur">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={() => setEditingProfile(null)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-lg font-medium text-gray-200">Edit Profile</h1>
            <Button
              onClick={handleSaveProfile}
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              className="bg-violet-600 hover:bg-violet-700 border-0"
            >
              Save
            </Button>
          </div>
        </header>

        {/* Profile edit form */}
        <main className="px-4 py-6 pb-safe">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Voice Assistant Button */}
            <div className="flex justify-center">
              <AssistantButton
                onClick={handleStartAssistant}
                disabled={!apiKey}
              />
            </div>

            {/* Profile Name */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Profile Name</h2>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <Input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="e.g. Customer Interview, Exit Interview..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
            </section>

            {/* Voice */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Voice</h2>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <Select
                  label="AI Voice"
                  value={editingProfile.voice}
                  onChange={(e) => setEditingProfile({ ...editingProfile, voice: e.target.value as VoiceOption })}
                  options={VOICE_OPTIONS}
                />
              </div>
            </section>

            {/* System Prompt */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Prompt</h2>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <Textarea
                  value={editingProfile.systemPrompt}
                  onChange={(e) => setEditingProfile({ ...editingProfile, systemPrompt: e.target.value })}
                  rows={4}
                  placeholder="Instructions for the AI interviewer..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
            </section>

            {/* Questions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Questions</h2>
                <Button
                  onClick={addQuestion}
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                >
                  Add
                </Button>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
                {editingProfile.questions.map((question, index) => (
                  <div key={question.id} className="flex gap-2 items-center">
                    <div className="cursor-move touch-manipulation text-gray-600">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                    <Input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, e.target.value)}
                      placeholder="Enter your question..."
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 flex-1"
                    />
                    <button
                      onClick={() => removeQuestion(question.id)}
                      disabled={editingProfile.questions.length === 1}
                      className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Document Settings */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Document</h2>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
                <Select
                  label="Format"
                  value={editingProfile.documentFormat}
                  onChange={(e) => setEditingProfile({ ...editingProfile, documentFormat: e.target.value as DocumentFormat })}
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'markdown', label: 'Markdown' },
                    { value: 'text', label: 'Plain Text' },
                  ]}
                />
                <Input
                  type="text"
                  label="Output Language"
                  value={editingProfile.documentLanguage}
                  onChange={(e) => setEditingProfile({ ...editingProfile, documentLanguage: e.target.value })}
                  placeholder="e.g. English, Swedish, Spanish..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  helperText="Leave empty to use the interview language"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template</label>
                  <Textarea
                    value={editingProfile.documentTemplate}
                    onChange={(e) => setEditingProfile({ ...editingProfile, documentTemplate: e.target.value })}
                    rows={6}
                    className="font-mono text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    placeholder="Markdown template..."
                  />
                </div>
              </div>
            </section>

            {/* Delete profile */}
            {profiles.length > 1 && profiles.find(p => p.id === editingProfile.id) && (
              <button
                onClick={() => {
                  handleDeleteProfile(editingProfile.id)
                  setEditingProfile(null)
                }}
                className="w-full py-3 px-4 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
              >
                Delete This Profile
              </button>
            )}
          </div>
        </main>

        {/* Voice Assistant Modal */}
        {showAssistant && (
          <SettingsAssistant
            isOpen={showAssistant}
            onClose={() => {
              assistant.stopAssistant()
              setShowAssistant(false)
            }}
            phase={assistant.phase}
            transcript={assistant.transcript}
            isActive={assistant.isActive}
            hasSettings={assistant.suggestedSettings !== null}
            onApplySettings={assistant.applySettings}
            error={assistant.error}
          />
        )}
      </div>
    )
  }

  // Main settings view (profile list + API key)
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="pt-safe px-4 py-4 border-b border-gray-800 sticky top-0 z-10 bg-gray-950/95 backdrop-blur">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h1 className="text-lg font-medium text-gray-200">Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6 pb-safe">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* API Key */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">API Key</h2>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
              <Input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Stored locally, only sent to OpenAI
                </p>
                <Button
                  onClick={handleSaveApiKey}
                  variant="primary"
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 border-0"
                >
                  Save Key
                </Button>
              </div>
            </div>
          </section>

          {/* Interview Types */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Interview Types</h2>
              <Button
                onClick={handleCreateProfile}
                variant="secondary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
              >
                New
              </Button>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setEditingProfile(profile)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-gray-200">{profile.name}</div>
                    <div className="text-sm text-gray-500">
                      {profile.questions.length} questions · {profile.voice} voice
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
