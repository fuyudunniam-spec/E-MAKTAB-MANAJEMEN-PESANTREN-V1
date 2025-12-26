import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  type RancanganPelayanan, 
  PILAR_PELAYANAN_CONFIG,
  type PilarPelayanan
} from '@/services/rancanganPelayanan.service';
import { cn } from '@/lib/utils';
import { User, Calendar, Target, TrendingUp, Heart, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RancanganPelayananService } from '@/services/rancanganPelayanan.service';
import { toast } from 'sonner';
import RancanganProgressBar from './RancanganProgressBar';

interface RancanganDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rancangan: RancanganPelayanan | null;
  onClone?: (rancangan: RancanganPelayanan) => void;
}

const RancanganDetailModal: React.FC<RancanganDetailModalProps> = ({
  open,
  onOpenChange,
  rancangan,
  onClone
}) => {
  const [cloning, setCloning] = React.useState(false);

  const handleClone = async () => {
    if (!rancangan) return;
    
    const tahunBaru = new Date().getFullYear() + 1;
    const confirmClone = confirm(
      `Apakah Anda yakin ingin menyalin rancangan ini ke tahun ${tahunBaru}?`
    );
    
    if (!confirmClone) return;

    try {
      setCloning(true);
      await RancanganPelayananService.cloneRancangan(rancangan.id, tahunBaru);
      toast.success(`Rancangan berhasil disalin ke tahun ${tahunBaru}`);
      onClone?.(rancangan);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error cloning rancangan:', error);
      toast.error(error.message || 'Gagal menyalin rancangan');
    } finally {
      setCloning(false);
    }
  };
  if (!rancangan) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'selesai':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dibatalkan':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPilarColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      slate: '#64748b',
      blue: '#3b82f6',
      green: '#22c55e',
      orange: '#f97316'
    };
    return colorMap[color] || '#64748b';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Detail Rancangan Pelayanan
            </DialogTitle>
            {onClone && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClone}
                disabled={cloning}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {cloning ? 'Menyalin...' : 'Salin ke Tahun Berikutnya'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Santri Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Santri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                {rancangan.santri?.foto_profil && (
                  <img
                    src={rancangan.santri.foto_profil}
                    alt={rancangan.santri.nama_lengkap}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-lg text-gray-900">
                    {rancangan.santri?.nama_lengkap || 'Santri'}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    {rancangan.santri?.id_santri || ''}
                  </div>
                  {rancangan.santri?.jenjang_sekolah && (
                    <Badge className="mt-1">
                      {rancangan.santri.jenjang_sekolah}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rancangan Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informasi Rancangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Tahun</div>
                  <div className="font-semibold text-gray-900">{rancangan.tahun}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Periode</div>
                  <div className="font-semibold text-gray-900">
                    {rancangan.periode || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <Badge className={cn('mt-1', getStatusBadgeColor(rancangan.status))}>
                    {rancangan.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status Pemenuhan</div>
                  <Badge className={cn('mt-1', {
                    'bg-green-100 text-green-800 border-green-200': rancangan.status_pemenuhan === 'tercukupi',
                    'bg-blue-100 text-blue-800 border-blue-200': rancangan.status_pemenuhan === 'terlayani',
                    'bg-gray-100 text-gray-800 border-gray-200': rancangan.status_pemenuhan === 'belum_terpenuhi'
                  })}>
                    {rancangan.status_pemenuhan === 'tercukupi' ? 'Tercukupi' :
                     rancangan.status_pemenuhan === 'terlayani' ? 'Terlayani' :
                     'Belum Terpenuhi'}
                  </Badge>
                </div>
              </div>
              {rancangan.catatan && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-500 mb-1">Catatan</div>
                  <div className="text-sm text-gray-900">{rancangan.catatan}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Pemenuhan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RancanganProgressBar
                persentase={rancangan.persentase_pemenuhan}
                target={rancangan.total_target}
                dukungan={rancangan.total_dukungan}
                statusPemenuhan={rancangan.status_pemenuhan}
              />
            </CardContent>
          </Card>

          {/* Pilar Pelayanan */}
          {rancangan.pilar && rancangan.pilar.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Pilar Pelayanan ({rancangan.pilar.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rancangan.pilar.map((pilar) => {
                    const config = PILAR_PELAYANAN_CONFIG[pilar.pilar];
                    const persentasePilar = pilar.target_biaya > 0 
                      ? (pilar.dukungan_masuk / pilar.target_biaya) * 100 
                      : 0;
                    
                    return (
                      <div
                        key={pilar.id}
                        className="p-4 border rounded-lg border-l-4"
                        style={{
                          borderLeftColor: getPilarColor(config.color)
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {config.label}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {config.description}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(pilar.target_biaya)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Dukungan:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(pilar.dukungan_masuk)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                            <div
                              className={cn('h-full transition-all', {
                                'bg-green-500': persentasePilar >= 100,
                                'bg-blue-500': persentasePilar >= 50 && persentasePilar < 100,
                                'bg-gray-400': persentasePilar < 50
                              })}
                              style={{ width: `${Math.min(persentasePilar, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {persentasePilar.toFixed(1)}%
                          </div>
                        </div>

                        {pilar.catatan && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-gray-500">Catatan:</div>
                            <div className="text-xs text-gray-700 mt-1">{pilar.catatan}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Riwayat Dukungan */}
          {rancangan.riwayat_dukungan && rancangan.riwayat_dukungan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Riwayat Dukungan ({rancangan.riwayat_dukungan.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rancangan.riwayat_dukungan.map((dukungan) => (
                    <div
                      key={dukungan.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {dukungan.donor_name || 'Donatur'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(dukungan.tanggal_dukungan)}
                          </div>
                          {dukungan.catatan && (
                            <div className="text-sm text-gray-600 mt-2">
                              {dukungan.catatan}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(dukungan.jumlah_dukungan)}
                          </div>
                          <Badge
                            className={cn('mt-1 text-xs', {
                              'bg-green-100 text-green-800': dukungan.status === 'terkonfirmasi',
                              'bg-yellow-100 text-yellow-800': dukungan.status === 'pending',
                              'bg-red-100 text-red-800': dukungan.status === 'dibatalkan'
                            })}
                          >
                            {dukungan.status === 'terkonfirmasi' ? 'Terkonfirmasi' :
                             dukungan.status === 'pending' ? 'Pending' :
                             'Dibatalkan'}
                          </Badge>
                        </div>
                      </div>
                      {dukungan.alokasi_per_pilar && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                          <div className="font-medium mb-1">Alokasi per Pilar:</div>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(dukungan.alokasi_per_pilar).map(([pilar, nominal]) => (
                              <div key={pilar} className="flex justify-between">
                                <span>{PILAR_PELAYANAN_CONFIG[pilar as PilarPelayanan]?.label}:</span>
                                <span className="font-mono">{formatCurrency(nominal as number)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Dibuat: {formatDate(rancangan.created_at)}</div>
            <div>Diperbarui: {formatDate(rancangan.updated_at)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RancanganDetailModal;

