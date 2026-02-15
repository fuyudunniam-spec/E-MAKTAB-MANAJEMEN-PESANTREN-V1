import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User } from "lucide-react";
import { SantriData, StatusSosial, RumpunKelas } from '@/modules/santri/shared/types/santri.types';

interface PersonalStepProps {
  santriData: SantriData;
  onChange: (data: Partial<SantriData>) => void;
  isBinaan: boolean;
  isMukim: boolean;
}

const PersonalStep: React.FC<PersonalStepProps> = ({
  santriData,
  onChange,
  isBinaan,
  isMukim
}) => {
  return (
    <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="text-xl font-semibold flex items-center gap-2.5 text-slate-800">
          <div className="p-2 rounded-lg bg-blue-50">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          Informasi Pribadi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Gender Selection */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-slate-700">
            Jenis Kelamin <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            className="flex gap-6 mt-3"
            value={santriData.jenis_kelamin}
            onValueChange={(v) => onChange({ jenis_kelamin: v as 'Laki-laki' | 'Perempuan' })}
          >
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <RadioGroupItem value="Laki-laki" className="border-slate-300" /> 
              <span className="text-sm text-slate-700 group-hover:text-slate-900">Laki-laki</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <RadioGroupItem value="Perempuan" className="border-slate-300" /> 
              <span className="text-sm text-slate-700 group-hover:text-slate-900">Perempuan</span>
            </label>
          </RadioGroup>
        </div>

        {/* Name & Birth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input 
              value={santriData.nama_lengkap || ''}
              onChange={(e) => onChange({ nama_lengkap: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Tempat Lahir <span className="text-red-500">*</span>
            </Label>
            <Input 
              value={santriData.tempat_lahir || ''}
              onChange={(e) => onChange({ tempat_lahir: e.target.value })}
              placeholder="Masukkan tempat lahir"
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Tanggal Lahir <span className="text-red-500">*</span>
            </Label>
            <Input 
              type="date"
              value={santriData.tanggal_lahir || ''}
              onChange={(e) => onChange({ tanggal_lahir: e.target.value })}
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input 
              value={santriData.no_whatsapp || ''}
              onChange={(e) => onChange({ no_whatsapp: e.target.value })}
              placeholder="+62..."
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Alamat Lengkap <span className="text-red-500">*</span>
          </Label>
          <Textarea 
            value={santriData.alamat || ''}
            onChange={(e) => onChange({ alamat: e.target.value })}
            placeholder="Masukkan alamat lengkap"
            rows={3}
            className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
          />
        </div>

      {/* Ploating kelas dinonaktifkan sementara: form rumpun/sub-kelas disembunyikan */}
      {/*
      {!isBinaan && santriData.kategori !== 'Mahasiswa' && (
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Rumpun Kelas</Label>
              <Select
                value={santriData.rumpun_kelas as RumpunKelas | undefined}
                onValueChange={(value: any) => onChange({ rumpun_kelas: value as RumpunKelas })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rumpun (TPQ/Madin)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TPQ">TPQ</SelectItem>
                  <SelectItem value="Madin">Madin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Opsional — untuk memudahkan pengelompokan.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Nama/Sub-Kelas</Label>
              <Input 
                value={santriData.nama_kelas || ''}
                onChange={(e) => onChange({ nama_kelas: e.target.value })}
                placeholder="Contoh: A1, A2, I'dad, Ula, Wusta, Ulya"
              />
              <p className="text-xs text-muted-foreground">Opsional — label kelas bebas sesuai rumpun.</p>
            </div>
          </div>
        </div>
      )}
      */}

        {/* NIK and NISN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
            </Label>
            <Input 
              value={santriData.nik || ''}
              onChange={(e) => onChange({ nik: e.target.value })}
              placeholder="16 digit NIK"
              maxLength={16}
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              NISN (Nomor Induk Siswa Nasional)
            </Label>
            <Input 
              value={santriData.nisn || ''}
              onChange={(e) => onChange({ nisn: e.target.value })}
              placeholder="10 digit NISN (opsional)"
              maxLength={10}
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <p className="text-xs text-slate-500">Opsional - untuk siswa yang sudah memiliki NISN</p>
          </div>
        </div>

        {/* Hobi and Cita-cita - Opsional untuk non-Mukim */}
        {!isMukim && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Hobi</Label>
              <Input 
                value={santriData.hobi || ''}
                onChange={(e) => onChange({ hobi: e.target.value })}
                placeholder="Hobi atau minat khusus"
                className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Cita-cita</Label>
              <Input 
                value={santriData.cita_cita || ''}
                onChange={(e) => onChange({ cita_cita: e.target.value })}
                placeholder="Cita-cita atau cita-cita masa depan"
                className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* School Information for Binaan Mukim */}
        {isBinaan && isMukim && (
          <div className="pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-6 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Informasi Sekolah Formal (Binaan Mukim)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Jenjang Sekolah</Label>
                <Select
                  value={santriData.jenjang_sekolah || ''}
                  onValueChange={(value) => onChange({ jenjang_sekolah: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="SMK">SMK</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Nama Sekolah</Label>
                <Input 
                  value={santriData.nama_sekolah || ''}
                  onChange={(e) => onChange({ nama_sekolah: e.target.value })}
                  placeholder="Nama sekolah formal"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Alamat Sekolah</Label>
                <Input 
                  value={santriData.alamat_sekolah || ''}
                  onChange={(e) => onChange({ alamat_sekolah: e.target.value })}
                  placeholder="Alamat lengkap sekolah"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Kelas</Label>
                <Input 
                  value={santriData.kelas_sekolah || ''}
                  onChange={(e) => onChange({ kelas_sekolah: e.target.value })}
                  placeholder="Contoh: 1, 2, 3, X, XI, XII"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Nomor Wali Kelas</Label>
                <Input 
                  value={santriData.nomor_wali_kelas || ''}
                  onChange={(e) => onChange({ nomor_wali_kelas: e.target.value })}
                  placeholder="Nomor WhatsApp wali kelas"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Informasi sekolah diperlukan untuk bantuan pendidikan formal
            </p>
          </div>
        )}


        {/* Status Sosial moved to Document Upload section as per user request */}

        {/* Additional fields for Binaan Mukim */}
        {isMukim && (
          <div className="pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-6 rounded-lg space-y-5">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Informasi Tambahan (Binaan Mukim)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Anak Ke- <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="number"
                  min="1"
                  value={santriData.anak_ke || ''}
                  onChange={(e) => onChange({ anak_ke: parseInt(e.target.value) || undefined })}
                  placeholder="1"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Jumlah Saudara <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="number"
                  min="0"
                  value={santriData.jumlah_saudara || ''}
                  onChange={(e) => onChange({ jumlah_saudara: parseInt(e.target.value) || undefined })}
                  placeholder="0"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Hobi <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={santriData.hobi || ''}
                  onChange={(e) => onChange({ hobi: e.target.value })}
                  placeholder="Membaca, Olahraga, dll"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <p className="text-xs text-slate-500">Wajib diisi untuk Binaan Mukim</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Cita-cita <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={santriData.cita_cita || ''}
                  onChange={(e) => onChange({ cita_cita: e.target.value })}
                  placeholder="Dokter, Guru, dll"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <p className="text-xs text-slate-500">Wajib diisi untuk Binaan Mukim</p>
              </div>
            </div>
          </div>
        )}

        {/* Administrative Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Tanggal Masuk <span className="text-red-500">*</span>
            </Label>
            <Input 
              type="date"
              value={santriData.tanggal_masuk || ''}
              onChange={(e) => onChange({ tanggal_masuk: e.target.value })}
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Angkatan</Label>
            <Input 
              value={santriData.angkatan || ''}
              readOnly
              className="bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed"
              placeholder="Auto dari tanggal masuk"
            />
            <p className="text-xs text-slate-500">Otomatis dari tahun tanggal masuk</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalStep;

