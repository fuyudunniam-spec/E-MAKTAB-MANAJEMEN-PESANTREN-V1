import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Calendar, User, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { PendingDonation } from '@/modules/inventaris/services/inventarisDashboard.service';

interface AllDonationsModalProps {
  donations: PendingDonation[];
  open: boolean;
  onClose: () => void;
  onPostToStock: (donationId: string) => void;
  onViewDonation: (donation: PendingDonation) => void;
}

const AllDonationsModal: React.FC<AllDonationsModalProps> = ({ 
  donations, 
  open, 
  onClose,
  onPostToStock,
  onViewDonation
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Semua Donasi Belum Diposting ({donations.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {donations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada donasi yang perlu diposting ke gudang</p>
            </div>
          ) : (
            donations.map((donation) => {
              // Filter hanya item inventory (exclude direct_consumption)
              const inventoryItems = donation.items.filter(item => item.item_type === 'inventory');
              
              if (inventoryItems.length === 0) return null;
              
              return (
                <div
                  key={donation.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  {/* Donor Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{donation.donor_name}</span>
                        <Badge variant="outline">
                          {donation.donation_type === 'mixed' ? 'Campuran' : 'Barang'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(donation.donation_date)}</span>
                        <span>•</span>
                        <span>{inventoryItems.length} item untuk gudang</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDonation(donation)}
                        className="text-xs h-7"
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onPostToStock(donation.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7"
                      >
                        Post ke Gudang
                      </Button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {inventoryItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{item.raw_item_name}</span>
                            {item.mapped_item_id ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ter-mapping
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Item Baru
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Jumlah: <span className="font-medium">{item.quantity}</span> {item.uom}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-800">
            <strong>Catatan:</strong> Gunakan daftar ini untuk membandingkan dengan barang fisik yang diterima. 
            Setelah dipastikan sesuai, klik "Post ke Gudang" untuk memproses. Item kategori makanan (direct_consumption) tidak ditampilkan karena tidak masuk inventaris.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllDonationsModal;

