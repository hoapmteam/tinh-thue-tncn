import { useState, useCallback } from 'react'
import type { ExcelThuNhapRow, TaxCalculationResult, NhanVien } from '../types'
import { useNhanVien } from '../hooks/useNhanVien'
import { useNguoiPhuThuoc } from '../hooks/useNguoiPhuThuoc'
import { useLichSuThue } from '../hooks/useLichSuThue'
import { tinhThueTNCN, demNguoiPhuThuocHopLe, formatVND } from '../lib/taxCalculator'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { TaxImport } from '../components/tax/TaxImport'

const now = new Date()

export function TaxCalculationPage() {
  const { fetchAll } = useNhanVien()
  const { fetchByEmployees } = useNguoiPhuThuoc()
  const { saveResults, loading: saving } = useLichSuThue()
  const { showToast } = useToast()

  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [step, setStep] = useState<'import' | 'preview' | 'done'>('import')
  const [results, setResults] = useState<TaxCalculationResult[]>([])
  const [calculating, setCalculating] = useState(false)

  const handleParsed = useCallback(async (rows: ExcelThuNhapRow[]) => {
    if (rows.length === 0) return

    setCalculating(true)
    try {
      const allEmployees: NhanVien[] = await fetchAll(false)
      const empMap = new Map(allEmployees.map(e => [e.ma_nv, e]))
      const matchedIds = rows.map(r => empMap.get(r.MaNV)?.id).filter(Boolean) as string[]
      const allNPT = await fetchByEmployees(matchedIds)

      const nptByEmp = new Map<string, typeof allNPT>()
      allNPT.forEach(npt => {
        const list = nptByEmp.get(npt.nhan_vien_id) ?? []
        list.push(npt)
        nptByEmp.set(npt.nhan_vien_id, list)
      })

      const computed: TaxCalculationResult[] = rows.map(row => {
        const emp = empMap.get(row.MaNV)
        if (!emp) {
          return {
            nhan_vien_id: '',
            ma_nv: row.MaNV,
            ho_ten: row.HoTen,
            thang,
            nam,
            tong_thu_nhap: row.TongThuNhap,
            khac_chiu_thue: row.KhacChiuThue,
            bao_hiem: row.BaoHiem,
            so_nguoi_phu_thuoc: 0,
            giam_tru_ban_than: 11_000_000,
            giam_tru_phu_thuoc: 0,
            thu_nhap_chiu_thue: row.TongThuNhap - row.KhacChiuThue - row.BaoHiem,
            thu_nhap_tinh_thue: 0,
            thue_tncn: 0,
            chi_tiet_bac_thue: [],
            warning: 'Không tìm thấy nhân viên trong hệ thống',
          }
        }
        const nptList = nptByEmp.get(emp.id) ?? []
        const soNPT = demNguoiPhuThuocHopLe(nptList, thang, nam)
        return {
          ma_nv: emp.ma_nv,
          ho_ten: emp.ho_ten,
          warning: undefined,
          ...tinhThueTNCN(row, emp.id, soNPT, thang, nam),
        }
      })

      setResults(computed)
      setStep('preview')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi tính thuế', 'error')
    } finally {
      setCalculating(false)
    }
  }, [thang, nam, fetchAll, fetchByEmployees, showToast])

  async function handleSave() {
    const valid = results.filter(r => r.nhan_vien_id)
    try {
      await saveResults(valid, thang, nam)
      showToast(`Đã lưu kết quả thuế tháng ${thang}/${nam} cho ${valid.length} nhân viên`, 'success')
      setStep('done')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi lưu kết quả', 'error')
    }
  }

  if (step === 'done') {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Đã lưu thành công!</h2>
          <p className="text-green-700 mb-6">Kết quả thuế tháng {thang}/{nam} đã được lưu vào hệ thống.</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => { setStep('import'); setResults([]) }}>
              Tính tháng khác
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tính thuế TNCN</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { key: 'import', label: '1. Import dữ liệu' },
          { key: 'preview', label: '2. Xem kết quả' },
        ].map(s => (
          <div key={s.key} className={`text-sm font-medium ${step === s.key ? 'text-blue-600' : 'text-gray-400'}`}>
            {s.label}
          </div>
        ))}
      </div>

      {step === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <TaxImport
              thang={thang}
              nam={nam}
              onThangNamChange={(t, n) => { setThang(t); setNam(n) }}
              onParsed={handleParsed}
            />
            {calculating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <Spinner size="sm" />
                <span className="text-sm">Đang tính thuế...</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 text-sm mb-3">Định dạng file Excel</h3>
              <p className="text-xs text-blue-700 mb-3">File cần có các cột (tên cột không phân biệt hoa/thường):</p>
              <div className="bg-white rounded-lg border border-blue-200 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên cột</th>
                      <th className="px-3 py-2 text-left">Ý nghĩa</th>
                      <th className="px-3 py-2 text-center">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {[
                      { col: 'MaNV', desc: 'Mã nhân viên', req: true },
                      { col: 'HoTen', desc: 'Họ và tên', req: true },
                      { col: 'TongThuNhap', desc: 'Tổng thu nhập (VND)', req: true },
                      { col: 'KhacChiuThue', desc: 'Khoản không chịu thuế', req: false },
                      { col: 'BaoHiem', desc: 'Bảo hiểm (BHXH, BHYT...)', req: false },
                    ].map(r => (
                      <tr key={r.col} className="text-gray-700">
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{r.col}</td>
                        <td className="px-3 py-2">{r.desc}</td>
                        <td className="px-3 py-2 text-center">{r.req ? <span className="text-red-500">✓</span> : <span className="text-gray-400">–</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">Ví dụ dữ liệu trong file</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      {['MaNV', 'HoTen', 'TongThuNhap', 'KhacChiuThue', 'BaoHiem'].map(h => (
                        <th key={h} className="px-2 py-2 text-left font-mono text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="text-gray-600">
                      <td className="px-2 py-1.5">NV001</td>
                      <td className="px-2 py-1.5">Nguyễn Văn An</td>
                      <td className="px-2 py-1.5">25000000</td>
                      <td className="px-2 py-1.5">0</td>
                      <td className="px-2 py-1.5">1750000</td>
                    </tr>
                    <tr className="text-gray-600 bg-gray-50/50">
                      <td className="px-2 py-1.5">NV002</td>
                      <td className="px-2 py-1.5">Trần Thị Bích</td>
                      <td className="px-2 py-1.5">40000000</td>
                      <td className="px-2 py-1.5">0</td>
                      <td className="px-2 py-1.5">2800000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
              <ul className="space-y-1">
                <li>• Mã NV phải khớp với mã trong danh sách nhân viên</li>
                <li>• Số tiền nhập theo đơn vị <strong>đồng</strong>, không dùng dấu phẩy/chấm</li>
                <li>• Người phụ thuộc đã khai báo sẽ được tự động tính vào giảm trừ</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">
                  Kết quả tính thuế tháng {thang}/{nam}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{results.length} bản ghi</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep('import')}>← Nhập lại</Button>
                <Button onClick={handleSave} loading={saving}>Lưu kết quả</Button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Mã NV', 'Họ tên', 'Tổng TN', 'Không CT', 'Bảo hiểm', 'NPT', 'TN tính thuế', 'Thuế TNCN', ''].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${r.warning ? 'bg-yellow-50' : ''}`}>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{r.ma_nv}</td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {r.ho_ten}
                      {r.warning && (
                        <Badge variant="warning" >{r.warning}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatVND(r.tong_thu_nhap)}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{formatVND(r.khac_chiu_thue)}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{formatVND(r.bao_hiem)}</td>
                    <td className="px-3 py-3 text-center text-gray-700">{r.so_nguoi_phu_thuoc}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatVND(r.thu_nhap_tinh_thue)}</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-700">{formatVND(r.thue_tncn)}</td>
                    <td className="px-3 py-3"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-right font-semibold text-gray-700">Tổng thuế TNCN:</td>
                  <td className="px-3 py-3 text-right font-bold text-blue-800 text-base">
                    {formatVND(results.reduce((s, r) => s + r.thue_tncn, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
