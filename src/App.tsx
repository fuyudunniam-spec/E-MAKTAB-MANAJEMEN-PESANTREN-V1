import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import Layout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
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
const Dashboard = lazy(() => import("@/modules/user-management/pages/Dashboard"));
const SantriEnhanced = lazy(() => import("@/modules/santri/admin/pages/SantriEnhanced"));
const Monitoring = lazy(() => import("@/modules/user-management/pages/Monitoring"));
const TabunganSantriAdmin = lazy(() => import("@/modules/santri/admin/pages/TabunganSantriAdmin"));
const LaporanTabungan = lazy(() => import("@/modules/santri/admin/pages/LaporanTabungan"));
const DonasiDashboard = lazy(() => import("@/modules/donasi/admin/pages/DonasiDashboard"));
const MasterDonatur = lazy(() => import("@/modules/donasi/admin/pages/MasterDonatur"));
const Auth = lazy(() => import("@/modules/auth/pages/Auth"));
const AdminSetupPage = lazy(() => import("@/modules/user-management/pages/SetupAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SantriOnboarding = lazy(() => import("@/modules/santri/admin/pages/SantriOnboarding"));
const SantriAccountManagement = lazy(() => import('@/modules/santri/admin/pages/SantriAccountManagement'));
const ChangePassword = lazy(() => import("@/modules/auth/pages/ChangePassword"));
const ProfileLayout = lazy(() => import("@/components/layout/ProfileLayout"));
const ProfileRedirect = lazy(() => import("@/components/layout/ProfileRedirect"));
const InformasiPage = lazy(() => import("@/modules/santri/portal/pages/InformasiPage"));
const AkademikPage = lazy(() => import("@/modules/santri/portal/pages/AkademikPage"));
const KeuanganPage = lazy(() => import("@/modules/santri/portal/pages/KeuanganPage"));
const TabunganPage = lazy(() => import("@/modules/santri/portal/pages/TabunganPage"));
const LayananPage = lazy(() => import("@/modules/santri/portal/pages/LayananPage"));
const DokumenPage = lazy(() => import("@/modules/santri/portal/pages/DokumenPage"));
const TagihanSantri = lazy(() => import("@/modules/santri/admin/pages/TagihanSantri"));
const DashboardSantri = lazy(() => import("@/modules/santri/admin/pages/DashboardSantri"));
const TabunganSantriMy = lazy(() => import("@/modules/santri/portal/pages/TabunganSantriMy"));

// Public Website Imports
const PSBPage = lazy(() => import("@/modules/psb/public/pages/PSBPage"));
const PSBPortal = lazy(() => import("@/modules/psb/public/pages/PSBPortal"));
const PSBAuth = lazy(() => import("@/modules/psb/public/pages/PSBAuth"));
const LandingPage = lazy(() => import("@/modules/public-website/pages/LandingPage"));
const TransparansiPage = lazy(() => import("@/modules/public-website/pages/TransparansiPage"));
const AboutUsPage = lazy(() => import("@/modules/public-website/pages/AboutUsPage"));
const DonasiPage = lazy(() => import("@/modules/public-website/pages/DonasiPage"));
const NewsPage = lazy(() => import("@/modules/public-website/pages/NewsPage"));
const NewsDetailPage = lazy(() => import("@/modules/public-website/pages/NewsDetailPage"));

// Admin Website Imports - Removed unused imports


// Lazy imports for module dashboards
const DashboardAkademik = lazy(() => import('@/modules/akademik/admin/pages/DashboardAkademik'));
const MasterKelasPage = lazy(() => import('@/modules/akademik/admin/pages/MasterKelasPage'));
const PloatingKelasSimple = lazy(() => import('@/modules/akademik/admin/pages/PloatingKelasSimple'));
const KelasPage = lazy(() => import('@/modules/akademik/admin/pages/KelasPage'));
const SemesterManagementPage = lazy(() => import('@/modules/akademik/admin/pages/SemesterManagementPage'));
const PresensiKelasPage = lazy(() => import('@/modules/akademik/guru/pages/PresensiKelasPage'));
const SetoranHarianPage = lazy(() => import('@/modules/akademik/guru/pages/SetoranHarianPage'));
const PerizinanSantriPage = lazy(() => import('@/modules/akademik/admin/pages/PerizinanSantriPage'));
const JurnalPertemuanPage = lazy(() => import('@/modules/akademik/guru/pages/JurnalPertemuanPage'));
const PertemuanPage = lazy(() => import('@/modules/akademik/guru/pages/PertemuanPage'));
const DashboardPengajar = lazy(() => import('@/modules/akademik/guru/pages/DashboardPengajar'));
const ProfilPengajarPage = lazy(() => import('@/modules/akademik/admin/pages/ProfilPengajarPage'));
const InputNilaiPage = lazy(() => import('@/modules/akademik/guru/pages/InputNilaiPage'));
const RapotPage = lazy(() => import('@/modules/akademik/guru/pages/RapotPage'));
const UserManagementPage = lazy(() => import('@/modules/user-management/pages/UserManagementPage'));
// SantriAccountManagement is already declared above, removing duplicate declaration

// Lazy imports for inventory modules
const InventarisMasterPage = lazy(() => import('@/modules/inventaris/admin/features/MasterData/InventarisMasterPage'));
const PenjualanPage = lazy(() => import('@/modules/inventaris/admin/features/Sales/PenjualanPage'));
const DistribusiPage = lazy(() => import('@/modules/inventaris/admin/features/Distribution/DistribusiPage'));
const DistribusiPaketPage = lazy(() => import('@/modules/inventaris/admin/features/Distribution/DistribusiPaketPage'));
const MasterPaketPage = lazy(() => import('@/modules/inventaris/admin/features/Distribution/MasterPaketPage'));
const RiwayatInventarisYayasanPage = lazy(() => import('@/modules/inventaris/admin/features/Transactions/RiwayatInventarisYayasanPage'));
const KeuanganAuditPage = lazy(() => import('@/modules/keuangan/admin/pages/KeuanganAuditPage'));
const KeuanganV3 = lazy(() => import('@/modules/keuangan/admin/pages/KeuanganDashboard'));
const RiwayatPenyaluranBantuanPage = lazy(() => import('@/modules/keuangan/admin/features/PenyaluranBantuan/RiwayatPenyaluranBantuanPage'));
const MasterDataKeuanganPage = lazy(() => import('@/modules/keuangan/admin/features/MasterData/MasterDataKeuanganPage'));
const InventarisDashboard = lazy(() => import('@/modules/inventaris/admin/pages/DashboardInventaris'));

// Lazy imports for koperasi modules
const DashboardKoperasi = lazy(() => import('@/modules/koperasi/admin/pages/DashboardKoperasi'));
const MasterProdukPage = lazy(() => import('@/modules/koperasi/admin/features/MasterData/MasterProdukPage'));
const SupplierPage = lazy(() => import('@/modules/koperasi/admin/features/MasterData/SupplierPage'));
const KasirPage = lazy(() => import('@/modules/koperasi/pos/Kasir/KasirPage'));
const StockKoperasiPage = lazy(() => import('@/modules/koperasi/admin/features/Inventaris/StockKoperasiPage'));
const TransferInventarisPage = lazy(() => import('@/modules/koperasi/admin/features/Transfer/TransferInventarisPage'));
const RiwayatPenjualanPage = lazy(() => import('@/modules/koperasi/admin/features/Penjualan/RiwayatPenjualanPage'));
const PembelianPage = lazy(() => import('@/modules/koperasi/admin/features/Pembelian/PembelianPage'));
const KeuanganKoperasiPage = lazy(() => import('@/modules/koperasi/admin/features/Keuangan/KeuanganUnifiedPage'));
const KeuanganDashboardKoperasi = lazy(() => import('@/modules/koperasi/admin/features/Keuangan/KeuanganDashboard'));
const KeuanganPembelianPage = lazy(() => import('@/modules/koperasi/admin/features/Keuangan/KeuanganUnifiedPage'));
const KeuanganOperasionalPage = lazy(() => import('@/modules/koperasi/admin/features/Keuangan/KeuanganUnifiedPage'));
const KelolaHPPDanBagiHasilPage = lazy(() => import('@/modules/koperasi/admin/features/Keuangan/KelolaHPPDanBagiHasilPage'));
const LaporanKoperasiPage = lazy(() => import('@/modules/koperasi/admin/features/Laporan/LaporanKoperasiPage'));

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
              <Route path="/emaktab" element={<SuspenseOnly><Auth /></SuspenseOnly>} />
              <Route path="/setup-admin" element={<SuspenseOnly><AdminSetupPage /></SuspenseOnly>} />
              {/* SLICE UNIK UNTUK SUPERADMIN - Ganti 'secure-gate' dengan kata sandi url yang anda inginkan */}
              <Route path="/pms/secure-gate" element={<SuspenseOnly><Auth /></SuspenseOnly>} />

              {/* Public Website Routes */}
              <Route path="/" element={<SuspenseOnly><LandingPage /></SuspenseOnly>} />
              <Route path="/transparansi" element={<SuspenseOnly><TransparansiPage /></SuspenseOnly>} />
              <Route path="/tentang-kami" element={<SuspenseOnly><AboutUsPage /></SuspenseOnly>} />
              <Route path="/donasi" element={<SuspenseOnly><DonasiPage /></SuspenseOnly>} />
              <Route path="/berita" element={<SuspenseOnly><NewsPage /></SuspenseOnly>} />
              <Route path="/berita/:slug" element={<SuspenseOnly><NewsDetailPage /></SuspenseOnly>} />

              {/* PSB Portal Routes */}
              <Route path="/psb" element={<SuspenseOnly><PSBPage /></SuspenseOnly>} />
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
              <Route path="/tabungan" element={<Navigate to="/tabungan-santri" replace />} />
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
