import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { LichSuThue, TaxCalculationResult } from '../types'

export function useLichSuThue() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByThangNam = useCallback(async (thang: number, nam: number): Promise<LichSuThue[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('lich_su_thue')
        .select('*, nhan_vien:nhan_vien_id(id, ma_nv, ho_ten, don_vi, ma_so_thue)')
        .eq('thang', thang)
        .eq('nam', nam)
        .order('calculated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as LichSuThue[]
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải lịch sử thuế'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByEmployee = useCallback(async (nhanVienId: string): Promise<LichSuThue[]> => {
    const { data, error } = await supabase
      .from('lich_su_thue')
      .select('*')
      .eq('nhan_vien_id', nhanVienId)
      .order('nam', { ascending: false })
      .order('thang', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])

  const saveResults = useCallback(async (results: TaxCalculationResult[], thang: number, nam: number) => {
    setLoading(true)
    setError(null)
    try {
      const records = results.map(r => ({
        nhan_vien_id: r.nhan_vien_id,
        thang,
        nam,
        tong_thu_nhap: r.tong_thu_nhap,
        khac_chiu_thue: r.khac_chiu_thue,
        bao_hiem: r.bao_hiem,
        so_nguoi_phu_thuoc: r.so_nguoi_phu_thuoc,
        giam_tru_ban_than: r.giam_tru_ban_than,
        giam_tru_phu_thuoc: r.giam_tru_phu_thuoc,
        thu_nhap_chiu_thue: r.thu_nhap_chiu_thue,
        thu_nhap_tinh_thue: r.thu_nhap_tinh_thue,
        thue_tncn: r.thue_tncn,
        chi_tiet_bac_thue: r.chi_tiet_bac_thue,
      }))
      const { error } = await supabase
        .from('lich_su_thue')
        .upsert(records, { onConflict: 'nhan_vien_id,thang,nam' })
      if (error) throw error
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi lưu kết quả thuế'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, fetchByThangNam, fetchByEmployee, saveResults }
}
