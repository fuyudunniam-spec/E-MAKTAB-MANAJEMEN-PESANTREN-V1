import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Users } from 'lucide-react';
import RancanganProgressBar from './RancanganProgressBar';
import { type RancanganPelayanan, PILAR_PELAYANAN_CONFIG } from '@/services/rancanganPelayanan.service';
import { cn } from '@/lib/utils';

// Helper function untuk mendapatkan warna pilar
const getPilarColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    slate: '148, 163, 184',
    blue: '59, 130, 246',
    green: '34, 197, 94',
    orange: '249, 115, 22'
  };
  return colorMap[color] || '148, 163, 184';
};

interface RancanganCardProps {
  rancangan: RancanganPelayanan;
  onEdit?: (rancangan: RancanganPelayanan) => void;
  onDelete?: (rancangan: RancanganPelayanan) => void;
  onView?: (rancangan: RancanganPelayanan) => void;
  className?: string;
}

const RancanganCard: React.FC<RancanganCardProps> = ({
  rancangan,
  onEdit,
  onDelete,
  onView,
  className
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
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

  return (
    <Card className={cn('hover:shadow-md transition-shadow w-full flex flex-col', className)}>
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1.5 truncate">
              {rancangan.santri?.nama_lengkap || 'Santri'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <span className="font-mono text-xs">{rancangan.santri?.id_santri || ''}</span>
              {rancangan.periode && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="truncate">{rancangan.periode}</span>
                </>
              )}
              <span className="text-gray-300">•</span>
              <span>Tahun {rancangan.tahun}</span>
            </div>
          </div>
          <Badge className={cn('text-xs shrink-0', getStatusBadgeColor(rancangan.status))}>
            {rancangan.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 flex-1">
        {/* Progress Bar */}
        <RancanganProgressBar
          persentase={rancangan.persentase_pemenuhan}
          target={rancangan.total_target}
          dukungan={rancangan.total_dukungan}
          statusPemenuhan={rancangan.status_pemenuhan}
        />

        {/* Pilar Summary */}
        {rancangan.pilar && rancangan.pilar.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Pilar Pelayanan ({rancangan.pilar.length})
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {rancangan.pilar.map((pilar) => {
                const config = PILAR_PELAYANAN_CONFIG[pilar.pilar];
                return (
                  <div
                    key={pilar.id}
                    className="p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border-l-[3px]"
                    style={{
                      borderLeftColor: `rgb(${getPilarColor(config.color)})`
                    }}
                  >
                    <div className="font-medium text-gray-900 text-xs leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
                      {config.label}
                    </div>
                    <div className="text-gray-700 text-xs font-semibold font-mono">
                      {formatCurrency(pilar.target_biaya)}
                    </div>
                    {pilar.dukungan_masuk > 0 && (
                      <div className="text-gray-500 text-[10px] mt-1.5 font-mono">
                        Terkumpul: {formatCurrency(pilar.dukungan_masuk)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dukungan Summary */}
        {rancangan.riwayat_dukungan && rancangan.riwayat_dukungan.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span>{rancangan.riwayat_dukungan.length} dukungan masuk</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(rancangan)}
              className="flex-1 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Detail
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(rancangan)}
              className="flex-1 h-8 text-xs"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rancangan)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RancanganCard;

