import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Eye } from 'lucide-react';
import { AkunKas } from '@/services/akunKas.service';

interface TotalBalanceDisplayProps {
  totalBalance: number;
  accountCount: number;
  selectedAccount?: AkunKas | null;
  hutangKeYayasan?: number; // NEW: Amount to be deposited to Yayasan
  onTransfer?: () => void;
  onRequest?: () => void;
  onViewAllAccounts?: () => void;
}


const TotalBalanceDisplay: React.FC<TotalBalanceDisplayProps> = ({
  totalBalance,
  accountCount,
  selectedAccount,
  hutangKeYayasan = 0,
  onTransfer,
  onRequest,
  onViewAllAccounts
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSubtitle = () => {
    if (selectedAccount) {
      return `Saldo dari ${selectedAccount.nama}`;
    }
    return `Total semua akun (${accountCount} akun)`;
  };

  const getCapitalDescription = () => {
    if (selectedAccount) {
      return `Akun ${selectedAccount.tipe} dengan saldo terkini`;
    }
    return `Modal terdiri dari ${accountCount} sumber`;
  };

  return (
    <div className="space-y-4">
      {/* Clean Total Balance Card */}
      <Card className="border border-gray-200 rounded-xl shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Saldo</h2>
            {selectedAccount && onViewAllAccounts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllAccounts}
                className="text-xs text-gray-500 hover:text-gray-900 h-7 px-2"
              >
                Semua
              </Button>
            )}
          </div>

          {/* Balance Display */}
          <div className="mb-5">
            <div className="text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-gray-500">
              {selectedAccount
                ? `Saldo dari ${selectedAccount.nama}`
                : `Dari ${accountCount} akun aktif`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onTransfer}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
              Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={onRequest}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" />
              Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hutang ke Yayasan Breakdown (if applicable) */}
      {hutangKeYayasan > 0 && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-3">
            Breakdown Saldo
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Milik Koperasi</span>
              <span className="text-sm font-semibold text-green-700">
                {formatCurrency(totalBalance - hutangKeYayasan)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hutang ke Yayasan</span>
              <span className="text-sm font-semibold text-amber-700">
                {formatCurrency(hutangKeYayasan)}
              </span>
            </div>
            <div className="border-t border-amber-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(totalBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {accountCount}
          </div>
          <div className="text-xs text-gray-500">
            Akun Aktif
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-xl font-semibold text-gray-900 mb-0.5">
            {selectedAccount ? '1' : accountCount}
          </div>
          <div className="text-xs text-gray-500">
            {selectedAccount ? 'Dipilih' : 'Total'}
          </div>
        </div>
      </div>
    </div>
  );
};


export default TotalBalanceDisplay;
