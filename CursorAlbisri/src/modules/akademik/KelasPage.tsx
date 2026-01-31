import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MasterKelasPage from './MasterKelasPage';
import PloatingKelasSimple from './PloatingKelasSimple';
import PengajarMasterPage from './PengajarMasterPage';
import MapelMasterPage from './MapelMasterPage';

const KelasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kelas' | 'plotting' | 'pengajar' | 'mapel'>('kelas');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelas & Plotting</h1>
          <p className="text-muted-foreground">Kelola master kelas, penempatan santri, dan master data</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="kelas">Kelas</TabsTrigger>
          <TabsTrigger value="plotting">Plotting</TabsTrigger>
          <TabsTrigger value="pengajar">Pengajar</TabsTrigger>
          <TabsTrigger value="mapel">Mapel</TabsTrigger>
        </TabsList>

        <TabsContent value="kelas" className="mt-4">
          <MasterKelasPage />
        </TabsContent>

        <TabsContent value="plotting" className="mt-4">
          <PloatingKelasSimple />
        </TabsContent>

        <TabsContent value="pengajar" className="mt-4">
          <PengajarMasterPage />
        </TabsContent>

        <TabsContent value="mapel" className="mt-4">
          <MapelMasterPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KelasPage;

