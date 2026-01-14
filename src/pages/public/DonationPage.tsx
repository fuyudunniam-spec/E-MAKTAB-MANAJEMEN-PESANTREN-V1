import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Heart, Shield, GraduationCap, Building } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

export default function DonationPage() {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success("Nomor rekening berhasil disalin");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const bankAccounts = [
        {
            bank: "BSI (Bank Syariah Indonesia)",
            number: "1234567890",
            name: "Yayasan Pesantren An-Nur",
            code: "451",
        },
        {
            bank: "Bank Mandiri",
            number: "0987654321",
            name: "Yayasan Pesantren An-Nur",
            code: "008",
        },
        {
            bank: "BCA",
            number: "1122334455",
            name: "Yayasan Pesantren An-Nur",
            code: "014",
        },
    ];

    return (
        <MainLayout>
            <Helmet>
                <title>Dukungan & Donasi | Pesantren An-Nur</title>
                <meta name="description" content="Mari berinvestasi akhirat dengan mendukung pendidikan santri yatim dan dhuafa di Pesantren An-Nur." />
            </Helmet>

            {/* Hero Header */}
            <section className="relative py-20 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

                <div className="container-section relative z-10 text-center">
                    <Badge variant="outline" className="mb-6 border-amber-500/50 text-amber-500 px-4 py-1 text-sm tracking-widest uppercase">
                        Investasi Akhirat
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                        Membangun <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Peradaban</span>,<br />
                        Memuliakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Masa Depan</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
                        Dukung pendidikan berkualitas bagi santri yatim dan dhuafa. Setiap rupiah yang Anda infaqkan adalah batu bata bagi bangunan masa depan mereka dan amal jariyah bagi Anda.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 rounded-full" onClick={() => document.getElementById('donation-methods')?.scrollIntoView({ behavior: 'smooth' })}>
                            Salurkan Infaq Sekarang
                        </Button>
                        <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-full" asChild>
                            <a href="https://wa.me/6281234567890?text=Assalamualaikum,%20saya%20ingin%20konfirmasi%20donasi" target="_blank" rel="noopener noreferrer">
                                Konfirmasi Donasi
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Impact Pillars */}
            <section className="py-20 bg-white">
                <div className="container-section">
                    <div className="grid md:grid-cols-3 gap-8 transform -translate-y-24">
                        {[
                            {
                                icon: GraduationCap,
                                title: "Beasiswa Pendidikan",
                                desc: "Menjamin akses pendidikan formal dan diniyah berkualitas bagi santri yatim & dhuafa."
                            },
                            {
                                icon: Building,
                                title: "Pembangunan Fasilitas",
                                desc: "Pengembangan asrama, kelas, dan laboratorium untuk menunjang pembelajaran modern."
                            },
                            {
                                icon: Shield,
                                title: "Kemandirian Pesantren",
                                desc: "Pengembangan unit usaha untuk operasional pesantren yang berkelanjutan."
                            }
                        ].map((item, idx) => (
                            <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
                                <CardContent className="p-8 text-center pt-12">
                                    <div className="w-16 h-16 mx-auto bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-primary">
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Donation Methods */}
            <section id="donation-methods" className="py-20 bg-slate-50">
                <div className="container-section max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Salurkan Dukungan Anda</h2>
                        <p className="text-slate-600">Pilih metode donasi yang paling mudah bagi Anda</p>
                    </div>

                    <Tabs defaultValue="transfer" className="w-full">
                        <div className="flex justify-center mb-8">
                            <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-slate-200/50 rounded-full">
                                <TabsTrigger value="transfer" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Transfer Bank</TabsTrigger>
                                <TabsTrigger value="qris" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">QRIS</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="transfer" className="space-y-6 fade-in duration-300">
                            {bankAccounts.map((account, index) => (
                                <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 shrink-0">
                                                LOGO
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-slate-500 mb-1">{account.bank}</p>
                                                <h3 className="text-xl md:text-2xl font-mono font-bold text-slate-900 tracking-wide mb-1">
                                                    {account.number}
                                                </h3>
                                                <p className="text-sm text-slate-600">a.n {account.name}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="gap-2 min-w-[120px] rounded-full hover:bg-primary hover:text-white border-primary/20 text-primary transition-colors"
                                            onClick={() => handleCopy(account.number, `bank-${index}`)}
                                        >
                                            {copiedField === `bank-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copiedField === `bank-${index}` ? "Disalin" : "Salin"}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </TabsContent>

                        <TabsContent value="qris" className="fade-in duration-300">
                            <Card className="max-w-md mx-auto border-none shadow-xl overflow-hidden">
                                <CardContent className="p-8 text-center bg-white">
                                    <div className="bg-slate-900 text-white py-2 px-4 rounded-full text-xs font-bold tracking-wider uppercase inline-block mb-8">
                                        Scan untuk Donasi
                                    </div>
                                    <div className="aspect-square max-w-[280px] mx-auto bg-white p-4 border-4 border-slate-100 rounded-xl mb-6">
                                        {/* Placeholder for QRIS Image */}
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 rounded-lg border-2 border-dashed border-slate-300">
                                            Upload QRIS Image Here
                                        </div>
                                    </div>
                                    <h3 className="font-heading font-bold text-xl text-slate-900 mb-2">Scan QR Code</h3>
                                    <p className="text-sm text-slate-500 mb-6">Mendukung GoPay, OVO, Dana, ShopeePay, LinkAja, dan seluruh aplikasi Mobile Banking.</p>
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
                                        Pastikan nama merchant adalah <strong>YAYASAN PESANTREN AN-NUR</strong>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-12 text-center">
                        <p className="text-slate-600 mb-6">Sudah melakukan transfer?</p>
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-lg shadow-emerald-600/20" asChild>
                            <a href="https://wa.me/6281234567890?text=Assalamualaikum,%20saya%20sudah%20transfer%20donasi%20sebesar%20Rp..." target="_blank" rel="noopener noreferrer">
                                Konfirmasi via WhatsApp
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Quote */}
            <section className="py-20 bg-primary/5">
                <div className="container-section max-w-3xl text-center">
                    <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
                    <blockquote className="text-2xl md:text-3xl font-heading font-medium text-slate-800 leading-relaxed italic mb-8">
                        "Bukanlah harta itu berkurang karena sedekah, melainkan ia bertambah, bertambah, dan bertambah."
                    </blockquote>
                    <cite className="text-slate-600 font-medium not-italic">- HR. Muslim</cite>
                </div>
            </section>
        </MainLayout>
    );
}
