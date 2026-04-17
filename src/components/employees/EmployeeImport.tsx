import { useState, useRef } from 'react'
import { parseExcelNhanVien } from '../../lib/excelParser'
import type { ExcelNhanVienRow } from '../../types'
import { Button } from '../ui/Button'

interface EmployeeImportProps {
  onImport: (rows: ExcelNhanVienRow[]) => Promise<void>
  onCancel: () => void
}

export function EmployeeImport({ onImport, onCancel }: EmployeeImportProps) {
  const [rows, setRows] = useState<ExcelNhanVienRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setParsing(true)
    try {
      const result = await parseExcelNhanVien(file)
      setRows(result.rows)
      setErrors(result.errors)
    } catch {
      setErrors(['Không đọc được file. Hãy kiểm tra lại định dạng Excel.'])
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true)
    try {
      await onImport(rows)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
        <p className="font-medium text-blue-800 mb-1">Yêu cầu định dạng file Excel:</p>
        <p>Các cột bắt buộc: <code className="bg-white px-1 rounded">MaNV</code>, <code className="bg-white px-1 rounded">HoTen</code></p>
        <p>Các cột tùy chọn: <code className="bg-white px-1 rounded">DonVi</code>, <code className="bg-white px-1 rounded">MaSoThue</code>, <code className="bg-white px-1 rounded">CCCD</code></p>
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {parsing ? (
          <p className="text-sm text-gray-500">Đang đọc file...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">Kéo thả file hoặc click để chọn</p>
            <p className="text-xs text-gray-400 mt-1">.xlsx, .xls</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700 mb-1">Lỗi ({errors.length}):</p>
          {errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
          {errors.length > 5 && <p className="text-xs text-red-500">... và {errors.length - 5} lỗi khác</p>}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Xem trước: <span className="text-blue-600">{rows.length} nhân viên</span>
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['Mã NV', 'Họ tên', 'Đơn vị', 'MST'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5">{r.MaNV}</td>
                    <td className="px-3 py-1.5">{r.HoTen}</td>
                    <td className="px-3 py-1.5">{r.DonVi ?? '-'}</td>
                    <td className="px-3 py-1.5">{r.MaSoThue ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button
          onClick={handleImport}
          loading={loading}
          disabled={rows.length === 0}
        >
          Import {rows.length > 0 ? `${rows.length} nhân viên` : ''}
        </Button>
      </div>
    </div>
  )
}
