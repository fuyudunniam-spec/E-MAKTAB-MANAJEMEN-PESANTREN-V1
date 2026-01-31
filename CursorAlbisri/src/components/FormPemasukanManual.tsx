import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { AkunKasService, AkunKas } from '../services/akunKas.service';
import { toast } from 'sonner';

interface FormPemasukanManualProps {
  onSuccess?: () => void;
}

const FormPemasukanManual: React.FC<FormPemasukanManualProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('');
  const [subKategori, setSubKategori] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [penerimaPembayar, setPenerimaPembayar] = useState('');
  const [akunKasId, setAkunKasId] = useState<string>('');
  const [akunKasOptions, setAkunKasOptions] = useState<AkunKas[]>([]);

  // Kategori pemasukan
  const kategoriPemasukan = [
    'Bunga Bank',
    'Hibah/Bantuan',
    'Lain-lain (Pemasukan)',
    'Pemasukan Lainnya'
  ];

  useEffect(() => {
    loadAkunKas();
  }, []);

  const loadAkunKas = async () => {
    try {
      const accounts = await AkunKasService.getAll();
      const activeAccounts = accounts.filter(acc => acc.status === 'aktif');
      setAkunKasOptions(activeAccounts);
      
      // Set default akun kas
      const defaultAccount = activeAccounts.find(acc => acc.is_default);
      if (defaultAccount) {
        setAkunKasId(defaultAccount.id);
      }
    } catch (error) {
      console.error('Error loading akun kas:', error);
      toast.error('Gagal memuat akun kas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tanggal || !kategori || !jumlah || !akunKasId) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    const jumlahNum = parseFloat(jumlah.replace(/\./g, '').replace(',', '.'));
    if (isNaN(jumlahNum) || jumlahNum <= 0) {
      toast.error('Jumlah harus berupa angka positif');
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create keuangan entry
      const insertData: any = {
        tanggal,
        jenis_transaksi: 'Pemasukan',
        kategori,
        sub_kategori: subKategori || null,
        jumlah: jumlahNum,
        deskripsi: deskripsi || kategori,
        penerima_pembayar: penerimaPembayar || null,
        akun_kas_id: akunKasId,
        status: 'posted',
        auto_posted: false,
        created_by: user?.id
      };
      
      const { data: keuangan, error: keuanganError } = await supabase
        .from('keuangan')
        .insert(insertData)
        .select()
        .single();

      if (keuanganError) throw keuanganError;

      // Update saldo akun kas
      try {
        await supabase.rpc('ensure_akun_kas_saldo_correct_for', {
          p_akun_id: akunKasId
        });
      } catch (saldoError) {
        console.warn('Warning ensuring saldo correct:', saldoError);
      }

      // Reset form
      setTanggal(new Date().toISOString().split('T')[0]);
      setKategori('');
      setSubKategori('');
      setJumlah('');
      setDeskripsi('');
      setPenerimaPembayar('');

      toast.success('Pemasukan berhasil disimpan');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving pemasukan:', error);
      toast.error('Gagal menyimpan pemasukan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setJumlah(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Input Pemasukan Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select value={kategori} onValueChange={setKategori} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriPemasukan.map(kat => (
                      <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subKategori">Sub Kategori</Label>
                <Input
                  id="subKategori"
                  value={subKategori}
                  onChange={(e) => setSubKategori(e.target.value)}
                  placeholder="e.g., Bunga Deposito, Hibah Pemerintah"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="akunKas">Akun Kas *</Label>
                <Select 
                  value={akunKasId} 
                  onValueChange={setAkunKasId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun kas" />
                  </SelectTrigger>
                  <SelectContent>
                    {akunKasOptions.map(akun => (
                      <SelectItem key={akun.id} value={akun.id}>
                        {akun.nama} ({akun.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumlah">Jumlah (Rp) *</Label>
                <Input
                  id="jumlah"
                  type="text"
                  value={jumlah ? formatCurrency(jumlah) : ''}
                  onChange={handleJumlahChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="penerima">Penerima/Pemberi</Label>
                <Input
                  id="penerima"
                  value={penerimaPembayar}
                  onChange={(e) => setPenerimaPembayar(e.target.value)}
                  placeholder="e.g., Bank BCA, Pemerintah Daerah"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Keterangan tambahan tentang pemasukan ini..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pemasukan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormPemasukanManual;

