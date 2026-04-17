import { useState, useEffect } from 'react'
import type { NhanVien } from '../../types'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface EmployeeFormProps {
  initial?: NhanVien | null
  onSubmit: (data: Omit<NhanVien, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>
  onCancel: () => void
}

const empty = { ma_nv: '', ho_ten: '', don_vi: '', ma_so_thue: '', cccd: '', nghi_viec: false }

export function EmployeeForm({ initial, onSubmit, onCancel }: EmployeeFormProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initial) {
      setForm({
        ma_nv: initial.ma_nv,
        ho_ten: initial.ho_ten,
        don_vi: initial.don_vi ?? '',
        ma_so_thue: initial.ma_so_thue ?? '',
        cccd: initial.cccd ?? '',
        nghi_viec: initial.nghi_viec,
      })
    } else {
      setForm(empty)
    }
  }, [initial])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.ma_nv.trim()) e.ma_nv = 'Bắt buộc nhập mã nhân viên'
    if (!form.ho_ten.trim()) e.ho_ten = 'Bắt buộc nhập họ tên'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      await onSubmit({
        ma_nv: form.ma_nv.trim(),
        ho_ten: form.ho_ten.trim(),
        don_vi: form.don_vi.trim() || null,
        ma_so_thue: form.ma_so_thue.trim() || null,
        cccd: form.cccd.trim() || null,
        nghi_viec: form.nghi_viec,
      })
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Mã nhân viên *"
        value={form.ma_nv}
        onChange={e => set('ma_nv', e.target.value)}
        error={errors.ma_nv}
        disabled={!!initial}
        placeholder="NV001"
      />
      <Input
        label="Họ tên *"
        value={form.ho_ten}
        onChange={e => set('ho_ten', e.target.value)}
        error={errors.ho_ten}
        placeholder="Nguyễn Văn A"
      />
      <Input
        label="Đơn vị / Phòng ban"
        value={form.don_vi}
        onChange={e => set('don_vi', e.target.value)}
        placeholder="Phòng Kế toán"
      />
      <Input
        label="Mã số thuế"
        value={form.ma_so_thue}
        onChange={e => set('ma_so_thue', e.target.value)}
        placeholder="0123456789"
      />
      <Input
        label="Số CCCD"
        value={form.cccd}
        onChange={e => set('cccd', e.target.value)}
        placeholder="012345678901"
      />
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.nghi_viec}
          onChange={e => set('nghi_viec', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-gray-700">Đã nghỉ việc</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  )
}
