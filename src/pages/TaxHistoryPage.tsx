import { useState, useEffect, useCallback } from 'react'
import type { LichSuThue } from '../types'
import { useLichSuThue } from '../hooks/useLichSuThue'
import { formatVND } from '../lib/taxCalculator'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { TaxBreakdownModal } from '../components/tax/TaxBreakdownModal'

const now = new Date()
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i)

export function TaxHistoryPage() {
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [records, setRecords] = useState<LichSuThue[]>([])
  const [selected, setSelected] = useState<LichSuThue | null>(null)
  const [search, setSearch] = useState('')
  const { loading, fetchByThangNam } = useLichSuThue()

  const load = useCallback(async () => {
    const data = await fetchByThangNam(thang, nam)
    setRecords(data)
  }, [thang, nam, fetchByThangNam])

  useEffect(() => { load() }, [load])

  const filtered = records.filter(r => {
    const nv = r.nhan_vien
    return !search ||
      nv?.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
      nv?.ma_nv.toLowerCase().includes(search.toLowerCase())
  })

  const totalTax = filtered.reduce((s, r) => s + r.thue_tncn, 0)
  const totalIncome = filtered.reduce((s, r) => s + r.tong_thu_nhap, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử thuế TNCN</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 items-end">
          <Select
            label="Tháng"
            value={thang}
            onChange={e => setThang(Number(e.target.value))}
          >
            {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </Select>
          <Select
            label="Năm"
            value={nam}
            onChange={e => setNam(Number(e.target.value))}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={load} variant="secondary">Xem</Button>
        </div>
        <div className="flex-1 min-w-48 flex items-end">
          <input
            type="text"
            placeholder="Tìm theo tên, mã nhân viên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard title="Số nhân viên" value={`${filtered.length} người`} color="blue" />
          <SummaryCard title="Tổng thu nhập" value={formatVND(totalIncome)} color="gray" />
          <SummaryCard title="Tổng thuế TNCN" value={formatVND(totalTax)} color="red" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Không có dữ liệu cho tháng {thang}/{nam}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Mã NV', 'Họ tên', 'Đơn vị', 'Tổng thu nhập', 'Giảm trừ', 'TN tính thuế', 'NPT', 'Thuế TNCN', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.nhan_vien?.ma_nv}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.nhan_vien?.ho_ten}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.nhan_vien?.don_vi ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatVND(r.tong_thu_nhap)}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatVND(r.giam_tru_ban_than + r.giam_tru_phu_thuoc + r.bao_hiem + r.khac_chiu_thue)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatVND(r.thu_nhap_tinh_thue)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.so_nguoi_phu_thuoc}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{formatVND(r.thue_tncn)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-right font-semibold text-gray-700">Tổng:</td>
                <td className="px-4 py-3 text-right font-bold text-blue-800">{formatVND(totalTax)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <TaxBreakdownModal record={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function SummaryCard({ title, value, color }: { title: string; value: string; color: 'blue' | 'gray' | 'red' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-50 text-gray-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
