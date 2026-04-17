-- =============================================
-- MIGRATION V2: Phân quyền dữ liệu theo user
-- Chạy file này trong Supabase SQL Editor
-- An toàn để chạy nhiều lần (idempotent)
-- =============================================

-- 1. Trigger tự động gán created_by = auth.uid() khi INSERT
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nhan_vien_set_created_by ON nhan_vien;
CREATE TRIGGER trg_nhan_vien_set_created_by
  BEFORE INSERT ON nhan_vien
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- 2. Đổi ràng buộc UNIQUE(ma_nv) toàn cục → UNIQUE(ma_nv, created_by) theo từng user
--    Mỗi user có thể có NV001 riêng của mình
ALTER TABLE nhan_vien DROP CONSTRAINT IF EXISTS nhan_vien_ma_nv_key;
DROP INDEX IF EXISTS idx_nhan_vien_ma_nv_owner;
CREATE UNIQUE INDEX idx_nhan_vien_ma_nv_owner ON nhan_vien(ma_nv, created_by);

-- 3. RLS nhan_vien: mỗi user chỉ thấy dữ liệu mình tạo
DROP POLICY IF EXISTS "authenticated_all_nhan_vien" ON nhan_vien;
DROP POLICY IF EXISTS "owner_nhan_vien" ON nhan_vien;
CREATE POLICY "owner_nhan_vien" ON nhan_vien
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 4. RLS nguoi_phu_thuoc: kiểm tra qua bảng nhan_vien
DROP POLICY IF EXISTS "authenticated_all_nguoi_phu_thuoc" ON nguoi_phu_thuoc;
DROP POLICY IF EXISTS "owner_nguoi_phu_thuoc" ON nguoi_phu_thuoc;
CREATE POLICY "owner_nguoi_phu_thuoc" ON nguoi_phu_thuoc
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nhan_vien nv
      WHERE nv.id = nhan_vien_id AND nv.created_by = auth.uid()
    )
  );

-- 5. RLS lich_su_thue: kiểm tra qua bảng nhan_vien
DROP POLICY IF EXISTS "authenticated_all_lich_su_thue" ON lich_su_thue;
DROP POLICY IF EXISTS "owner_lich_su_thue" ON lich_su_thue;
CREATE POLICY "owner_lich_su_thue" ON lich_su_thue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nhan_vien nv
      WHERE nv.id = nhan_vien_id AND nv.created_by = auth.uid()
    )
  );

-- Xong! Từ giờ mỗi tài khoản chỉ thấy dữ liệu của chính mình.
