import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus, FileText, ArrowUpRight } from 'lucide-react';

interface TotalDonationDisplayProps {
  totalDonation: number;
  donorCount: number;
  selectedDonor?: string | null;
  onAddDonation?: () => void;
  onViewReports?: () => void;
  onViewAllDonors?: () => void;
}

const TotalDonationDisplay: React.FC<TotalDonationDisplayProps> = ({
  totalDonation,
  donorCount,
  selectedDonor,
  onAddDonation,
  onViewReports,
  onViewAllDonors
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSubtitle = () => {
    if (selectedDonor) {
      return `Donasi dari ${selectedDonor}`;
    }
    return `Total dari ${donorCount} donatur`;
  };

  return (
    <div className="space-y-4">
      {/* Clean Total Donation Card */}
      <Card className="border border-gray-200 rounded-xl shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Donasi</h2>
            {selectedDonor && onViewAllDonors && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAllDonors}
                className="text-xs text-gray-500 hover:text-gray-900 h-7 px-2"
              >
                Semua
              </Button>
            )}
          </div>

          {/* Donation Display */}
          <div className="mb-5">
            <div className="text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
              {formatCurrency(totalDonation)}
            </div>
            <p className="text-xs text-gray-500">
              {selectedDonor 
                ? `Donasi dari ${selectedDonor}` 
                : `Dari ${donorCount} donatur aktif`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onAddDonation}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Tambah Donasi
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onViewReports}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {donorCount}
          </div>
          <div className="text-xs text-gray-500">
            Donatur Aktif
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {selectedDonor ? '1' : donorCount}
          </div>
          <div className="text-xs text-gray-500">
            {selectedDonor ? 'Dipilih' : 'Total'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalDonationDisplay;

