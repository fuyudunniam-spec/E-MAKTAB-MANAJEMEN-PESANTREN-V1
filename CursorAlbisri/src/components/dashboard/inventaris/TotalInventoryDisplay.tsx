import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TotalInventoryDisplayProps {
  totalItems: number;
  totalValue: number;
  onAddItem?: () => void;
  onAddTransaction?: () => void;
}

const TotalInventoryDisplay: React.FC<TotalInventoryDisplayProps> = ({
  totalItems,
  totalValue,
  onAddItem,
  onAddTransaction
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Clean Total Inventory Card */}
      <Card className="border border-gray-200 rounded-xl shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Inventaris</h2>
          </div>

          {/* Inventory Display */}
          <div className="mb-5">
            <div className="text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
              {totalItems}
            </div>
            <p className="text-xs text-gray-500">
              Item dalam inventaris
            </p>
            <div className="mt-3 text-lg font-medium text-gray-700">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-gray-500">
              Nilai total inventaris
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onAddTransaction}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
              Transaksi
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onAddItem}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" />
              Item Baru
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {totalItems}
          </div>
          <div className="text-xs text-gray-500">
            Total Item
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-xs text-gray-500">
            Nilai Total
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalInventoryDisplay;

