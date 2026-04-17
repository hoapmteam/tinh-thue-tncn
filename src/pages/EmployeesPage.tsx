import { useState, useEffect, useCallback } from 'react'
import type { NhanVien } from '../types'
import { useNhanVien } from '../hooks/useNhanVien'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmployeeForm } from '../components/employees/EmployeeForm'
import { EmployeeImport } from '../components/employees/EmployeeImport'
import { loadDemoEmployees } from '../lib/demoData'

export function EmployeesPage() {
  const { loading, fetchAll, create, update, remove, importBatch } = useNhanVien()
  const { showToast } = useToast()

  const [employees, setEmployees] = useState<NhanVien[]>([])
  const [search, setSearch] = useState('')
  const [showResigned, setShowResigned] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<NhanVien | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<NhanVien | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchAll(true)
    setEmployees(data)
  }, [fetchAll])

  useEffect(() => { load() }, [load])

  async function handleLoadDemo() {
    setLoadingDemo(true)
    try {
      const count = await loadDemoEmployees()
      showToast(`Đã tải ${count} nhân viên mẫu vào hệ thống`, 'success')
      load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi tải dữ liệu mẫu', 'error')
    } finally {
      setLoadingDemo(false)
    }
  }

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
      e.ma_nv.toLowerCase().includes(search.toLowerCase()) ||
      (e.don_vi ?? '').toLowerCase().includes(search.toLowerCase())
    const matchResigned = showResigned || !e.nghi_viec
    return matchSearch && matchResigned
  })

  async function handleCreate(data: Omit<NhanVien, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    try {
      await create(data)
      showToast('Thêm nhân viên thành công', 'success')
      setFormOpen(false)
      load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi thêm nhân viên', 'error')
    }
  }

  async function handleUpdate(data: Omit<NhanVien, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    if (!editing) return
    try {
      await update(editing.id, data)
      showToast('Cập nhật thành công', 'success')
      setEditing(null)
      setFormOpen(false)
      load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi cập nhật', 'error')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await remove(confirmDelete.id)
      showToast('Đã xóa nhân viên', 'success')
      setConfirmDelete(null)
      load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi xóa nhân viên', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} nhân viên</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Excel
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Thêm nhân viên
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã, đơn vị..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showResigned}
              onChange={e => setShowResigned(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Hiển thị đã nghỉ việc
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : employees.length === 0 ? (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Chưa có nhân viên nào</h3>
                <p className="text-gray-500 text-sm">Bắt đầu bằng cách thêm nhân viên hoặc tải dữ liệu mẫu để xem thử</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm mb-2">Cách 1: Import từ Excel</h4>
                      <p className="text-xs text-blue-700 mb-2">Nhấn "Import Excel" và tải lên file với các cột:</p>
                      <div className="bg-white rounded-lg p-2 text-xs font-mono text-gray-700 border border-blue-200">
                        <div className="grid grid-cols-2 gap-1">
                          <span className="font-bold text-blue-600">MaNV</span><span>NV001</span>
                          <span className="font-bold text-blue-600">HoTen</span><span>Nguyễn Văn A</span>
                          <span className="font-bold text-blue-600">DonVi</span><span>Kế toán</span>
                          <span className="font-bold text-blue-600">MaSoThue</span><span>0123456789</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <h4 className="font-semibold text-green-800 text-sm mb-2">Cách 2: Thêm thủ công</h4>
                      <p className="text-xs text-green-700 mb-2">Nhấn "+ Thêm nhân viên" và điền thông tin:</p>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• Mã nhân viên (bắt buộc, duy nhất)</li>
                        <li>• Họ tên đầy đủ</li>
                        <li>• Đơn vị / phòng ban</li>
                        <li>• Mã số thuế cá nhân</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-amber-800 text-sm mb-1">Gợi ý quy trình làm việc</h4>
                    <div className="flex items-center gap-2 text-xs text-amber-700 flex-wrap">
                      <span className="bg-amber-200 rounded px-2 py-1">1. Thêm nhân viên</span>
                      <span>→</span>
                      <span className="bg-amber-200 rounded px-2 py-1">2. Khai báo người phụ thuộc</span>
                      <span>→</span>
                      <span className="bg-amber-200 rounded px-2 py-1">3. Import lương hàng tháng</span>
                      <span>→</span>
                      <span className="bg-amber-200 rounded px-2 py-1">4. Tính & lưu thuế</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button loading={loadingDemo} variant="secondary" onClick={handleLoadDemo}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải dữ liệu mẫu (5 NV)
                </Button>
                <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                  + Thêm nhân viên đầu tiên
                </Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Import từ Excel
                </Button>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Không tìm thấy nhân viên phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Mã NV', 'Họ tên', 'Đơn vị', 'Mã số thuế', 'CCCD', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700">{emp.ma_nv}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.ho_ten}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.don_vi ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.ma_so_thue ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.cccd ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.nghi_viec ? 'gray' : 'success'}>
                        {emp.nghi_viec ? 'Đã nghỉ' : 'Đang làm'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditing(emp); setFormOpen(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(emp)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      >
        <EmployeeForm
          initial={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import nhân viên từ Excel" size="lg">
        <EmployeeImport
          onImport={async rows => {
            await importBatch(rows)
            showToast(`Import thành công ${rows.length} nhân viên`, 'success')
            setImportOpen(false)
            load()
          }}
          onCancel={() => setImportOpen(false)}
        />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Xác nhận xóa" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa nhân viên <strong>{confirmDelete?.ho_ten}</strong>?
            Tất cả người phụ thuộc và lịch sử thuế của nhân viên này cũng sẽ bị xóa.
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
