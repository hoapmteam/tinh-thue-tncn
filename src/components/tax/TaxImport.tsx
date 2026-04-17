import { useState, useRef } from 'react'
import { parseExcelThuNhap } from '../../lib/excelParser'
import type { ExcelThuNhapRow } from '../../types'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

interface TaxImportProps {
  thang: number
  nam: number
  onThangNamChange: (thang: number, nam: number) => void
  onParsed: (rows: ExcelThuNhapRow[]) => void
}

const now = new Date()
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i)

export function TaxImport({ thang, nam, onThangNamChange, onParsed }: TaxImportProps) {
  const [parsing, setParsing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setParsing(true)
    setErrors([])
    try {
      const result = await parseExcelThuNhap(file)
      setErrors(result.errors)
      onParsed(result.rows)
    } catch {
      setErrors(['Không đọc được file. Hãy kiểm tra định dạng Excel.'])
      onParsed([])
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tháng"
          value={thang}
          onChange={e => onThangNamChange(Number(e.target.value), nam)}
        >
          {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </Select>
        <Select
          label="Năm"
          value={nam}
          onChange={e => onThangNamChange(thang, Number(e.target.value))}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <p className="font-medium text-gray-700 mb-1">Cột yêu cầu trong file Excel:</p>
        <p>Bắt buộc: <code className="bg-white px-1 rounded border">MaNV</code>, <code className="bg-white px-1 rounded border">TongThuNhap</code>, <code className="bg-white px-1 rounded border">KhacChiuThue</code>, <code className="bg-white px-1 rounded border">BaoHiem</code></p>
        <p className="mt-0.5">Tùy chọn: <code className="bg-white px-1 rounded border">HoTen</code>, <code className="bg-white px-1 rounded border">MaSoThue</code></p>
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
        ) : fileName ? (
          <p className="text-sm font-medium text-blue-600">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">Kéo thả hoặc click chọn file Excel</p>
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
          <p className="text-sm font-medium text-red-700 mb-1">Cảnh báo ({errors.length}):</p>
          {errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          Chọn file khác
        </Button>
      </div>
    </div>
  )
}
