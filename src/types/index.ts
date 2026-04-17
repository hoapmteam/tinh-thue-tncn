export interface NhanVien {
  id: string
  ma_nv: string
  ho_ten: string
  don_vi: string | null
  ma_so_thue: string | null
  cccd: string | null
  nghi_viec: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface NguoiPhuThuoc {
  id: string
  nhan_vien_id: string
  ho_ten: string
  moi_quan_he: string
  ngay_sinh: string | null
  ma_so_thue: string | null
  cccd: string | null
  tu_thang: number
  tu_nam: number
  den_thang: number | null
  den_nam: number | null
  khong_su_dung: boolean
  created_at: string
  updated_at: string
}

export interface LichSuThue {
  id: string
  nhan_vien_id: string
  thang: number
  nam: number
  tong_thu_nhap: number
  khac_chiu_thue: number
  bao_hiem: number
  so_nguoi_phu_thuoc: number
  giam_tru_ban_than: number
  giam_tru_phu_thuoc: number
  thu_nhap_chiu_thue: number
  thu_nhap_tinh_thue: number
  thue_tncn: number
  chi_tiet_bac_thue: BacThueDetail[] | null
  calculated_at: string
  calculated_by: string | null
  nhan_vien?: NhanVien
}

export interface BacThueDetail {
  bacLabel: string
  from: number
  to: number
  rate: number
  taxableAmount: number
  taxAmount: number
}

export interface ExcelNhanVienRow {
  MaNV: string
  HoTen: string
  DonVi?: string
  MaSoThue?: string
  CCCD?: string
}

export interface ExcelThuNhapRow {
  MaNV: string
  HoTen: string
  MaSoThue?: string
  TongThuNhap: number
  KhacChiuThue: number
  BaoHiem: number
}

export interface TaxCalculationResult {
  nhan_vien_id: string
  ma_nv: string
  ho_ten: string
  thang: number
  nam: number
  tong_thu_nhap: number
  khac_chiu_thue: number
  bao_hiem: number
  so_nguoi_phu_thuoc: number
  giam_tru_ban_than: number
  giam_tru_phu_thuoc: number
  thu_nhap_chiu_thue: number
  thu_nhap_tinh_thue: number
  thue_tncn: number
  chi_tiet_bac_thue: BacThueDetail[]
  warning?: string
}
