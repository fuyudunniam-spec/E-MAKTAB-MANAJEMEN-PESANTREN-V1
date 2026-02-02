import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const RouteFallback = () => (
  <div className="p-6 text-sm text-muted-foreground">Loading...</div>
);

const WithLayout = ({ children }: { children: ReactNode }) => (
  <Layout>
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </Layout>
);

const SuspenseOnly = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<RouteFallback />}>{children}</Suspense>
);

// Route-level lazy loading to keep initial bundle small
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SantriEnhanced = lazy(() => import("@/modules/santri/pages/admin/SantriEnhanced"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const TabunganRouter = lazy(() => import("./pages/TabunganRouter"));
const TabunganSantriAdmin = lazy(() => import("@/modules/santri/pages/admin/TabunganSantriAdmin"));
const LaporanTabungan = lazy(() => import("@/modules/santri/pages/admin/LaporanTabungan"));
const DonasiDashboard = lazy(() => import("./pages/DonasiDashboard"));
const MasterDonatur = lazy(() => import("./pages/MasterDonatur"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminSetupPage = lazy(() => import("./pages/SetupAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SantriOnboarding = lazy(() => import("@/modules/santri/pages/admin/SantriOnboarding"));
const SantriAccountManagement = lazy(() => import("@/modules/santri/pages/admin/SantriAccountManagement"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ProfileLayout = lazy(() => import("./components/ProfileLayout"));
const ProfileRedirect = lazy(() => import("./components/ProfileRedirect"));
const InformasiPage = lazy(() => import("@/modules/santri/pages/profile/InformasiPage"));
const AkademikPage = lazy(() => import("@/modules/santri/pages/profile/AkademikPage"));
const KeuanganPage = lazy(() => import("@/modules/santri/pages/profile/KeuanganPage"));
const TabunganPage = lazy(() => import("@/modules/santri/pages/profile/TabunganPage"));
const LayananPage = lazy(() => import("@/modules/santri/pages/profile/LayananPage"));
const DokumenPage = lazy(() => import("@/modules/santri/pages/profile/DokumenPage"));
const TagihanSantri = lazy(() => import("@/modules/santri/pages/admin/TagihanSantri"));
const DashboardSantri = lazy(() => import("@/modules/santri/pages/admin/DashboardSantri"));
const TabunganSantriMy = lazy(() => import("@/modules/santri/pages/portal/TabunganSantriMy"));

// Public Website Imports
const PSBPage = lazy(() => import("./pages/public/PSBPage"));
const PSBPortal = lazy(() => import("./pages/public/PSBPortal"));
const PSBAuth = lazy(() => import("./pages/public/PSBAuth"));

// Admin Website Imports - Removed unused imports


// Lazy imports for module dashboards
const DashboardAkademik = lazy(() => import('./modules/akademik/DashboardAkademik'));
const MasterKelasPage = lazy(() => import('./modules/akademik/MasterKelasPage'));
const PloatingKelasSimple = lazy(() => import('./modules/akademik/PloatingKelasSimple'));
const KelasPage = lazy(() => import('./modules/akademik/KelasPage'));
const SemesterManagementPage = lazy(() => import('./modules/akademik/SemesterManagementPage'));
const PresensiKelasPage = lazy(() => import('./modules/akademik/PresensiKelasPage'));
const SetoranHarianPage = lazy(() => import('./modules/akademik/SetoranHarianPage'));
const PerizinanSantriPage = lazy(() => import('@/modules/santri/pages/admin/PerizinanSantriPage'));
const JurnalPertemuanPage = lazy(() => import('./modules/akademik/JurnalPertemuanPage'));
const PertemuanPage = lazy(() => import('./modules/akademik/PertemuanPage'));
const DashboardPengajar = lazy(() => import('./modules/akademik/DashboardPengajar'));
const ProfilPengajarPage = lazy(() => import('./modules/akademik/ProfilPengajarPage'));
const InputNilaiPage = lazy(() => import('./modules/akademik/InputNilaiPage'));
const RapotPage = lazy(() => import('./modules/akademik/RapotPage'));
const UserManagementPage = lazy(() => import('./modules/admin/UserManagementPage'));

// Lazy imports for inventory modules
const InventarisMasterPage = lazy(() => import('./modules/inventaris/MasterData/InventarisMasterPage'));
const PenjualanPage = lazy(() => import('./modules/inventaris/Sales/PenjualanPage'));
const DistribusiPage = lazy(() => import('./modules/inventaris/Distribution/DistribusiPage'));
const DistribusiPaketPage = lazy(() => import('./modules/inventaris/Distribution/DistribusiPaketPage'));
const MasterPaketPage = lazy(() => import('./modules/inventaris/Distribution/MasterPaketPage'));
const RiwayatInventarisYayasanPage = lazy(() => import('./modules/inventaris/Transactions/RiwayatInventarisYayasanPage'));
const KeuanganAuditPage = lazy(() => import('@/modules/keuangan/pages/KeuanganAuditPage'));
const KeuanganV3 = lazy(() => import('@/modules/keuangan/pages/KeuanganDashboard'));
const RiwayatPenyaluranBantuanPage = lazy(() => import('./modules/keuangan/PenyaluranBantuan/RiwayatPenyaluranBantuanPage'));
const MasterDataKeuanganPage = lazy(() => import('./modules/keuangan/MasterData/MasterDataKeuanganPage'));
const InventarisDashboard = lazy(() => import('@/modules/inventaris/pages/DashboardInventaris'));

// Lazy imports for koperasi modules
const DashboardKoperasi = lazy(() => import('./modules/koperasi/Dashboard/DashboardKoperasi'));
const MasterProdukPage = lazy(() => import('./modules/koperasi/MasterData/MasterProdukPage'));
const SupplierPage = lazy(() => import('./modules/koperasi/MasterData/SupplierPage'));
const KasirPage = lazy(() => import('./modules/koperasi/Kasir/KasirPage'));
const StockKoperasiPage = lazy(() => import('./modules/koperasi/Inventaris/StockKoperasiPage'));
const TransferInventarisPage = lazy(() => import('./modules/koperasi/Transfer/TransferInventarisPage'));
const RiwayatPenjualanPage = lazy(() => import('./modules/koperasi/Penjualan/RiwayatPenjualanPage'));
const PembelianPage = lazy(() => import('./modules/koperasi/Pembelian/PembelianPage'));
const KeuanganKoperasiPage = lazy(() => import('./modules/koperasi/Keuangan/KeuanganUnifiedPage'));
const KeuanganDashboardKoperasi = lazy(() => import('./modules/koperasi/Keuangan/KeuanganDashboard'));
const KeuanganPembelianPage = lazy(() => import('./modules/koperasi/Keuangan/KeuanganUnifiedPage'));
const KeuanganOperasionalPage = lazy(() => import('./modules/koperasi/Keuangan/KeuanganUnifiedPage'));
const KelolaHPPDanBagiHasilPage = lazy(() => import('./modules/koperasi/Keuangan/KelolaHPPDanBagiHasilPage'));
const LaporanKoperasiPage = lazy(() => import('./modules/koperasi/Laporan/LaporanKoperasiPage'));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/auth" element={<SuspenseOnly><Auth /></SuspenseOnly>} />
              <Route path="/setup-admin" element={<SuspenseOnly><AdminSetupPage /></SuspenseOnly>} />
              {/* SLICE UNIK UNTUK SUPERADMIN - Ganti 'secure-gate' dengan kata sandi url yang anda inginkan */}
              <Route path="/pms/secure-gate" element={<SuspenseOnly><Auth /></SuspenseOnly>} />
              
              {/* Public Website Routes */}
              <Route path="/" element={<SuspenseOnly><PSBPage /></SuspenseOnly>} />
              
              {/* PSB Portal Routes */}
              <Route path="/psb" element={<Navigate to="/" replace />} />
              <Route path="/psb/register" element={<SuspenseOnly><PSBAuth /></SuspenseOnly>} />
              <Route path="/psb/portal" element={<SuspenseOnly><PSBPortal /></SuspenseOnly>} />
              <Route path="/psb/auth" element={<SuspenseOnly><PSBAuth /></SuspenseOnly>} />

              {/* Dashboard Routes */}
              <Route path="/pms" element={
                <WithLayout>
                  <Dashboard />
                </WithLayout>
              } />

              {/* Module Dashboard Routes - Redirected to canonical routes */}
              <Route path="/santri-dashboard" element={<Navigate to="/santri" replace />} />
              <Route path="/keuangan-dashboard" element={<Navigate to="/keuangan-v3" replace />} />
              <Route path="/inventaris-dashboard" element={<Navigate to="/inventaris" replace />} />

              {/* Inventory Module Routes */}
              <Route path="/inventaris" element={
                <WithLayout>
                  <InventarisDashboard />
                </WithLayout>
              } />
              <Route path="/inventaris/master" element={
                <WithLayout>
                  <InventarisMasterPage />
                </WithLayout>
              } />
              {/* Sales removed from yayasan inventory - all sales now through koperasi */}
              <Route path="/inventaris/sales" element={
                <Navigate to="/koperasi/kasir" replace />
              } />
              <Route path="/inventaris/distribution" element={
                <WithLayout>
                  <DistribusiPage />
                </WithLayout>
              } />
              <Route path="/inventaris/distribution/distribusi-paket" element={
                <WithLayout>
                  <DistribusiPaketPage />
                </WithLayout>
              } />
              <Route path="/inventaris/distribution/master-paket" element={
                <WithLayout>
                  <MasterPaketPage />
                </WithLayout>
              } />
              <Route path="/inventaris/riwayat" element={
                <WithLayout>
                  <RiwayatInventarisYayasanPage />
                </WithLayout>
              } />

              {/* Koperasi Module Routes */}
              <Route path="/koperasi" element={
                <WithLayout>
                  <DashboardKoperasi />
                </WithLayout>
              } />
              <Route path="/koperasi/master" element={
                <WithLayout>
                  <MasterProdukPage />
                </WithLayout>
              } />
              <Route path="/koperasi/master/supplier" element={
                <WithLayout>
                  <SupplierPage />
                </WithLayout>
              } />
              <Route path="/koperasi/kasir" element={
                <WithLayout>
                  <KasirPage />
                </WithLayout>
              } />
              <Route path="/koperasi/inventaris" element={
                <WithLayout>
                  <StockKoperasiPage />
                </WithLayout>
              } />
              <Route path="/koperasi/transfer" element={
                <WithLayout>
                  <TransferInventarisPage />
                </WithLayout>
              } />
              <Route path="/koperasi/penjualan" element={
                <WithLayout>
                  <RiwayatPenjualanPage />
                </WithLayout>
              } />
              <Route path="/koperasi/pembelian" element={
                <WithLayout>
                  <PembelianPage />
                </WithLayout>
              } />
              <Route path="/koperasi/keuangan/dashboard" element={
                <WithLayout>
                  <KeuanganDashboardKoperasi />
                </WithLayout>
              } />
              <Route path="/koperasi/keuangan" element={
                <WithLayout>
                  <KeuanganKoperasiPage />
                </WithLayout>
              } />
              <Route path="/koperasi/keuangan/pembelian" element={
                <WithLayout>
                  <KeuanganPembelianPage />
                </WithLayout>
              } />
              <Route path="/koperasi/keuangan/operasional" element={
                <WithLayout>
                  <KeuanganOperasionalPage />
                </WithLayout>
              } />
              <Route path="/koperasi/keuangan/kelola-hpp" element={
                <WithLayout>
                  <KelolaHPPDanBagiHasilPage />
                </WithLayout>
              } />
              <Route path="/koperasi/laporan" element={
                <WithLayout>
                  <LaporanKoperasiPage />
                </WithLayout>
              } />

              {/* Admin & Finance Routes */}
              <Route path="/admin/keuangan-audit" element={
                <WithLayout>
                  <KeuanganAuditPage />
                </WithLayout>
              } />
              <Route path="/admin/users" element={
                <WithLayout>
                  <UserManagementPage />
                </WithLayout>
              } />
              <Route path="/admin/data-master" element={
                <WithLayout>
                  <UserManagementPage />
                </WithLayout>
              } />

              {/* Website Management Routes - Removed as per user request */}
              
              {/* Academic Routes */}
              <Route path="/akademik" element={
                <WithLayout>
                  <DashboardAkademik />
                </WithLayout>
              } />
              <Route path="/akademik/kelas" element={
                <WithLayout>
                  <KelasPage />
                </WithLayout>
              } />
              <Route path="/akademik/master" element={<Navigate to="/akademik/kelas" replace />} />
              <Route path="/akademik/semester" element={
                <WithLayout>
                  <SemesterManagementPage />
                </WithLayout>
              } />
              <Route path="/akademik/presensi" element={<Navigate to="/akademik/pertemuan?tab=presensi" replace />} />
              <Route path="/akademik/setoran" element={
                <WithLayout>
                  <SetoranHarianPage />
                </WithLayout>
              } />
              <Route path="/akademik/pertemuan" element={
                <WithLayout>
                  <PertemuanPage />
                </WithLayout>
              } />
              <Route path="/akademik/jurnal" element={<Navigate to="/akademik/pertemuan?tab=jurnal" replace />} />
              <Route path="/akademik/pengajar" element={
                <WithLayout>
                  <DashboardPengajar />
                </WithLayout>
              } />
              <Route path="/akademik/pengajar/profil" element={
                <WithLayout>
                  <ProfilPengajarPage />
                </WithLayout>
              } />
              <Route path="/akademik/perizinan" element={
                <WithLayout>
                  <PerizinanSantriPage />
                </WithLayout>
              } />
              <Route path="/akademik/nilai" element={
                <WithLayout>
                  <InputNilaiPage />
                </WithLayout>
              } />
              <Route path="/akademik/rapot" element={<Navigate to="/akademik/nilai" replace />} />
              
              <Route path="/administrasi" element={<Navigate to="/admin/users" replace />} />

              {/* Santri Routes */}
              <Route path="/santri" element={
                <WithLayout>
                  <SantriEnhanced />
                </WithLayout>
              } />
              <Route path="/santri/add" element={<Navigate to="/santri" replace />} />
              <Route path="/santri/onboarding" element={<SuspenseOnly><SantriOnboarding /></SuspenseOnly>} />
              
              <Route path="/santri/profile" element={
                <WithLayout>
                  <ProfileRedirect />
                </WithLayout>
              } />
              <Route path="/santri/profile/:id" element={
                <WithLayout>
                  <ProfileLayout />
                </WithLayout>
              }>
                <Route index element={<InformasiPage />} />
                <Route path="informasi" element={<InformasiPage />} />
                <Route path="akademik" element={<AkademikPage />} />
                <Route path="keuangan" element={<KeuanganPage />} />
                <Route path="tabungan" element={<TabunganPage />} />
                <Route path="layanan" element={<LayananPage />} />
                <Route path="dokumen" element={<DokumenPage />} />
              </Route>

              <Route path="/santri/profile-enhanced" element={<Navigate to="/santri/profile" replace />} />
              <Route path="/santri/profile-minimal" element={<Navigate to="/santri/profile" replace />} />
              <Route path="/santri/profile-master" element={<Navigate to="/santri/profile" replace />} />
              <Route path="/santri/profile-redesigned" element={<Navigate to="/santri/profile" replace />} />

              {/* Other Modules */}
              <Route path="/monitoring" element={
                <WithLayout>
                  <Monitoring />
                </WithLayout>
              } />
              <Route path="/tabungan" element={
                <WithLayout>
                  <TabunganRouter />
                </WithLayout>
              } />
              <Route path="/tabungan-santri" element={
                <WithLayout>
                  <TabunganSantriAdmin />
                </WithLayout>
              } />
              <Route path="/laporan-tabungan" element={
                <WithLayout>
                  <LaporanTabungan />
                </WithLayout>
              } />
              <Route path="/donasi" element={
                <WithLayout>
                  <DonasiDashboard />
                </WithLayout>
              } />
              <Route path="/donasi-dashboard" element={<Navigate to="/donasi" replace />} />
              <Route path="/donasi/master-donatur" element={
                <WithLayout>
                  <MasterDonatur />
                </WithLayout>
              } />

              {/* Legacy Redirects */}
              <Route path="/inventaris-test" element={<Navigate to="/inventaris" replace />} />
              <Route path="/inventaris-legacy" element={<Navigate to="/inventaris" replace />} />
              <Route path="/inventaris-old" element={<Navigate to="/inventaris" replace />} />
              <Route path="/koperasi-old" element={<Navigate to="/koperasi" replace />} />
              <Route path="/keuangan" element={<Navigate to="/keuangan-v3" replace />} />
              
              <Route path="/keuangan-v3" element={
                <WithLayout>
                  <KeuanganV3 />
                </WithLayout>
              } />
              <Route path="/keuangan-v3/penyaluran-bantuan" element={
                <WithLayout>
                  <RiwayatPenyaluranBantuanPage />
                </WithLayout>
              } />
              <Route path="/keuangan/master-data" element={
                <WithLayout>
                  <MasterDataKeuanganPage />
                </WithLayout>
              } />

              <Route path="/ploating-kelas" element={<Navigate to="/akademik/kelas?tab=plotting" replace />} />
              <Route path="/tagihan-santri" element={
                <WithLayout>
                  <TagihanSantri />
                </WithLayout>
              } />
              <Route path="/admin/santri-accounts" element={
                <WithLayout>
                  <SantriAccountManagement />
                </WithLayout>
              } />
              <Route path="/change-password" element={
                <WithLayout>
                  <ChangePassword />
                </WithLayout>
              } />

              <Route path="*" element={<SuspenseOnly><NotFound /></SuspenseOnly>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;