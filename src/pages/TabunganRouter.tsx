import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Tabungan from './Tabungan';
import TabunganSantriMy from '@/modules/santri/pages/TabunganSantriMy';

export default function TabunganRouter() {
  const { user } = useAuth();
  if (user?.role === 'santri' && user?.santriId) {
    return <TabunganSantriMy />;
  }
  return <Tabungan />;
}


