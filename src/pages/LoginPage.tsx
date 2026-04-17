import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Tab = 'login' | 'register'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  function resetForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMsg('')
  }

  function switchTab(t: Tab) {
    setTab(t)
    resetForm()
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('Email hoặc mật khẩu không đúng')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // Sign out immediately so auto-session doesn't redirect to dashboard
      await supabase.auth.signOut()

      setTab('login')
      setSuccessMsg('Tạo tài khoản thành công! Vui lòng đăng nhập.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại, thử lại'
      setError(msg === 'User already registered' ? 'Email này đã được đăng ký' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 pt-8 pb-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Tính Thuế TNCN</h1>
            <p className="text-blue-100 text-xs mt-1">Phần mềm kế toán thuế thu nhập cá nhân</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${tab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${tab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đăng ký
            </button>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ketoan@congty.com"
                  required
                  autoFocus
                />
                <Input
                  label="Mật khẩu"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                {successMsg && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                    {successMsg}
                  </div>
                )}
                {error && <ErrorBox message={error} />}
                <Button type="submit" loading={submitting} className="w-full justify-center py-2.5">
                  Đăng nhập
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => switchTab('register')}
                    className="text-blue-600 hover:underline font-medium">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ketoan@congty.com"
                  required
                  autoFocus
                />
                <Input
                  label="Mật khẩu"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                />
                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                {error && <ErrorBox message={error} />}
                {successMsg && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                    {successMsg}
                  </div>
                )}
                <Button type="submit" loading={submitting} className="w-full justify-center py-2.5">
                  Tạo tài khoản
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Đã có tài khoản?{' '}
                  <button type="button" onClick={() => switchTab('login')}
                    className="text-blue-600 hover:underline font-medium">
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Phần mềm Tính Thuế Thu Nhập Cá Nhân theo Luật Thuế Việt Nam
        </p>
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
