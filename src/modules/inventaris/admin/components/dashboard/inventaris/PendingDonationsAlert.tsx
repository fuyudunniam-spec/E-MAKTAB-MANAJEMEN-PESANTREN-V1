import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, ArrowRight, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PendingDonation } from '@/modules/inventaris/services/inventarisDashboard.service';

interface PendingDonationsAlertProps {
  pendingDonations: PendingDonation[];
  onPostToStock: (donationId: string) => void;
  onViewDonation?: (donationId: string) => void;
}

const PendingDonationsAlert: React.FC<PendingDonationsAlertProps> = ({
  pendingDonations,
  onPostToStock,
  onViewDonation
}) => {
  if (pendingDonations.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base font-semibold text-orange-900">
              Donasi Belum Diposting ke Gudang
            </CardTitle>
            <Badge className="bg-orange-200 text-orange-800 border-orange-300">
              {pendingDonations.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-orange-800">
          Ada {pendingDonations.length} donasi dengan item yang belum diposting ke inventaris. 
          Klik tombol "Post ke Gudang" untuk memproses.
        </p>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {pendingDonations.slice(0, 5).map((donation) => (
            <div
              key={donation.id}
              className="bg-white rounded-lg border border-orange-200 p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {donation.donor_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {donation.donation_type === 'mixed' ? 'Campuran' : 'Barang'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(donation.donation_date)}</span>
                    <span>•</span>
                    <Package className="h-3 w-3" />
                    <span>{donation.items_count} item</span>
                  </div>
                  
                  <div className="space-y-1">
                    {donation.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                        <span className="truncate">
                          {item.raw_item_name} ({item.quantity} {item.uom})
                        </span>
                        {!item.mapped_item_id && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            Item Baru
                          </Badge>
                        )}
                      </div>
                    ))}
                    {donation.items.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{donation.items.length - 3} item lainnya
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onPostToStock(donation.id)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-3"
                  >
                    <Package className="h-3 w-3 mr-1.5" />
                    Post ke Gudang
                  </Button>
                  {onViewDonation && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDonation(donation.id)}
                      className="text-xs h-8 px-3 border-gray-300"
                    >
                      <ArrowRight className="h-3 w-3 mr-1.5" />
                      Lihat Detail
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {pendingDonations.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-xs text-orange-700">
              Dan {pendingDonations.length - 5} donasi lainnya...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingDonationsAlert;

