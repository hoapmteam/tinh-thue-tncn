import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { NhanVien, ExcelNhanVienRow } from '../types'

export function useNhanVien() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (includeNghiViec = true): Promise<NhanVien[]> => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('nhan_vien').select('*').order('ho_ten')
      if (!includeNghiViec) query = query.eq('nghi_viec', false)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải danh sách nhân viên'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: Omit<NhanVien, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { error } = await supabase.from('nhan_vien').insert(data)
    if (error) throw error
  }, [])

  const update = useCallback(async (id: string, data: Partial<NhanVien>) => {
    const { error } = await supabase.from('nhan_vien').update(data).eq('id', id)
    if (error) throw error
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('nhan_vien').delete().eq('id', id)
    if (error) throw error
  }, [])

  const importBatch = useCallback(async (rows: ExcelNhanVienRow[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    const records = rows.map(r => ({
      ma_nv: r.MaNV,
      ho_ten: r.HoTen,
      don_vi: r.DonVi ?? null,
      ma_so_thue: r.MaSoThue ?? null,
      cccd: r.CCCD ?? null,
      nghi_viec: false,
      created_by: user?.id,
    }))
    const { error } = await supabase.from('nhan_vien').upsert(records, { onConflict: 'ma_nv,created_by' })
    if (error) throw error
  }, [])

  return { loading, error, fetchAll, create, update, remove, importBatch }
}
