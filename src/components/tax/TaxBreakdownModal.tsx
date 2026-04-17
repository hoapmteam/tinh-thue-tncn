import type { LichSuThue } from '../../types'
import { Modal } from '../ui/Modal'
import { formatVND, formatSoTien } from '../../lib/taxCalculator'

interface TaxBreakdownModalProps {
  record: LichSuThue | null
  onClose: () => void
}

export function TaxBreakdownModal({ record, onClose }: TaxBreakdownModalProps) {
  if (!record) return null

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title={`Chi tiết thuế - ${record.nhan_vien?.ho_ten ?? ''} (T${record.thang}/${record.nam})`}
      size="lg"
    >
      <div className="space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thu nhập</p>
            <Row label="Tổng thu nhập" value={formatVND(record.tong_thu_nhap)} />
            <Row label="Không chịu thuế" value={`- ${formatVND(record.khac_chiu_thue)}`} className="text-orange-600" />
            <Row label="Bảo hiểm" value={`- ${formatVND(record.bao_hiem)}`} className="text-orange-600" />
            <div className="border-t border-gray-200 pt-1.5">
              <Row label="TN chịu thuế" value={formatVND(record.thu_nhap_chiu_thue)} bold />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Giảm trừ</p>
            <Row label="Bản thân" value={`- ${formatVND(record.giam_tru_ban_than)}`} className="text-green-600" />
            <Row
              label={`Phụ thuộc (${record.so_nguoi_phu_thuoc} người)`}
              value={`- ${formatVND(record.giam_tru_phu_thuoc)}`}
              className="text-green-600"
            />
            <div className="border-t border-gray-200 pt-1.5">
              <Row label="TN tính thuế" value={formatVND(record.thu_nhap_tinh_thue)} bold />
            </div>
          </div>
        </div>

        {record.chi_tiet_bac_thue && record.chi_tiet_bac_thue.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thuế theo bậc lũy tiến</p>
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {['Bậc', 'Từ (VNĐ)', 'Đến (VNĐ)', 'Thuế suất', 'TN tính', 'Thuế phải nộp'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {record.chi_tiet_bac_thue.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{b.bacLabel}</td>
                    <td className="px-3 py-2">{formatSoTien(b.from)}</td>
                    <td className="px-3 py-2">{b.to === Infinity ? 'Không giới hạn' : formatSoTien(b.to)}</td>
                    <td className="px-3 py-2 text-blue-600 font-medium">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2">{formatSoTien(b.taxableAmount)}</td>
                    <td className="px-3 py-2 font-semibold text-red-600">{formatSoTien(b.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
          <span className="font-semibold text-gray-800">Tổng thuế TNCN phải nộp</span>
          <span className="text-xl font-bold text-blue-700">{formatVND(record.thue_tncn)}</span>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value, bold, className = '' }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className={`${bold ? 'font-semibold text-gray-900' : ''} ${className}`}>{value}</span>
    </div>
  )
}
