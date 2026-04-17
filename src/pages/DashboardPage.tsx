import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatVND } from '../lib/taxCalculator'
import { Spinner } from '../components/ui/Spinner'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  lastMonth: { thang: number; nam: number } | null
  lastMonthTax: number
  lastMonthCount: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [nvResult, lstResult] = await Promise.all([
        supabase.from('nhan_vien').select('nghi_viec'),
        supabase.from('lich_su_thue').select('thang, nam, thue_tncn').order('nam', { ascending: false }).order('thang', { ascending: false }).limit(50),
      ])

      const employees = nvResult.data ?? []
      const history = lstResult.data ?? []

      let lastMonth: { thang: number; nam: number } | null = null
      let lastMonthTax = 0
      let lastMonthCount = 0

      if (history.length > 0) {
        const { thang, nam } = history[0]
        lastMonth = { thang, nam }
        const forLastMonth = history.filter(h => h.thang === thang && h.nam === nam)
        lastMonthTax = forLastMonth.reduce((s, h) => s + h.thue_tncn, 0)
        lastMonthCount = forLastMonth.length
      }

      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => !e.nghi_viec).length,
        lastMonth,
        lastMonthTax,
        lastMonthCount,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tổng quan</h1>
      <p className="text-gray-500 text-sm mb-8">Phần mềm tính Thuế Thu Nhập Cá Nhân</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Tổng nhân viên"
          value={stats?.totalEmployees ?? 0}
          sub="trong hệ thống"
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Đang làm việc"
          value={stats?.activeEmployees ?? 0}
          sub="nhân viên hiện tại"
          icon="✅"
          color="green"
        />
        <StatCard
          title="Tháng gần nhất"
          value={stats?.lastMonth ? `T${stats.lastMonth.thang}/${stats.lastMonth.nam}` : '—'}
          sub={stats?.lastMonthCount ? `${stats.lastMonthCount} nhân viên` : 'Chưa có dữ liệu'}
          icon="📅"
          color="gray"
          isText
        />
        <StatCard
          title="Thuế tháng gần nhất"
          value={stats?.lastMonth ? formatVND(stats.lastMonthTax) : '—'}
          sub="tổng TNCN phải nộp"
          icon="💰"
          color="red"
          isText
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink to="/nhan-vien" title="Quản lý Nhân viên" desc="Thêm, sửa, xóa và import nhân viên từ Excel" icon="👤" />
        <QuickLink to="/nguoi-phu-thuoc" title="Người phụ thuộc" desc="Quản lý thông tin người phụ thuộc" icon="👨‍👩‍👧" />
        <QuickLink to="/tinh-thue" title="Tính thuế TNCN" desc="Import thu nhập và tính thuế hàng tháng" icon="🧮" />
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color, isText }: {
  title: string; value: string | number; sub: string; icon: string; color: string; isText?: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    gray: 'bg-gray-50 border-gray-100',
    red: 'bg-red-50 border-red-100',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`font-bold text-gray-900 mt-1 ${isText ? 'text-lg' : 'text-3xl'}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

function QuickLink({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <span className="text-2xl mb-3 block">{icon}</span>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  )
}
