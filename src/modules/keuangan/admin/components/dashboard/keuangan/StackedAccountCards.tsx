import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign,
  Building2,
  PiggyBank,
  Wallet,
  Plus,
  Edit,
  Trash2,
  History,
  MoreHorizontal,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { AkunKas } from '@/modules/keuangan/services/akunKas.service';

interface StackedAccountCardsProps {
  accounts: AkunKas[];
  selectedAccountId?: string;
  onSelectAccount: (accountId: string | undefined) => void;
  onAddAccount: () => void;
  onEditAccount?: (account: AkunKas) => void;
  onDeleteAccount?: (account: AkunKas) => void;
  onViewTransactions?: (accountId: string) => void;
  onSetDefaultAccount?: (accountId: string) => void;
}

const StackedAccountCards: React.FC<StackedAccountCardsProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onViewTransactions,
  onSetDefaultAccount
}) => {
  const [stackOrder, setStackOrder] = useState<string[]>([]);

  // Create stable navigation order (doesn't change on click - used for prev/next logic)
  const navigationOrder = useMemo(() => {
    const activeAccounts = accounts.filter(account => account.status === 'aktif');
    return activeAccounts
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(account => account.id);
  }, [accounts]);

  // Initialize stack order when accounts change
  useEffect(() => {
    const activeAccounts = accounts.filter(account => account.status === 'aktif');
    const sortedAccounts = [...activeAccounts].sort((a, b) => {
      // Put selected account first, then by default status, then by creation date
      if (selectedAccountId) {
        if (a.id === selectedAccountId) return -1;
        if (b.id === selectedAccountId) return 1;
      }
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setStackOrder(sortedAccounts.map(account => account.id));
    
    // Debug logging
    console.log('StackedAccountCards - Stack order updated:', {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      accountNames: activeAccounts.map(a => a.nama),
      stackOrder: sortedAccounts.map(account => account.id),
      navigationOrder,
      selectedAccountId,
      navigationIndex: navigationOrder.findIndex(id => id === selectedAccountId),
      willShowNavigation: activeAccounts.length > 1
    });
  }, [accounts, selectedAccountId]);

  const getAccountIcon = (tipe: string) => {
    switch (tipe) {
      case 'Kas':
        return <Wallet className="h-5 w-5" />;
      case 'Bank':
        return <Building2 className="h-5 w-5" />;
      case 'Tabungan':
        return <PiggyBank className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getAccountColors = (tipe: string) => {
    switch (tipe) {
      case 'Kas':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
          text: 'text-yellow-900',
          border: 'border-yellow-300',
          shadow: 'shadow-yellow-100'
        };
      case 'Bank':
        return {
          bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
          text: 'text-white',
          border: 'border-slate-600',
          shadow: 'shadow-slate-100'
        };
      case 'Tabungan':
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          text: 'text-white',
          border: 'border-purple-400',
          shadow: 'shadow-purple-100'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-400 to-gray-500',
          text: 'text-white',
          border: 'border-gray-300',
          shadow: 'shadow-gray-100'
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardClick = (accountId: string) => {
    // Move clicked card to front of stack
    const newOrder = [
      accountId,
      ...stackOrder.filter(id => id !== accountId)
    ];
    setStackOrder(newOrder);
    
    // Trigger selection
    onSelectAccount(accountId);
  };

  const handleAddAccount = () => {
    onAddAccount();
  };

  const handleEditAccount = (account: AkunKas, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditAccount) {
      onEditAccount(account);
    }
  };

  const handleDeleteAccount = (account: AkunKas, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteAccount) {
      onDeleteAccount(account);
    }
  };

  const handleViewTransactions = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewTransactions) {
      onViewTransactions(accountId);
    }
  };

  // Get accounts in stack order
  const stackedAccounts = stackOrder
    .map(id => accounts.find(account => account.id === id))
    .filter(Boolean) as AkunKas[];

  if (stackedAccounts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Akun Kas</h3>
          <Button size="sm" onClick={handleAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Akun
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada akun kas</p>
            <p className="text-sm">Klik "Tambah Akun" untuk membuat akun pertama</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">Akun Kas</h3>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleAddAccount}
          className="border-gray-200 hover:bg-gray-50 text-gray-700 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Tambah
        </Button>
      </div>

      {/* Minimal Navigation Controls */}
      {stackedAccounts.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = navigationOrder.findIndex(id => id === selectedAccountId);
              if (currentIndex > 0) {
                handleCardClick(navigationOrder[currentIndex - 1]);
              }
            }}
            disabled={navigationOrder.findIndex(id => id === selectedAccountId) === 0}
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1.5">
            {navigationOrder.map((accountId, idx) => {
              const isSelected = selectedAccountId === accountId;
              return (
                <button
                  key={accountId}
                  onClick={() => handleCardClick(accountId)}
                  className={`h-1.5 rounded-full transition-all ${
                    isSelected 
                      ? 'w-6 bg-gray-900' 
                      : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = navigationOrder.findIndex(id => id === selectedAccountId);
              if (currentIndex < navigationOrder.length - 1) {
                handleCardClick(navigationOrder[currentIndex + 1]);
              }
            }}
            disabled={navigationOrder.findIndex(id => id === selectedAccountId) === navigationOrder.length - 1}
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modern Stacked Cards Container */}
      <div className="relative h-64 max-w-sm mx-auto">
        {stackedAccounts.map((account, index) => {
          const colors = getAccountColors(account.tipe);
          const isSelected = selectedAccountId === account.id;
          const isTop = index === 0;
          
          // Calculate positioning and z-index for stacking effect
          const translateY = index * 10;
          const translateX = index * 1.5;
          const zIndex = stackedAccounts.length - index;
          const opacity = isTop ? 1 : 0.7 - (index * 0.15);
          
          return (
            <div
              key={account.id}
              className={`absolute w-full cursor-pointer transition-all duration-300 ease-out ${
                isSelected ? 'ring-2 ring-gray-900 ring-offset-2' : ''
              }`}
              style={{
                transform: `translateY(${translateY}px) translateX(${translateX}px)`,
                zIndex,
                opacity
              }}
              onClick={() => handleCardClick(account.id)}
            >
              <Card className={`${colors.bg} border-0 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardContent className="p-5 text-white">
                  {/* Minimal Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        {getAccountIcon(account.tipe)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{account.nama}</h4>
                        <p className="text-xs opacity-70">{account.kode}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {!account.is_default && onSetDefaultAccount && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetDefaultAccount(account.id); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 mr-2"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.462 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L2.52 10.385a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L10.96 3.5z"/></svg>
                            Jadikan Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => handleEditAccount(account, e)}>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleViewTransactions(account.id, e)}>
                          <History className="h-3.5 w-3.5 mr-2" />
                          Riwayat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteAccount(account, e)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Balance Display */}
                  <div className="text-center py-3">
                    <div className="text-2xl font-semibold mb-2 tracking-tight">
                      {formatCurrency(account.saldo_saat_ini)}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-md px-2.5 py-1 text-xs font-medium">
                        {account.tipe}
                      </div>
                    </div>
                  </div>

                  {/* Account Details - Only show if exists */}
                  {account.nomor_rekening && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs opacity-75 space-y-0.5">
                        <div className="flex justify-between">
                          <span>No. Rek:</span>
                          <span className="font-medium">{account.nomor_rekening}</span>
                        </div>
                        {account.nama_bank && (
                          <div className="flex justify-between">
                            <span>Bank:</span>
                            <span className="font-medium">{account.nama_bank}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StackedAccountCards;
