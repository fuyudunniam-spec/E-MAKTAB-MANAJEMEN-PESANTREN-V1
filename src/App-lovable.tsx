import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Existing ALBISRI imports
import LayoutAlbisri from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import SantriEnhanced from "./pages/SantriEnhanced";
import Monitoring from "./pages/Monitoring";
import Tabungan from "./pages/Tabungan";
import TabunganRouter from "./pages/TabunganRouter";
import TabunganSantriAdmin from "./pages/TabunganSantriAdmin";
import LaporanTabungan from "./pages/LaporanTabungan";
import DonasiDashboard from "./pages/DonasiDashboard";
import MasterDonatur from "./pages/MasterDonatur";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SantriOnboarding from "./pages/SantriOnboarding";
import SantriAccountManagement from "./pages/SantriAccountManagement";
import ChangePassword from "./pages/ChangePassword";
import ProfileLayout from "./components/ProfileLayout";
import ProfileRedirect from "./components/ProfileRedirect";
import InformasiPage from "./pages/santri/InformasiPage";
import AkademikPage from "./pages/santri/AkademikPage";
import KeuanganPage from "./pages/santri/KeuanganPage";
import TabunganPage from "./pages/santri/TabunganPage";
import LayananPage from "./pages/santri/LayananPage";
import DokumenPage from "./pages/santri/DokumenPage";
import TagihanSantri from "./pages/TagihanSantri";

// An-Nur Digital Hub imports
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/public/Index";
import BlogPage from "./pages/public/BlogPage";
import BlogSinglePage from "./pages/public/BlogSinglePage";
import TagPage from "./pages/public/TagPage";
import ShopPage from "./pages/public/ShopPage";
import ShopSinglePage from "./pages/public/ShopSinglePage";
import PageSingle from "./pages/public/PageSingle";
import AuthPage from "./pages/public/AuthPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooks from "./pages/admin/AdminBooks";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAuthors from "./pages/admin/AdminAuthors";
import AdminMenuLinks from "./pages/admin/AdminMenuLinks";
import AdminPages from "./pages/admin/AdminPages";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminMediaLibrary from "./pages/admin/AdminMediaLibrary";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminHomepage from "./pages/admin/AdminHomepage";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminTestimonials from "./pages/admin/AdminTestimonials";

// Lazy imports for ALBISRI modules
const DashboardAkademik = lazy(() => import('./modules/akademik/DashboardAkademik'));
const KelasPage = lazy(() => import('./modules/akademik/KelasPage'));
const SemesterManagementPage = lazy(() => import('./modules/akademik/SemesterManagementPage'));
const PertemuanPage = lazy(() => import('./modules/akademik/PertemuanPage'));
const DashboardPengajar = lazy(() => import('./modules/akademik/DashboardPengajar'));
const ProfilPengajarPage = lazy(() => import('./modules/akademik/ProfilPengajarPage'));
const InputNilaiPage = lazy(() => import('./modules/akademik/InputNilaiPage'));
const SetoranHarianPage = lazy(() => import('./modules/akademik/SetoranHarianPage'));
const PerizinanSantriPage = lazy(() => import('./modules/akademik/PerizinanSantriPage'));

import UserManagementPage from './modules/admin/UserManagementPage';

const InventarisMasterPage = lazy(() => import('./modules/inventaris/MasterData/InventarisMasterPage'));
const DistribusiPage = lazy(() => import('./modules/inventaris/Distribution/DistribusiPage'));
const DistribusiPaketPage = lazy(() => import('./modules/inventaris/Distribution/DistribusiPaketPage'));
const MasterPaketPage = lazy(() => import('./modules/inventaris/Distribution/MasterPaketPage'));
const RiwayatInventarisYayasanPage = lazy(() => import('./modules/inventaris/Transactions/RiwayatInventarisYayasanPage'));
const KeuanganAuditPage = lazy(() => import('./pages/admin/KeuanganAuditPage'));
const KeuanganV3 = lazy(() => import('./pages/KeuanganV3'));
const RiwayatPenyaluranBantuanPage = lazy(() => import('./modules/keuangan/PenyaluranBantuan/RiwayatPenyaluranBantuanPage'));
const MasterDataKeuanganPage = lazy(() => import('./modules/keuangan/MasterData/MasterDataKeuanganPage'));
const InventarisDashboard = lazy(() => import('./pages/InventarisDashboard'));

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
const KelolaHPPDanBagiHasilPage = lazy(() => import('./modules/koperasi/Keuangan/KelolaHPPDanBagiHasilPage'));
const LaporanKoperasiPage = lazy(() => import('./modules/koperasi/Laporan/LaporanPage'));

const queryClient = new QueryClient();

const App = () => (
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <Routes>
                                {/* --- PUBLIC ROUTES (AN-NUR) --- */}
                                <Route path="/" element={<Index />} />
                                <Route path="/blog" element={<BlogPage />} />
                                <Route path="/blog/:slug" element={<BlogSinglePage />} />
                                <Route path="/tag/:slug" element={<TagPage />} />
                                <Route path="/shop" element={<ShopPage />} />
                                <Route path="/shop/:slug" element={<ShopSinglePage />} />
                                <Route path="/page/:slug" element={<PageSingle />} />
                                <Route path="/halaman/:slug" element={<PageSingle />} />
                                <Route path="/public-auth" element={<AuthPage />} />

                                {/* --- ADMIN CMS ROUTES (AN-NUR) --- */}
                                <Route path="/cms" element={<AdminLayout />}>
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="homepage" element={<AdminHomepage />} />
                                    <Route path="books" element={<AdminBooks />} />
                                    <Route path="products" element={<AdminProducts />} />
                                    <Route path="posts" element={<AdminPosts />} />
                                    <Route path="announcements" element={<AdminAnnouncements />} />
                                    <Route path="messages" element={<AdminMessages />} />
                                    <Route path="users" element={<AdminUsers />} />
                                    <Route path="categories" element={<AdminCategories />} />
                                    <Route path="authors" element={<AdminAuthors />} />
                                    <Route path="menu-links" element={<AdminMenuLinks />} />
                                    <Route path="pages" element={<AdminPages />} />
                                    <Route path="gallery" element={<AdminGallery />} />
                                    <Route path="settings" element={<AdminSiteSettings />} />
                                    <Route path="media" element={<AdminMediaLibrary />} />
                                    <Route path="activity-log" element={<AdminActivityLog />} />
                                    <Route path="programs" element={<AdminPrograms />} />
                                    <Route path="testimonials" element={<AdminTestimonials />} />
                                </Route>

                                {/* --- ALBISRI ROUTES (PESANTREN MANAGEMENT SYSTEM) --- */}
                                <Route path="/auth" element={<Auth />} />

                                {/* Redirect old root to /pms-dashboard or similar for admins */}
                                <Route path="/pms" element={
                                    <LayoutAlbisri>
                                        <Dashboard />
                                    </LayoutAlbisri>
                                } />

                                {/* ALBISRI Modules under LayoutAlbisri */}
                                <Route path="/santri" element={<LayoutAlbisri><SantriEnhanced /></LayoutAlbisri>} />
                                <Route path="/santri/onboarding" element={<SantriOnboarding />} />
                                <Route path="/santri/profile" element={<LayoutAlbisri><ProfileRedirect /></LayoutAlbisri>} />
                                <Route path="/santri/profile/:id" element={<LayoutAlbisri><ProfileLayout /></LayoutAlbisri>}>
                                    <Route index element={<InformasiPage />} />
                                    <Route path="informasi" element={<InformasiPage />} />
                                    <Route path="akademik" element={<AkademikPage />} />
                                    <Route path="keuangan" element={<KeuanganPage />} />
                                    <Route path="tabungan" element={<TabunganPage />} />
                                    <Route path="layanan" element={<LayananPage />} />
                                    <Route path="dokumen" element={<DokumenPage />} />
                                </Route>

                                <Route path="/akademik" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><DashboardAkademik /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/kelas" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><KelasPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/semester" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><SemesterManagementPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/pertemuan" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><PertemuanPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/pengajar" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><DashboardPengajar /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/pengajar/profil" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><ProfilPengajarPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/nilai" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><InputNilaiPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/setoran" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><SetoranHarianPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/akademik/perizinan" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><PerizinanSantriPage /></Suspense></LayoutAlbisri>} />

                                <Route path="/keuangan-v3" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><KeuanganV3 /></Suspense></LayoutAlbisri>} />
                                <Route path="/keuangan-v3/penyaluran-bantuan" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><RiwayatPenyaluranBantuanPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/keuangan/master-data" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><MasterDataKeuanganPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/tagihan-santri" element={<LayoutAlbisri><TagihanSantri /></LayoutAlbisri>} />
                                <Route path="/tabungan-santri" element={<LayoutAlbisri><TabunganSantriAdmin /></LayoutAlbisri>} />

                                <Route path="/inventaris" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><InventarisDashboard /></Suspense></LayoutAlbisri>} />
                                <Route path="/inventaris/master" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><InventarisMasterPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/inventaris/distribution" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><DistribusiPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/inventaris/riwayat" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><RiwayatInventarisYayasanPage /></Suspense></LayoutAlbisri>} />

                                <Route path="/koperasi" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><DashboardKoperasi /></Suspense></LayoutAlbisri>} />
                                <Route path="/koperasi/kasir" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><KasirPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/koperasi/inventaris" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><StockKoperasiPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/koperasi/penjualan" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><RiwayatPenjualanPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/koperasi/pembelian" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><PembelianPage /></Suspense></LayoutAlbisri>} />
                                <Route path="/koperasi/keuangan" element={<LayoutAlbisri><Suspense fallback={<div>Loading...</div>}><KeuanganKoperasiPage /></Suspense></LayoutAlbisri>} />

                                <Route path="/donasi" element={<LayoutAlbisri><DonasiDashboard /></LayoutAlbisri>} />
                                <Route path="/donasi/master-donatur" element={<LayoutAlbisri><MasterDonatur /></LayoutAlbisri>} />

                                <Route path="/admin/users" element={<LayoutAlbisri><UserManagementPage /></LayoutAlbisri>} />
                                <Route path="/admin/santri-accounts" element={<LayoutAlbisri><SantriAccountManagement /></LayoutAlbisri>} />
                                <Route path="/change-password" element={<LayoutAlbisri><ChangePassword /></LayoutAlbisri>} />

                                {/* Backward compatibility redirects */}
                                <Route path="/pms-dashboard" element={<Navigate to="/pms" replace />} />
                                <Route path="/admin" element={<Navigate to="/cms" replace />} />

                                {/* Catch all */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </BrowserRouter>
                    </TooltipProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </ErrorBoundary>
);

export default App;
