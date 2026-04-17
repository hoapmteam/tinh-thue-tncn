import { supabase } from './supabase'

export async function loadDemoEmployees() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const now = new Date()
  const thang = now.getMonth() + 1
  const nam = now.getFullYear()

  const employees = [
    { ma_nv: 'NV001', ho_ten: 'Nguyễn Văn An', don_vi: 'Phòng Kế toán', ma_so_thue: '0123456789', cccd: '001234567890', nghi_viec: false, created_by: user.id },
    { ma_nv: 'NV002', ho_ten: 'Trần Thị Bích', don_vi: 'Phòng Nhân sự', ma_so_thue: '0987654321', cccd: '001234567891', nghi_viec: false, created_by: user.id },
    { ma_nv: 'NV003', ho_ten: 'Lê Hoàng Cường', don_vi: 'Phòng Kỹ thuật', ma_so_thue: '0111222333', cccd: '001234567892', nghi_viec: false, created_by: user.id },
    { ma_nv: 'NV004', ho_ten: 'Phạm Thị Dung', don_vi: 'Phòng Kinh doanh', ma_so_thue: '0444555666', cccd: '001234567893', nghi_viec: false, created_by: user.id },
    { ma_nv: 'NV005', ho_ten: 'Hoàng Văn Em', don_vi: 'Ban Giám đốc', ma_so_thue: '0777888999', cccd: '001234567894', nghi_viec: false, created_by: user.id },
  ]

  const { error: empError, data: empData } = await supabase
    .from('nhan_vien')
    .upsert(employees, { onConflict: 'ma_nv,created_by' })
    .select()

  if (empError) throw empError

  // Thêm người phụ thuộc mẫu cho NV001
  const nv001 = empData?.find(e => e.ma_nv === 'NV001')
  if (nv001) {
    await supabase.from('nguoi_phu_thuoc').upsert([
      {
        nhan_vien_id: nv001.id,
        ho_ten: 'Nguyễn Thị Con',
        moi_quan_he: 'Con',
        ngay_sinh: '2015-03-10',
        tu_thang: 1,
        tu_nam: 2023,
        den_thang: null,
        den_nam: null,
        khong_su_dung: false,
      },
      {
        nhan_vien_id: nv001.id,
        ho_ten: 'Nguyễn Văn Bố',
        moi_quan_he: 'Cha/Mẹ',
        ngay_sinh: '1960-07-20',
        tu_thang: 1,
        tu_nam: 2024,
        den_thang: null,
        den_nam: null,
        khong_su_dung: false,
      },
    ], { ignoreDuplicates: true })
  }

  // Thêm lịch sử thuế mẫu
  const nv002 = empData?.find(e => e.ma_nv === 'NV002')
  const nv003 = empData?.find(e => e.ma_nv === 'NV003')

  if (nv001 && nv002 && nv003) {
    const prevThang = thang === 1 ? 12 : thang - 1
    const prevNam = thang === 1 ? nam - 1 : nam
    await supabase.from('lich_su_thue').upsert([
      {
        nhan_vien_id: nv001.id, thang: prevThang, nam: prevNam,
        tong_thu_nhap: 25_000_000, khac_chiu_thue: 0, bao_hiem: 1_750_000,
        so_nguoi_phu_thuoc: 2, giam_tru_ban_than: 11_000_000, giam_tru_phu_thuoc: 8_800_000,
        thu_nhap_chiu_thue: 23_250_000, thu_nhap_tinh_thue: 3_450_000,
        thue_tncn: 172_500, chi_tiet_bac_thue: [{ bac: 1, thu_nhap: 3_450_000, thue_suat: 5, thue: 172_500 }],
      },
      {
        nhan_vien_id: nv002.id, thang: prevThang, nam: prevNam,
        tong_thu_nhap: 40_000_000, khac_chiu_thue: 0, bao_hiem: 2_800_000,
        so_nguoi_phu_thuoc: 1, giam_tru_ban_than: 11_000_000, giam_tru_phu_thuoc: 4_400_000,
        thu_nhap_chiu_thue: 37_200_000, thu_nhap_tinh_thue: 21_800_000,
        thue_tncn: 2_510_000, chi_tiet_bac_thue: [
          { bac: 1, thu_nhap: 5_000_000, thue_suat: 5, thue: 250_000 },
          { bac: 2, thu_nhap: 5_000_000, thue_suat: 10, thue: 500_000 },
          { bac: 3, thu_nhap: 8_000_000, thue_suat: 15, thue: 1_200_000 },
          { bac: 4, thu_nhap: 3_800_000, thue_suat: 20, thue: 760_000 },
        ],
      },
      {
        nhan_vien_id: nv003.id, thang: prevThang, nam: prevNam,
        tong_thu_nhap: 60_000_000, khac_chiu_thue: 5_000_000, bao_hiem: 4_200_000,
        so_nguoi_phu_thuoc: 0, giam_tru_ban_than: 11_000_000, giam_tru_phu_thuoc: 0,
        thu_nhap_chiu_thue: 50_800_000, thu_nhap_tinh_thue: 39_800_000,
        thue_tncn: 6_710_000, chi_tiet_bac_thue: [
          { bac: 1, thu_nhap: 5_000_000, thue_suat: 5, thue: 250_000 },
          { bac: 2, thu_nhap: 5_000_000, thue_suat: 10, thue: 500_000 },
          { bac: 3, thu_nhap: 8_000_000, thue_suat: 15, thue: 1_200_000 },
          { bac: 4, thu_nhap: 14_000_000, thue_suat: 20, thue: 2_800_000 },
          { bac: 5, thu_nhap: 7_800_000, thue_suat: 25, thue: 1_950_000 },
        ],
      },
    ], { onConflict: 'nhan_vien_id,thang,nam' })
  }

  return employees.length
}
