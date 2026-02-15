import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Trash2, AlertCircle, Star } from "lucide-react";
import { toast } from 'sonner';
import { WaliData } from '@/modules/santri/shared/types/santri.types';

interface WaliStepProps {
  waliData: WaliData[];
  onChange: (waliData: WaliData[]) => void;
  isBinaan: boolean;
  isMukim: boolean;
}

const WaliStep: React.FC<WaliStepProps> = ({
  waliData,
  onChange,
  isBinaan,
  isMukim
}) => {
  const updateWali = (index: number, field: keyof WaliData, value: any) => {
    const updated = [...waliData];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addWali = () => {
    onChange([
      ...waliData,
      {
        nama_lengkap: '',
        hubungan_keluarga: 'Paman',
        no_whatsapp: '',
        alamat: '',
        is_utama: false
      }
    ]);
  };

  const removeWali = (index: number) => {
    if (waliData[index].is_utama) {
      toast.error('Wali utama tidak bisa dihapus');
      return;
    }
    onChange(waliData.filter((_, i) => i !== index));
  };

  const setAsUtama = (index: number) => {
    const updated = waliData.map((w, i) => ({
      ...w,
      is_utama: i === index
    }));
    onChange(updated);
  };

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="text-xl font-semibold flex items-center gap-2.5 text-slate-800">
          <div className="p-2 rounded-lg bg-blue-50">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          Data Wali
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {isMukim && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Binaan Mukim:</strong> Harap isi data Wali Utama dan minimal 1 Wali Pendamping untuk kontak darurat.
            </AlertDescription>
          </Alert>
        )}

        {waliData.map((wali, index) => (
          <div key={index} className={`p-6 border-2 rounded-xl transition-all ${wali.is_utama ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <h4 className="font-semibold text-slate-800 text-base">
                  {wali.is_utama ? '⭐ Wali Utama' : `Wali ${index + 1}`}
                </h4>
                {wali.is_utama && (
                  <Badge variant="default" className="text-xs bg-blue-600">Primary</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {!wali.is_utama && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAsUtama(index)}
                      className="h-7 text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Jadikan Utama
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWali(index)}
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={wali.nama_lengkap || ''}
                  onChange={(e) => updateWali(index, 'nama_lengkap', e.target.value)}
                  placeholder="Masukkan nama wali"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Hubungan Keluarga <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={wali.hubungan_keluarga || ''}
                  onValueChange={(value) => updateWali(index, 'hubungan_keluarga', value)}
                >
                  <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Pilih hubungan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ayah">Ayah</SelectItem>
                    <SelectItem value="Ibu">Ibu</SelectItem>
                    <SelectItem value="Kakek">Kakek</SelectItem>
                    <SelectItem value="Nenek">Nenek</SelectItem>
                    <SelectItem value="Paman">Paman</SelectItem>
                    <SelectItem value="Bibi">Bibi</SelectItem>
                    <SelectItem value="Kakak">Kakak/Adik</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={wali.no_whatsapp || ''}
                  onChange={(e) => updateWali(index, 'no_whatsapp', e.target.value)}
                  placeholder="+62..."
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Alamat</Label>
                <Input 
                  value={wali.alamat || ''}
                  onChange={(e) => updateWali(index, 'alamat', e.target.value)}
                  placeholder="Masukkan alamat wali"
                  className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Economic Data - For Binaan */}
            {isBinaan && (
              <div className="pt-5 border-t border-slate-200 mt-5">
                <h5 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  Data Ekonomi
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Pekerjaan <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      value={wali.pekerjaan || ''}
                      onChange={(e) => updateWali(index, 'pekerjaan', e.target.value)}
                      placeholder="Karyawan Swasta, Wiraswasta, PNS"
                      className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Penghasilan Bulanan <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={wali.penghasilan_bulanan !== undefined && wali.penghasilan_bulanan !== null ? wali.penghasilan_bulanan.toString() : ''}
                      onValueChange={(value) => updateWali(index, 'penghasilan_bulanan', parseFloat(value))}
                    >
                      <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                        <SelectValue placeholder="Pilih range penghasilan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Tidak Ada Penghasilan</SelectItem>
                        <SelectItem value="500000">&lt; Rp 500.000</SelectItem>
                        <SelectItem value="1000000">Rp 500.000 - Rp 1.000.000</SelectItem>
                        <SelectItem value="1500000">Rp 1.000.000 - Rp 1.500.000</SelectItem>
                        <SelectItem value="2000000">Rp 1.500.000 - Rp 2.000.000</SelectItem>
                        <SelectItem value="3000000">Rp 2.000.000 - Rp 3.000.000</SelectItem>
                        <SelectItem value="5000000">Rp 3.000.000 - Rp 5.000.000</SelectItem>
                        <SelectItem value="10000000">&gt; Rp 5.000.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add Wali Button */}
        {(isMukim && waliData.length < 2) || (!isMukim && waliData.length < 3) ? (
          <Button 
            type="button"
            variant="outline"
            onClick={addWali}
            className="w-full border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Wali {isMukim ? 'Pendamping' : 'Lainnya'}
          </Button>
        ) : null}

        {isMukim && waliData.length < 2 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Perhatian:</strong> Binaan Mukim memerlukan minimal 2 wali (Utama + Pendamping) untuk keperluan darurat.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WaliStep;

