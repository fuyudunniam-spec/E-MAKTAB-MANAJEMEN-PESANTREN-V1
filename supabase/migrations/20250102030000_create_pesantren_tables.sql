-- Create pesantren management tables

-- Create santri table
CREATE TABLE public.santri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis VARCHAR(50) UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  alamat TEXT,
  nama_wali TEXT,
  no_telepon_wali TEXT,
  kelas TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Non-Aktif', 'Lulus', 'Keluar')),
  tanggal_masuk DATE DEFAULT CURRENT_DATE,
  tanggal_keluar DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create tabungan table
CREATE TABLE public.tabungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id UUID REFERENCES public.santri(id),
  tanggal DATE NOT NULL,
  jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('Setoran', 'Penarikan')),
  jumlah NUMERIC NOT NULL,
  saldo_sebelum NUMERIC NOT NULL,
  saldo_sesudah NUMERIC NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create donasi table
CREATE TABLE public.donasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_donatur TEXT NOT NULL,
  email_donatur TEXT,
  no_telepon TEXT,
  jenis_donasi TEXT NOT NULL CHECK (jenis_donasi IN ('Uang', 'Barang', 'Lainnya')),
  jumlah NUMERIC,
  deskripsi TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Diterima', 'Ditolak')),
  tanggal_donasi DATE DEFAULT CURRENT_DATE,
  tanggal_diterima DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create inventaris table
CREATE TABLE public.inventaris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  kategori TEXT NOT NULL,
  jumlah INTEGER DEFAULT 0,
  kondisi TEXT DEFAULT 'Baik' CHECK (kondisi IN ('Baik', 'Rusak Ringan', 'Rusak Berat')),
  lokasi TEXT,
  harga_perolehan NUMERIC,
  tanggal_perolehan DATE,
  supplier TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create keuangan table
CREATE TABLE public.keuangan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('Pemasukan', 'Pengeluaran')),
  kategori TEXT NOT NULL,
  jumlah NUMERIC NOT NULL,
  deskripsi TEXT,
  referensi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create koperasi table
CREATE TABLE public.koperasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_produk TEXT NOT NULL,
  kategori TEXT NOT NULL,
  harga_jual NUMERIC NOT NULL,
  harga_beli NUMERIC,
  stok INTEGER DEFAULT 0,
  stok_minimum INTEGER DEFAULT 0,
  supplier TEXT,
  deskripsi TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Non-Aktif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for all tables
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.koperasi ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY " Users can view santri data\ ON public.santri
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage santri data\ ON public.santri
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY \Users can view tabungan data\ ON public.tabungan
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage tabungan data\ ON public.tabungan
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY \Users can view donasi data\ ON public.donasi
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage donasi data\ ON public.donasi
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY \Users can view inventaris data\ ON public.inventaris
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage inventaris data\ ON public.inventaris
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY \Users can view keuangan data\ ON public.keuangan
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage keuangan data\ ON public.keuangan
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY \Users can view koperasi data\ ON public.koperasi
 FOR SELECT USING (true);

CREATE POLICY \Admins can manage koperasi data\ ON public.koperasi
 FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at triggers for all tables
CREATE TRIGGER set_santri_updated_at
 BEFORE UPDATE ON public.santri
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tabungan_updated_at
 BEFORE UPDATE ON public.tabungan
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_donasi_updated_at
 BEFORE UPDATE ON public.donasi
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_inventaris_updated_at
 BEFORE UPDATE ON public.inventaris
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_keuangan_updated_at
 BEFORE UPDATE ON public.keuangan
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_koperasi_updated_at
 BEFORE UPDATE ON public.koperasi
 FOR EACH ROW
 EXECUTE FUNCTION public.handle_updated_at();
