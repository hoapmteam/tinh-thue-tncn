import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageSpinner } from '../ui/Spinner'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/dang-nhap" replace />
  return <>{children}</>
}
