import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { NhanVien, NguoiPhuThuoc } from '../types'
import { useNhanVien } from '../hooks/useNhanVien'
import { useNguoiPhuThuoc } from '../hooks/useNguoiPhuThuoc'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { DependentForm } from '../components/dependents/DependentForm'

function dependentStatus(npt: NguoiPhuThuoc): { label: string; variant: 'success' | 'gray' | 'warning' } {
  if (npt.khong_su_dung) return { label: 'Không dùng', variant: 'gray' }
  if (npt.den_nam == null) return { label: 'Đang tính', variant: 'success' }
  const now = new Date()
  const ended = npt.den_nam < now.getFullYear() ||
    (npt.den_nam === now.getFullYear() && (npt.den_thang ?? 12) < now.getMonth() + 1)
  return ended ? { label: 'Đã hết hạn', variant: 'warning' } : { label: 'Đang tính', variant: 'success' }
}

export function DependentsPage() {
  const { fetchAll } = useNhanVien()
  const { loading, fetchByEmployee, create, update, remove } = useNguoiPhuThuoc()
  const { showToast } = useToast()

  const [employees, setEmployees] = useState<NhanVien[]>([])
  const [selected, setSelected] = useState<NhanVien | null>(null)
  const [dependents, setDependents] = useState<NguoiPhuThuoc[]>([])
  const [searchEmp, setSearchEmp] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NguoiPhuThuoc | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<NguoiPhuThuoc | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loadingEmp, setLoadingEmp] = useState(false)

  useEffect(() => {
    setLoadingEmp(true)
    fetchAll(false).then(data => { setEmployees(data); setLoadingEmp(false) })
  }, [fetchAll])

  const loadDependents = useCallback(async (nv: NhanVien) => {
    const data = await fetchByEmployee(nv.id)
    setDependents(data)
  }, [fetchByEmployee])

  useEffect(() => {
    if (selected) loadDependents(selected)
  }, [selected, loadDependents])

  const filteredEmp = employees.filter(e =>
    !searchEmp ||
    e.ho_ten.toLowerCase().includes(searchEmp.toLowerCase()) ||
    e.ma_nv.toLowerCase().includes(searchEmp.toLowerCase())
  )

  async function handleSubmit(data: Omit<NguoiPhuThuoc, 'id' | 'created_at' | 'updated_at'>) {
    try {
      if (editing) {
        await update(editing.id, data)
        showToast('Cập nhật thành công', 'success')
      } else {
        await create(data)
        showToast('Thêm người phụ thuộc thành công', 'success')
      }
      setFormOpen(false)
      setEditing(null)
      if (selected) loadDependents(selected)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi lưu dữ liệu', 'error')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await remove(confirmDelete.id)
      showToast('Đã xóa người phụ thuộc', 'success')
      setConfirmDelete(null)
      if (selected) loadDependents(selected)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi xóa', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý Người phụ thuộc</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-700 mb-2">Chọn nhân viên</p>
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchEmp}
              onChange={e => setSearchEmp(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-96">
            {loadingEmp ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filteredEmp.length === 0 && !loadingEmp ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-3">Chưa có nhân viên nào</p>
                <Link to="/nhan-vien">
                  <Button size="sm" variant="secondary">Đi đến Nhân viên →</Button>
                </Link>
              </div>
            ) : filteredEmp.map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelected(emp)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 transition-colors
                  ${selected?.id === emp.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="font-medium">{emp.ho_ten}</div>
                <div className="text-xs text-gray-400">{emp.ma_nv} · {emp.don_vi ?? ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dependent table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Chọn nhân viên để xem người phụ thuộc</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">{selected.ho_ten}</p>
                  <p className="text-xs text-gray-400">{dependents.length} người phụ thuộc</p>
                </div>
                <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                  + Thêm
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : dependents.length === 0 ? (
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 text-sm mb-2">Hướng dẫn khai báo người phụ thuộc</h4>
                    <ul className="text-xs text-blue-700 space-y-1.5">
                      <li>• Nhấn <strong>+ Thêm</strong> để thêm con, vợ/chồng, cha/mẹ được giảm trừ</li>
                      <li>• Điền <strong>từ tháng/năm</strong> bắt đầu tính giảm trừ</li>
                      <li>• Nếu đã hết giảm trừ (ví dụ con đã 18 tuổi), điền thêm "đến tháng/năm"</li>
                      <li>• Mỗi người phụ thuộc hợp lệ được giảm trừ <strong>4.400.000đ/tháng</strong></li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
                    <p className="font-medium text-gray-700 mb-2">Ví dụ người phụ thuộc hợp lệ:</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span>Con dưới 18 tuổi</span><span className="text-green-600">✓ Hợp lệ</span></div>
                      <div className="flex justify-between"><span>Con học đại học (dưới 25 tuổi)</span><span className="text-green-600">✓ Hợp lệ</span></div>
                      <div className="flex justify-between"><span>Cha/Mẹ không có thu nhập</span><span className="text-green-600">✓ Hợp lệ</span></div>
                      <div className="flex justify-between"><span>Vợ/Chồng không có thu nhập</span><span className="text-green-600">✓ Hợp lệ</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Họ tên', 'Quan hệ', 'Ngày sinh', 'Thời gian giảm trừ', 'Trạng thái', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dependents.map(npt => {
                        const status = dependentStatus(npt)
                        return (
                          <tr key={npt.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{npt.ho_ten}</td>
                            <td className="px-4 py-3 text-gray-600">{npt.moi_quan_he}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {npt.ngay_sinh ? new Date(npt.ngay_sinh).toLocaleDateString('vi-VN') : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              Từ T{npt.tu_thang}/{npt.tu_nam}
                              {npt.den_nam ? ` → T${npt.den_thang}/${npt.den_nam}` : ' → nay'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => { setEditing(npt); setFormOpen(true) }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(npt)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Chỉnh sửa người phụ thuộc' : 'Thêm người phụ thuộc'}
        size="lg"
      >
        {selected && (
          <DependentForm
            nhanVienId={selected.id}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setFormOpen(false); setEditing(null) }}
          />
        )}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Xác nhận xóa" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Xóa người phụ thuộc <strong>{confirmDelete?.ho_ten}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
