-- =============================================
-- PHẦN MỀM TÍNH THUẾ TNCN - Database Setup
-- An toàn để chạy nhiều lần (idempotent)
-- =============================================

-- 1. Trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bảng nhân viên
CREATE TABLE IF NOT EXISTS nhan_vien (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nv         VARCHAR(50) UNIQUE NOT NULL,
  ho_ten        VARCHAR(200) NOT NULL,
  don_vi        VARCHAR(200),
  ma_so_thue    VARCHAR(20),
  cccd          VARCHAR(20),
  nghi_viec     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_nhan_vien_ma_nv      ON nhan_vien(ma_nv);
CREATE INDEX IF NOT EXISTS idx_nhan_vien_ma_so_thue  ON nhan_vien(ma_so_thue);

DROP TRIGGER IF EXISTS trg_nhan_vien_updated_at ON nhan_vien;
CREATE TRIGGER trg_nhan_vien_updated_at
  BEFORE UPDATE ON nhan_vien
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE nhan_vien ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_nhan_vien" ON nhan_vien;
CREATE POLICY "authenticated_all_nhan_vien" ON nhan_vien
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Bảng người phụ thuộc
CREATE TABLE IF NOT EXISTS nguoi_phu_thuoc (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhan_vien_id   UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
  ho_ten         VARCHAR(200) NOT NULL,
  moi_quan_he    VARCHAR(100) NOT NULL,
  ngay_sinh      DATE,
  ma_so_thue     VARCHAR(20),
  cccd           VARCHAR(20),
  tu_thang       SMALLINT NOT NULL CHECK (tu_thang BETWEEN 1 AND 12),
  tu_nam         SMALLINT NOT NULL CHECK (tu_nam >= 2000),
  den_thang      SMALLINT CHECK (den_thang BETWEEN 1 AND 12),
  den_nam        SMALLINT CHECK (den_nam >= 2000),
  khong_su_dung  BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_period CHECK (
    den_nam IS NULL OR
    (den_nam > tu_nam) OR
    (den_nam = tu_nam AND den_thang >= tu_thang)
  )
);

CREATE INDEX IF NOT EXISTS idx_npt_nhan_vien_id ON nguoi_phu_thuoc(nhan_vien_id);

DROP TRIGGER IF EXISTS trg_npt_updated_at ON nguoi_phu_thuoc;
CREATE TRIGGER trg_npt_updated_at
  BEFORE UPDATE ON nguoi_phu_thuoc
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE nguoi_phu_thuoc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_nguoi_phu_thuoc" ON nguoi_phu_thuoc;
CREATE POLICY "authenticated_all_nguoi_phu_thuoc" ON nguoi_phu_thuoc
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Bảng lịch sử thuế
CREATE TABLE IF NOT EXISTS lich_su_thue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhan_vien_id          UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE RESTRICT,
  thang                 SMALLINT NOT NULL CHECK (thang BETWEEN 1 AND 12),
  nam                   SMALLINT NOT NULL CHECK (nam >= 2000),
  tong_thu_nhap         NUMERIC(18,0) NOT NULL DEFAULT 0,
  khac_chiu_thue        NUMERIC(18,0) NOT NULL DEFAULT 0,
  bao_hiem              NUMERIC(18,0) NOT NULL DEFAULT 0,
  so_nguoi_phu_thuoc    SMALLINT NOT NULL DEFAULT 0,
  giam_tru_ban_than     NUMERIC(18,0) NOT NULL DEFAULT 11000000,
  giam_tru_phu_thuoc    NUMERIC(18,0) NOT NULL DEFAULT 0,
  thu_nhap_chiu_thue    NUMERIC(18,0) NOT NULL DEFAULT 0,
  thu_nhap_tinh_thue    NUMERIC(18,0) NOT NULL DEFAULT 0,
  thue_tncn             NUMERIC(18,0) NOT NULL DEFAULT 0,
  chi_tiet_bac_thue     JSONB,
  calculated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_nv_thang_nam UNIQUE (nhan_vien_id, thang, nam)
);

CREATE INDEX IF NOT EXISTS idx_lst_nhan_vien_id ON lich_su_thue(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_lst_thang_nam    ON lich_su_thue(thang, nam);

ALTER TABLE lich_su_thue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_lich_su_thue" ON lich_su_thue;
CREATE POLICY "authenticated_all_lich_su_thue" ON lich_su_thue
  FOR ALL USING (auth.role() = 'authenticated');
