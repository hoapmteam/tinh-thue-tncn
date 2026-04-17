import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { DependentsPage } from './pages/DependentsPage'
import { TaxCalculationPage } from './pages/TaxCalculationPage'
import { TaxHistoryPage } from './pages/TaxHistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="nhan-vien" element={<EmployeesPage />} />
            <Route path="nguoi-phu-thuoc" element={<DependentsPage />} />
            <Route path="tinh-thue" element={<TaxCalculationPage />} />
            <Route path="lich-su-thue" element={<TaxHistoryPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
