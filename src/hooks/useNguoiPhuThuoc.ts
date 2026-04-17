import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { NguoiPhuThuoc } from '../types'

export function useNguoiPhuThuoc() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByEmployee = useCallback(async (nhanVienId: string): Promise<NguoiPhuThuoc[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('nguoi_phu_thuoc')
        .select('*')
        .eq('nhan_vien_id', nhanVienId)
        .order('ho_ten')
      if (error) throw error
      return data ?? []
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải người phụ thuộc'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByEmployees = useCallback(async (nhanVienIds: string[]): Promise<NguoiPhuThuoc[]> => {
    if (nhanVienIds.length === 0) return []
    const { data, error } = await supabase
      .from('nguoi_phu_thuoc')
      .select('*')
      .in('nhan_vien_id', nhanVienIds)
    if (error) throw error
    return data ?? []
  }, [])

  const create = useCallback(async (data: Omit<NguoiPhuThuoc, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('nguoi_phu_thuoc').insert(data)
    if (error) throw error
  }, [])

  const update = useCallback(async (id: string, data: Partial<NguoiPhuThuoc>) => {
    const { error } = await supabase.from('nguoi_phu_thuoc').update(data).eq('id', id)
    if (error) throw error
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('nguoi_phu_thuoc').delete().eq('id', id)
    if (error) throw error
  }, [])

  return { loading, error, fetchByEmployee, fetchByEmployees, create, update, remove }
}
