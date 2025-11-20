import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, DollarSign, FileText, Download, RefreshCw, Eye } from 'lucide-react';
import DoubleEntryMonitor from '@/components/DoubleEntryMonitor';
import { useQuery } from '@tanstack/react-query';
import { getAutoPostedSummary, reconcileAutoPostedTransactions, getOrphanedKeuangan, monitorDoubleEntry } from '@/services/keuangan.service';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/inventaris.utils';

const KeuanganAuditPage = () => {
  const [showDetails, setShowDetails] = useState(true);

  // Fetch audit data
  const { data: autoPostedSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['auto-posted-summary'],
    queryFn: () => getAutoPostedSummary(),
    staleTime: 60000
  });

  const { data: doubleEntries, isLoading: doubleEntriesLoading, refetch: refetchDoubleEntries } = useQuery({
    queryKey: ['double-entries'],
    queryFn: monitorDoubleEntry,
    staleTime: 60000
  });

  const { data: orphanedEntries, isLoading: orphanedLoading } = useQuery({
    queryKey: ['orphaned-entries'],
    queryFn: getOrphanedKeuangan,
    staleTime: 60000
  });

  const { data: reconciliationData, isLoading: reconciliationLoading } = useQuery({
    queryKey: ['reconciliation-data'],
    queryFn: reconcileAutoPostedTransactions,
    staleTime: 60000
  });

  const isLoading = summaryLoading || doubleEntriesLoading || orphanedLoading || reconciliationLoading;

  // Calculate stats
  const totalAutoPosted = autoPostedSummary?.reduce((sum, item) => sum + item.transaction_count, 0) || 0;
  const totalDoubleEntries = doubleEntries?.length || 0;
  const totalOrphaned = orphanedEntries?.length || 0;
  const isHealthy = totalDoubleEntries === 0 && totalOrphaned === 0;

  const handleReconcile = async () => {
    try {
      await reconcileAutoPostedTransactions();
      toast.success('Rekonsiliasi berhasil dilakukan');
      refetchSummary();
      refetchDoubleEntries();
    } catch (error: any) {
      console.error('Error reconciling:', error);
      toast.error('Gagal melakukan rekonsiliasi: ' + error.message);
    }
  };

  const handleExportReport = () => {
    try {
      const reportData = [
        {
          'Tanggal Export': new Date().toISOString().split('T')[0],
          'Total Auto-Posted': totalAutoPosted,
          'Double Entries': totalDoubleEntries,
          'Orphaned Entries': totalOrphaned,
          'Status': isHealthy ? 'Healthy' : 'Issues Found'
        },
        ...(autoPostedSummary?.map(item => ({
          'Module': item.source_module,
          'Jumlah Transaksi': item.transaction_count,
          'Total Amount': item.total_amount,
          'Rata-rata': item.avg_amount
        })) || [])
      ];

      exportToCSV(reportData, `audit_keuangan_${new Date().toISOString().split('T')[0]}`);
      toast.success('Laporan berhasil diekspor');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Gagal mengekspor laporan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Keuangan</h1>
          <p className="text-muted-foreground">
            Monitor dan audit transaksi auto-posted untuk mencegah double entry
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              refetchSummary();
              refetchDoubleEntries();
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showDetails ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Posted</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? '...' : totalAutoPosted}
            </div>
            <p className="text-xs text-muted-foreground">
              Transaksi auto-posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potensi Duplikasi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDoubleEntries > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {isLoading ? '...' : totalDoubleEntries}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDoubleEntries > 0 ? 'Perlu review' : 'Tidak ada masalah'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned Entries</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalOrphaned > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {isLoading ? '...' : totalOrphaned}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalOrphaned > 0 ? 'Entri tanpa source' : 'Semua valid'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className={`h-4 w-4 ${isHealthy ? 'text-green-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isHealthy ? 'text-green-600' : 'text-orange-600'}`}>
              {isLoading ? '...' : (isHealthy ? 'Healthy' : 'Issues')}
            </div>
            <p className="text-xs text-muted-foreground">
              {isHealthy ? 'Sistem berjalan normal' : 'Perlu perhatian'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button 
              className="flex items-center gap-2"
              onClick={handleReconcile}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4" />
              Reconcile Transactions
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowDetails(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Duplicates
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Double Entry Monitor */}
      <DoubleEntryMonitor 
        showDetails={showDetails}
        autoRefresh={true}
        refreshInterval={60000}
      />
    </div>
  );
};

export default KeuanganAuditPage;