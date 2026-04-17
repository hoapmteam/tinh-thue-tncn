import * as XLSX from 'xlsx'
import type { ExcelNhanVienRow, ExcelThuNhapRow } from '../types'

function docFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const wb = XLSX.read(data, { type: 'binary' })
      resolve(wb)
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

export async function parseExcelNhanVien(file: File): Promise<{ rows: ExcelNhanVienRow[]; errors: string[] }> {
  const wb = await docFile(file)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  const rows: ExcelNhanVienRow[] = []
  const errors: string[] = []

  raw.forEach((r, idx) => {
    const maNV = String(r['MaNV'] ?? r['MA_NV'] ?? r['Mã NV'] ?? '').trim()
    const hoTen = String(r['HoTen'] ?? r['HO_TEN'] ?? r['Họ Tên'] ?? r['Họ tên'] ?? '').trim()

    if (!maNV) {
      errors.push(`Dòng ${idx + 2}: Thiếu Mã NV`)
      return
    }
    if (!hoTen) {
      errors.push(`Dòng ${idx + 2}: Thiếu Họ Tên`)
      return
    }

    rows.push({
      MaNV: maNV,
      HoTen: hoTen,
      DonVi: String(r['DonVi'] ?? r['Đơn Vị'] ?? r['Đơn vị'] ?? '').trim() || undefined,
      MaSoThue: String(r['MaSoThue'] ?? r['Mã Số Thuế'] ?? r['Mã số thuế'] ?? '').trim() || undefined,
      CCCD: String(r['CCCD'] ?? r['Số CCCD'] ?? '').trim() || undefined,
    })
  })

  return { rows, errors }
}

export async function parseExcelThuNhap(file: File): Promise<{ rows: ExcelThuNhapRow[]; errors: string[] }> {
  const wb = await docFile(file)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: 0 })

  const rows: ExcelThuNhapRow[] = []
  const errors: string[] = []

  raw.forEach((r, idx) => {
    const maNV = String(r['MaNV'] ?? r['MA_NV'] ?? '').trim()
    const hoTen = String(r['HoTen'] ?? r['HO_TEN'] ?? r['Họ tên'] ?? '').trim()

    if (!maNV) {
      errors.push(`Dòng ${idx + 2}: Thiếu MaNV`)
      return
    }

    const tong = Number(r['TongThuNhap'] ?? r['Tổng Thu Nhập'] ?? 0)
    const khac = Number(r['KhacChiuThue'] ?? r['KhgChiuThue'] ?? r['Không Chịu Thuế'] ?? 0)
    const bh = Number(r['BaoHiem'] ?? r['Bảo Hiểm'] ?? 0)

    if (isNaN(tong) || isNaN(khac) || isNaN(bh)) {
      errors.push(`Dòng ${idx + 2}: Giá trị số không hợp lệ`)
      return
    }

    rows.push({
      MaNV: maNV,
      HoTen: hoTen,
      MaSoThue: String(r['MaSoThue'] ?? '').trim() || undefined,
      TongThuNhap: tong,
      KhacChiuThue: khac,
      BaoHiem: bh,
    })
  })

  return { rows, errors }
}
