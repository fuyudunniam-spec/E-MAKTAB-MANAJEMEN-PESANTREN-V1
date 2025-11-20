import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, User, CheckCircle, XCircle } from 'lucide-react';
import { PendingDonation } from '@/services/inventarisDashboard.service';

interface DonationItemsModalProps {
  donation: PendingDonation | null;
  open: boolean;
  onClose: () => void;
}

const DonationItemsModal: React.FC<DonationItemsModalProps> = ({ donation, open, onClose }) => {
  if (!donation) return null;

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

  // Filter hanya item inventory (exclude direct_consumption)
  const inventoryItems = donation.items.filter(item => item.item_type === 'inventory');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detail Barang Donasi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Donor Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{donation.donor_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(donation.donation_date)}</span>
              <span>•</span>
              <Badge variant="outline">
                {donation.donation_type === 'mixed' ? 'Campuran' : 'Barang'}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Daftar Barang untuk Dimasukkan ke Gudang ({inventoryItems.length} item)
            </h3>
            <div className="space-y-2">
              {inventoryItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada barang yang perlu dimasukkan ke gudang</p>
                  <p className="text-xs mt-2">Semua item adalah kategori makanan (langsung dikonsumsi)</p>
                </div>
              ) : (
                inventoryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                ))
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Catatan:</strong> Gunakan daftar ini untuk membandingkan dengan barang fisik yang diterima. 
              Setelah dipastikan sesuai, klik "Post ke Gudang" untuk memproses.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationItemsModal;

