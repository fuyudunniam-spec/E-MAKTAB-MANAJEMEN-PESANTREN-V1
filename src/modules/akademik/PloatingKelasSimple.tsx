import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AkademikPloatingService, KelasOption, SantriLite } from '@/services/akademikPloating.service';
import { AkademikKelasService, KelasMaster } from '@/services/akademikKelas.service';
import { AkademikSemesterService, Semester } from '@/services/akademikSemester.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';

const PloatingKelasSimple: React.FC = () => {
  const [kelasOptions, setKelasOptions] = useState<KelasMaster[]>([]);
  const [kelasId, setKelasId] = useState<string>('');
  const [anggota, setAnggota] = useState<SantriLite[]>([]);
  const [query, setQuery] = useState('');
  const [hasilCari, setHasilCari] = useState<SantriLite[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const selectedKelas = useMemo(() => kelasOptions.find(k => k.id === kelasId), [kelasOptions, kelasId]);

  const loadSemesters = useCallback(async () => {
    try {
      setLoadingSemesters(true);
      const list = await AkademikSemesterService.listSemester();
      // Sort by tanggal_mulai descending (terbaru di atas)
      list.sort((a, b) => 
        new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime()
      );
      setSemesters(list);
      // Set semester aktif sebagai default
      const aktif = list.find(s => s.is_aktif);
      if (aktif) {
        setSelectedSemesterId(aktif.id);
      } else if (list.length > 0) {
        setSelectedSemesterId(list[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat semester');
    } finally {
      setLoadingSemesters(false);
    }
  }, []);

  const loadKelas = useCallback(async () => {
    try {
      const list = await AkademikKelasService.listKelas();
      
      // Filter berdasarkan semester jika dipilih
      let filtered = list;
      if (selectedSemesterId) {
        filtered = list.filter(k => k.semester_id === selectedSemesterId);
      }
      
      setKelasOptions(filtered);
      
      // Reset kelasId jika kelas yang dipilih tidak ada lagi setelah filter
      if (kelasId && !filtered.some(k => k.id === kelasId)) {
        setKelasId(filtered.length > 0 ? filtered[0].id : '');
      } else if (!kelasId && filtered.length > 0) {
        setKelasId(filtered[0].id);
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat kelas');
    }
  }, [selectedSemesterId, kelasId]);

  const loadAnggota = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const rows = await AkademikPloatingService.listAnggota(id);
      setAnggota(rows);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat anggota kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    loadKelas();
  }, [loadKelas]);

  useEffect(() => { 
    if (kelasId) loadAnggota(kelasId); 
  }, [kelasId]);

  const handleSearch = useCallback(async () => {
    try {
      setSearching(true);
      const res = await AkademikPloatingService.searchSantri(query);
      setHasilCari(res);
      // Reset filter jika kategori tidak ditemukan lagi
      if (kategoriFilter !== 'all' && !res.some(s => (s.kategori || '').toLowerCase() === kategoriFilter.toLowerCase())) {
        setKategoriFilter('all');
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal mencari santri');
    } finally {
      setSearching(false);
    }
  }, [query, kategoriFilter]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const toggleSelect = (sid: string) => {
    setSelectedSantri(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
  };

  const addSelected = async () => {
    if (!kelasId || selectedSantri.length === 0) {
      toast.error('Pilih kelas dan minimal satu santri');
      return;
    }
    try {
      await AkademikPloatingService.addMembers(kelasId, selectedSantri);
      toast.success(`Ditambahkan ${selectedSantri.length} santri ke kelas`);
      setSelectedSantri([]);
      loadAnggota(kelasId);
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan santri');
    }
  };

  const removeMember = async (sid: string) => {
    if (!confirm('Hapus santri dari kelas ini?')) return;
    try {
      await AkademikPloatingService.removeMember(kelasId, sid);
      toast.success('Santri dihapus dari kelas');
      loadAnggota(kelasId);
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus santri');
    }
  };

  const kategoriOptions = useMemo(() => {
    const set = new Set<string>();
    hasilCari.forEach(item => {
      if (item.kategori) {
        set.add(item.kategori);
      }
    });
    return Array.from(set);
  }, [hasilCari]);

  const filteredResults = useMemo(() => {
    if (kategoriFilter === 'all') return hasilCari;
    return hasilCari.filter(item => (item.kategori || '').toLowerCase() === kategoriFilter.toLowerCase());
  }, [hasilCari, kategoriFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ploating Kelas</h1>
          <p className="text-muted-foreground">Pilih kelas lalu tambahkan santri ke kelas tersebut.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas</CardTitle>
          <CardDescription>Pilih semester dan kelas tujuan sebelum menambahkan santri.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Semester</Label>
            <Select 
              value={selectedSemesterId || 'all'} 
              onValueChange={(value) => setSelectedSemesterId(value === 'all' ? null : value)}
              disabled={loadingSemesters}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSemesters ? "Memuat..." : "Pilih semester"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {semesters.map(sem => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.nama} • {sem.tahun_ajaran?.nama || '-'}
                    {sem.is_aktif && ' (Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kelas</Label>
            <Select value={kelasId || undefined} onValueChange={(v: any) => setKelasId(v)} disabled={loadingSemesters || kelasOptions.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loadingSemesters ? "Memuat..." : kelasOptions.length === 0 ? "Tidak ada kelas" : "Pilih kelas"} />
              </SelectTrigger>
              <SelectContent>
                {kelasOptions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {selectedSemesterId ? "Tidak ada kelas untuk semester ini" : "Pilih semester untuk memfilter kelas"}
                  </div>
                ) : (
                  kelasOptions.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama_kelas} {k.rombel ? `- ${k.rombel}` : ''} ({k.program})
                      {k.semester && <span className="text-xs text-muted-foreground ml-2">• {k.semester}</span>}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Cari Santri</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Nama atau ID Santri"
                />
              </div>
              <div className="w-40">
                <Label>Kategori</Label>
                <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoriOptions.map(k => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? 'Mencari...' : 'Cari'}
              </Button>
              <Button variant="secondary" onClick={addSelected}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Terpilih
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian</CardTitle>
            <CardDescription>Pilih beberapa santri untuk ditambahkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>ID Santri</TableHead>
                    <TableHead>Kategori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {searching ? 'Mencari santri...' : 'Belum ada hasil. Coba kata kunci lain atau ubah filter kategori.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredResults.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox checked={selectedSantri.includes(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{s.nama_lengkap}</TableCell>
                      <TableCell>{s.id_santri || '-'}</TableCell>
                      <TableCell>{s.kategori || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anggota Kelas</CardTitle>
            <CardDescription>
              {selectedKelas ? (
                <>
                  {selectedKelas.nama_kelas}{selectedKelas.rombel ? ` - ${selectedKelas.rombel}` : ''}
                  {selectedKelas.semester && (
                    <span className="text-xs text-muted-foreground ml-2">
                      • {selectedKelas.semester} {selectedKelas.tahun_ajaran ? `(${selectedKelas.tahun_ajaran})` : ''}
                    </span>
                  )}
                </>
              ) : (
                'Pilih kelas'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{loading ? 'Memuat...' : `${anggota.length} santri dalam kelas`}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>ID Santri</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nama_lengkap}</TableCell>
                      <TableCell>{s.id_santri || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeMember(s.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PloatingKelasSimple;


