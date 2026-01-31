import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-surface">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Maaf, halaman yang Anda cari tidak tersedia. Mungkin alamat yang dimasukkan salah atau halaman telah dipindahkan.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="default" size="lg">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
