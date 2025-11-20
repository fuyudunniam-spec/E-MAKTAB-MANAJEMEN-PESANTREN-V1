import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleHeader from '@/components/ModuleHeader';
import ItemList from './components/ItemList';
import StockOpname from './components/StockOpname';
import StockExpiryTable from './components/StockExpiryTable';
import { Package, ClipboardList, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { getLowStock, getNearExpiry } from '@/services/inventaris.service';
import { useToast } from '@/hooks/use-toast';

const InventarisMasterPage = () => {
    const [activeTab, setActiveTab] = useState('items');
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [expiredItems, setExpiredItems] = useState<any[]>([]);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (activeTab === 'expiry') {
            fetchAlertData();
        }
    }, [activeTab]);

    const fetchAlertData = async () => {
        setIsLoadingAlerts(true);
        try {
            const [lowStock, expired] = await Promise.all([
                getLowStock(10),
                getNearExpiry(30)
            ]);

            setLowStockItems(lowStock || []);
            setExpiredItems(expired || []);
        } catch (error) {
            console.error('Error fetching alert data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data peringatan',
                variant: 'destructive'
            });
            setLowStockItems([]);
            setExpiredItems([]);
        } finally {
            setIsLoadingAlerts(false);
        }
    };

    const tabs = [
        { label: 'Dashboard', path: '/inventaris' },
        { label: 'Master Data', path: '/inventaris/master' },
        { label: 'Penjualan', path: '/inventaris/sales' },
        { label: 'Distribusi', path: '/inventaris/distribution' }
    ];

    return (
        <div className="space-y-6">
            <ModuleHeader title="Master Data Inventaris" tabs={tabs} />

            <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="items" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Data Barang
                    </TabsTrigger>
                    <TabsTrigger value="stock-opname" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Stok Opname
                    </TabsTrigger>
                    <TabsTrigger value="expiry" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Kedaluwarsa
                    </TabsTrigger>
                    <TabsTrigger value="import-export" className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Import/Export
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="mt-6">
                    <ItemList />
                </TabsContent>

                <TabsContent value="stock-opname" className="mt-6">
                    <StockOpname />
                </TabsContent>

                <TabsContent value="expiry" className="mt-6">
                    <StockExpiryTable 
                        lowStockItems={lowStockItems}
                        expiredItems={expiredItems}
                        isLoading={isLoadingAlerts}
                    />
                </TabsContent>

                <TabsContent value="import-export" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import/Export Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Fitur import/export sedang dalam pengembangan.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InventarisMasterPage;
