import type { NguoiPhuThuoc, BacThueDetail, TaxCalculationResult, ExcelThuNhapRow } from '../types'

const GIAM_TRU_BAN_THAN = 11_000_000
const GIAM_TRU_MOT_PHU_THUOC = 4_400_000

const BAC_THUE = [
  { limit: 5_000_000, rate: 0.05 },
  { limit: 10_000_000, rate: 0.10 },
  { limit: 18_000_000, rate: 0.15 },
  { limit: 32_000_000, rate: 0.20 },
  { limit: 52_000_000, rate: 0.25 },
  { limit: 80_000_000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
]

const CUM_BRACKETS = [0, 5_000_000, 10_000_000, 18_000_000, 32_000_000, 52_000_000, 80_000_000, Infinity]

export function isNguoiPhuThuocActive(npt: NguoiPhuThuoc, thang: number, nam: number): boolean {
  if (npt.khong_su_dung) return false

  const startBefore = npt.tu_nam < nam || (npt.tu_nam === nam && npt.tu_thang <= thang)
  if (!startBefore) return false

  if (npt.den_nam == null) return true
  return npt.den_nam > nam || (npt.den_nam === nam && (npt.den_thang ?? 12) >= thang)
}

export function demNguoiPhuThuocHopLe(dsNpt: NguoiPhuThuoc[], thang: number, nam: number): number {
  return dsNpt.filter(npt => isNguoiPhuThuocActive(npt, thang, nam)).length
}

function tinhTheoLuyTien(thuNhapTinhThue: number): { totalTax: number; bracketDetail: BacThueDetail[] } {
  let remaining = Math.max(0, thuNhapTinhThue)
  let totalTax = 0
  const detail: BacThueDetail[] = []

  for (let i = 0; i < BAC_THUE.length; i++) {
    if (remaining <= 0) break
    const bracketWidth = CUM_BRACKETS[i + 1] === Infinity ? Infinity : CUM_BRACKETS[i + 1] - CUM_BRACKETS[i]
    const taxable = bracketWidth === Infinity ? remaining : Math.min(remaining, bracketWidth)
    const taxAmount = taxable * BAC_THUE[i].rate
    if (taxable > 0) {
      detail.push({
        bacLabel: `Bậc ${i + 1}`,
        from: CUM_BRACKETS[i],
        to: CUM_BRACKETS[i + 1],
        rate: BAC_THUE[i].rate,
        taxableAmount: taxable,
        taxAmount,
      })
    }
    totalTax += taxAmount
    remaining -= taxable
  }

  return { totalTax: Math.round(totalTax), bracketDetail: detail }
}

export function tinhThueTNCN(
  row: ExcelThuNhapRow,
  nhanVienId: string,
  soNguoiPhuThuoc: number,
  thang: number,
  nam: number,
): Omit<TaxCalculationResult, 'ma_nv' | 'ho_ten' | 'warning'> {
  const giamTruPhuThuoc = soNguoiPhuThuoc * GIAM_TRU_MOT_PHU_THUOC
  const thuNhapChiuThue = row.TongThuNhap - row.KhacChiuThue - row.BaoHiem
  const thuNhapTinhThue = Math.max(0, thuNhapChiuThue - GIAM_TRU_BAN_THAN - giamTruPhuThuoc)

  const { totalTax, bracketDetail } = tinhTheoLuyTien(thuNhapTinhThue)

  return {
    nhan_vien_id: nhanVienId,
    thang,
    nam,
    tong_thu_nhap: row.TongThuNhap,
    khac_chiu_thue: row.KhacChiuThue,
    bao_hiem: row.BaoHiem,
    so_nguoi_phu_thuoc: soNguoiPhuThuoc,
    giam_tru_ban_than: GIAM_TRU_BAN_THAN,
    giam_tru_phu_thuoc: giamTruPhuThuoc,
    thu_nhap_chiu_thue: Math.round(thuNhapChiuThue),
    thu_nhap_tinh_thue: Math.round(thuNhapTinhThue),
    thue_tncn: totalTax,
    chi_tiet_bac_thue: bracketDetail,
  }
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatSoTien(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount)
}
