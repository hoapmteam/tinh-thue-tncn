import { useState, useEffect } from 'react'
import type { NguoiPhuThuoc } from '../../types'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

const MOI_QUAN_HE = ['Con', 'Vợ/Chồng', 'Cha', 'Mẹ', 'Anh/Chị/Em ruột', 'Khác']
const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

type FormData = Omit<NguoiPhuThuoc, 'id' | 'created_at' | 'updated_at'>

interface DependentFormProps {
  nhanVienId: string
  initial?: NguoiPhuThuoc | null
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

function emptyForm(nhanVienId: string): FormData {
  return {
    nhan_vien_id: nhanVienId,
    ho_ten: '',
    moi_quan_he: 'Con',
    ngay_sinh: null,
    ma_so_thue: null,
    cccd: null,
    tu_thang: CURRENT_MONTH,
    tu_nam: CURRENT_YEAR,
    den_thang: null,
    den_nam: null,
    khong_su_dung: false,
  }
}

export function DependentForm({ nhanVienId, initial, onSubmit, onCancel }: DependentFormProps) {
  const [form, setForm] = useState<FormData>(emptyForm(nhanVienId))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasEndDate, setHasEndDate] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({ ...initial })
      setHasEndDate(initial.den_nam != null)
    } else {
      setForm(emptyForm(nhanVienId))
      setHasEndDate(false)
    }
  }, [initial, nhanVienId])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.ho_ten.trim()) e.ho_ten = 'Bắt buộc nhập họ tên'
    if (!form.moi_quan_he) e.moi_quan_he = 'Bắt buộc chọn mối quan hệ'
    if (hasEndDate && form.den_nam != null && form.den_thang != null) {
      if (form.den_nam < form.tu_nam || (form.den_nam === form.tu_nam && (form.den_thang ?? 0) < form.tu_thang)) {
        e.den_thang = 'Tháng kết thúc phải sau tháng bắt đầu'
      }
    }
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        ho_ten: form.ho_ten.trim(),
        ma_so_thue: form.ma_so_thue?.trim() || null,
        cccd: form.cccd?.trim() || null,
        den_thang: hasEndDate ? form.den_thang : null,
        den_nam: hasEndDate ? form.den_nam : null,
      })
    } finally {
      setLoading(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 5 + i)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Họ tên *"
        value={form.ho_ten}
        onChange={e => setForm(f => ({ ...f, ho_ten: e.target.value }))}
        error={errors.ho_ten}
        placeholder="Nguyễn Văn B"
      />
      <Select
        label="Mối quan hệ *"
        value={form.moi_quan_he}
        onChange={e => setForm(f => ({ ...f, moi_quan_he: e.target.value }))}
        error={errors.moi_quan_he}
      >
        {MOI_QUAN_HE.map(r => <option key={r} value={r}>{r}</option>)}
      </Select>
      <Input
        label="Ngày sinh"
        type="date"
        value={form.ngay_sinh ?? ''}
        onChange={e => setForm(f => ({ ...f, ngay_sinh: e.target.value || null }))}
      />
      <Input
        label="Mã số thuế"
        value={form.ma_so_thue ?? ''}
        onChange={e => setForm(f => ({ ...f, ma_so_thue: e.target.value }))}
        placeholder="Nếu có"
      />
      <Input
        label="Số CCCD"
        value={form.cccd ?? ''}
        onChange={e => setForm(f => ({ ...f, cccd: e.target.value }))}
      />

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Thời gian giảm trừ (từ) *</label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={form.tu_thang}
            onChange={e => setForm(f => ({ ...f, tu_thang: Number(e.target.value) }))}
          >
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </Select>
          <Select
            value={form.tu_nam}
            onChange={e => setForm(f => ({ ...f, tu_nam: Number(e.target.value) }))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={hasEndDate}
          onChange={e => setHasEndDate(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-gray-700">Có ngày kết thúc giảm trừ</span>
      </label>

      {hasEndDate && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Đến tháng năm</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={form.den_thang ?? CURRENT_MONTH}
              onChange={e => setForm(f => ({ ...f, den_thang: Number(e.target.value) }))}
              error={errors.den_thang}
            >
              {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </Select>
            <Select
              value={form.den_nam ?? CURRENT_YEAR}
              onChange={e => setForm(f => ({ ...f, den_nam: Number(e.target.value) }))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.khong_su_dung}
          onChange={e => setForm(f => ({ ...f, khong_su_dung: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-gray-700">Không còn tính giảm trừ</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" loading={loading}>{initial ? 'Cập nhật' : 'Thêm mới'}</Button>
      </div>
    </form>
  )
}
