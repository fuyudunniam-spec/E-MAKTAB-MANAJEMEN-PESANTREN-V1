import { useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReceiptItem {
  id: string;
  nama_barang: string;
  jumlah: number;
  satuan: string;
  harga_satuan_jual: number;
  subtotal: number;
}

interface ReceiptNotaProps {
  penjualan: {
    id: string;
    nomor_struk?: string | null;
    tanggal: string;
    kasir_name?: string;
    metode_pembayaran?: string;
    total_transaksi: number;
    jumlah_bayar?: number;
    kembalian?: number;
  };
  items: ReceiptItem[];
  onClose?: () => void;
  autoPrint?: boolean;
  showActions?: boolean; // Tampilkan tombol download/share
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ReceiptNota({
  penjualan,
  items,
  onClose,
  autoPrint = false,
  showActions = true,
}: ReceiptNotaProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoPrint && componentRef.current) {
      const timer = setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Popup diblokir. Izinkan popup untuk mencetak nota.');
          return;
        }

        // Clone element dan hapus tombol action sebelum copy
        const clonedElement = componentRef.current!.cloneNode(true) as HTMLElement;
        const actionButtons = clonedElement.querySelectorAll('.no-print');
        actionButtons.forEach(btn => btn.remove());
        
        const receiptHTML = clonedElement.innerHTML;
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Nota ${penjualan.nomor_struk || penjualan.id.slice(0, 8)}</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 80mm;
                  background: white;
                  font-family: Arial, sans-serif;
                }
                .receipt-print {
                  width: 80mm !important;
                  max-width: 80mm !important;
                  padding: 8mm 5mm !important;
                  margin: 0 !important;
                  background: white !important;
                  page-break-inside: avoid !important;
                  page-break-after: avoid !important;
                }
                .no-print { display: none !important; }
                .text-center { text-align: center !important; }
                .text-left { text-align: left !important; }
                .text-right { text-align: right !important; }
                .mb-1 { margin-bottom: 0.25rem !important; }
                .mb-2 { margin-bottom: 0.5rem !important; }
                .mb-3 { margin-bottom: 0.75rem !important; }
                .mb-4 { margin-bottom: 1rem !important; }
                .mt-1 { margin-top: 0.25rem !important; }
                .pt-2 { padding-top: 0.5rem !important; }
                .pb-2 { padding-bottom: 0.5rem !important; }
                .pb-3 { padding-bottom: 0.75rem !important; }
                .pr-2 { padding-right: 0.5rem !important; }
                .pl-2 { padding-left: 0.5rem !important; }
                .mr-1 { margin-right: 0.25rem !important; }
                .flex { display: flex !important; }
                .items-center { align-items: center !important; }
                .items-start { align-items: flex-start !important; }
                .justify-center { justify-content: center !important; }
                .justify-between { justify-content: space-between !important; }
                .gap-2 { gap: 0.5rem !important; }
                .flex-1 { flex: 1 1 0% !important; }
                .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
                .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
                .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                .text-\\[9px\\] { font-size: 9px !important; }
                .text-\\[10px\\] { font-size: 10px !important; }
                .font-bold { font-weight: 700 !important; }
                .font-semibold { font-weight: 600 !important; }
                .font-medium { font-weight: 500 !important; }
                .font-mono { font-family: ui-monospace, monospace !important; }
                .text-gray-600 { color: rgb(75 85 99) !important; }
                .text-gray-700 { color: rgb(55 65 81) !important; }
                .text-gray-800 { color: rgb(31 41 55) !important; }
                .text-gray-900 { color: rgb(17 24 39) !important; }
                .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
                .border-b-2 { border-bottom-width: 2px !important; border-bottom-style: solid !important; }
                .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
                .border-gray-300 { border-color: rgb(209 213 219) !important; }
                .border-gray-800 { border-color: rgb(31 41 55) !important; }
                .leading-tight { line-height: 1.25 !important; }
                .tracking-wide { letter-spacing: 0.025em !important; }
                .tracking-tight { letter-spacing: -0.025em !important; }
                .whitespace-nowrap { white-space: nowrap !important; }
                .break-all { word-break: break-all !important; }
                .max-w-\\[60\\%\\] { max-width: 60% !important; }
                .space-y-2 > * + * { margin-top: 0.5rem !important; }
                .space-y-0\\.5 > * + * { margin-top: 0.125rem !important; }
                .capitalize { text-transform: capitalize !important; }
                h1 { margin: 0 !important; font-size: 1.5rem !important; line-height: 2rem !important; font-weight: 700 !important; }
                p { margin: 0 !important; }
                ul { list-style: none !important; padding: 0 !important; margin: 0 !important; }
                li { margin: 0 !important; }
                span { display: inline-block !important; }
              </style>
            </head>
            <body>
              <div class="receipt-print">
                ${receiptHTML}
              </div>
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            if (onClose) {
              setTimeout(() => {
                printWindow.close();
                onClose();
              }, 500);
            }
          }, 250);
        };
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, penjualan.nomor_struk, penjualan.id, onClose]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH.mm', { locale: id });
  };

  const total = penjualan.total_transaksi || 0;
  const bayar = penjualan.jumlah_bayar || total;
  const kembalian = penjualan.kembalian || 0;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error('Gagal memuat nota untuk diunduh');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Load heavy libs only when needed (reduces initial bundle/route load)
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Hide action buttons temporarily
      const actionButtons = componentRef.current.querySelector('.no-print');
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'none';
      }

      // Capture the receipt as canvas
      const canvas = await html2canvas(componentRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        width: componentRef.current.scrollWidth,
        height: componentRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded before capture
          const clonedElement = clonedDoc.querySelector('.receipt-print');
          if (clonedElement) {
            // Force font rendering
            (clonedElement as HTMLElement).style.fontFamily = 'Arial, sans-serif';
          }
        },
      });

      // Restore action buttons
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = '';
      }

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');

      // Calculate PDF dimensions (80mm width, maintain aspect ratio)
      const receiptWidth = 80; // 80mm - standard receipt width
      const receiptHeight = (canvas.height * receiptWidth) / canvas.width;

      // Use A4 format to ensure single page
      // A4 dimensions: 210mm x 297mm
      const a4Width = 210;
      const a4Height = 297;
      
      // Calculate scale to fit receipt on A4 page (ensure it fits on one page)
      // Scale down if receipt is larger than A4, but don't scale up if smaller
      const scaleX = receiptWidth <= a4Width ? 1 : a4Width / receiptWidth;
      const scaleY = receiptHeight <= a4Height ? 1 : a4Height / receiptHeight;
      
      // Use the smaller scale to ensure content fits on one page
      const scale = Math.min(scaleX, scaleY);
      
      // Calculate final dimensions
      const finalWidth = receiptWidth * scale;
      const finalHeight = receiptHeight * scale;
      
      // Center the content on A4 page
      const xOffset = (a4Width - finalWidth) / 2;
      const yOffset = Math.max(5, (a4Height - finalHeight) / 2); // At least 5mm from top

      // Create PDF with A4 format (single page)
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });

      // Add image to PDF, centered and scaled to fit on single page
      doc.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

      // Save PDF
      const nomorStruk = penjualan.nomor_struk || penjualan.id.slice(0, 8).toUpperCase();
      const filename = `Nota_${nomorStruk}_${format(new Date(penjualan.tanggal), 'yyyyMMdd')}.pdf`;
      doc.save(filename);

      toast.success('PDF berhasil diunduh');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengunduh PDF';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWA = () => {
    // Format items list with better readability
    const itemsText = items.map(item => 
      `• ${item.nama_barang}
  ${item.jumlah} ${item.satuan || 'pcs'} × ${formatRupiah(item.harga_satuan_jual)} = ${formatRupiah(item.subtotal)}`
    ).join('\n\n');
    
    // Create text message (NOT PDF - just plain text)
    const message = `*NOTA PENJUALAN SANTRA MART*

*No. Transaksi:* ${penjualan.nomor_struk || penjualan.id.slice(0, 8).toUpperCase()}
*Tanggal:* ${formatDateTime(penjualan.tanggal)}
*Kasir:* ${penjualan.kasir_name || 'Admin'}

*Daftar Pembelian:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
*TOTAL:* ${formatRupiah(total)}
*Bayar:* ${formatRupiah(bayar)}
*Kembali:* ${formatRupiah(kembalian)}
━━━━━━━━━━━━━━━━━━━━

Terima kasih telah menjadi bagian dari gerakan "SANTRI MANDIRI & BERDIKARI"

Belanja Anda hari ini membantu:
✓ Beasiswa pendidikan santri yatim dan dhuafa
✓ Pelatihan kewirausahaan
✓ Pemberdayaan ekonomi pesantren

---
*Koperasi Pesantren Anak Yatim Al-Bisri*
Gunung Anyar Lor 2/62, Surabaya
HP/WA: 085955303882`;

    // Encode message for WhatsApp URL (text only, NOT PDF)
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Open WhatsApp with text message (NOT PDF)
    window.open(waUrl, '_blank');
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .receipt-print {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 8mm 5mm !important;
            margin: 0 !important;
            background: white !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
          }
          .receipt-print * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .receipt-print {
            max-width: 80mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
          }
        }
      `}</style>
      <div className="receipt-print" ref={componentRef}>
        {/* Header dengan desain modern */}
        <div className="text-center mb-4 pb-3 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>
            SANTRA MART
          </h1>
          <p className="text-xs font-semibold text-gray-700 mb-1 tracking-wide">
            Santri Nusantara Mart
          </p>
          <p className="text-[10px] text-gray-600 leading-tight">
            Koperasi Pesantren Anak Yatim Al-Bisri
          </p>
        </div>

        {/* Info Kontak & Bank */}
        <div className="text-center mb-3 pb-2 border-b border-gray-300">
          <p className="text-[9px] text-gray-600 leading-tight">
            Gunung Anyar Lor 2/62, Surabaya
          </p>
          <p className="text-[9px] text-gray-600 leading-tight">
            HP/WA: 085955303882 / 085100172617
          </p>
          <p className="text-[9px] text-gray-600 leading-tight mt-1">
            BSI: 3334444940 a/n YPAY AL-BISRI
          </p>
        </div>

        {/* Transaction Details */}
        <div className="mb-3 pb-2 border-b border-gray-300">
          <div className="flex justify-between items-start text-[10px] mb-1">
            <span className="text-gray-600 font-medium">No. Transaksi:</span>
            <span className="text-gray-900 font-mono text-[9px] text-right max-w-[60%] break-all">
              {penjualan.nomor_struk || penjualan.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="text-gray-600 font-medium">Tgl:</span>
            <span className="text-gray-900 font-medium">
              {formatDateTime(penjualan.tanggal)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-600 font-medium">Kasir:</span>
            <span className="text-gray-900 font-medium capitalize">
              {penjualan.kasir_name || 'Admin'}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-3 pb-2 border-b border-gray-300">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id || index} className="text-[10px]">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-gray-900 font-medium flex-1 pr-2">
                    {item.nama_barang}
                  </span>
                  <span className="text-gray-900 font-semibold text-right whitespace-nowrap">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-600">
                  <span>
                    {item.jumlah} {item.satuan || 'pcs'} × {formatRupiah(item.harga_satuan_jual)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-3 pb-2 border-b-2 border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-900">TOTAL</span>
            <span className="text-sm font-bold text-gray-900">
              {formatRupiah(total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="text-gray-600">Bayar:</span>
            <span className="text-gray-900 font-medium">
              {formatRupiah(bayar)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-600">Kembali:</span>
            <span className="text-gray-900 font-medium">
              {formatRupiah(kembalian)}
            </span>
          </div>
        </div>

        {/* Footer dengan pesan impact */}
        <div className="text-center pt-2">
          <p className="text-[9px] text-gray-700 font-medium mb-2 leading-tight">
            Terima Kasih Telah Menjadi Bagian dari Gerakan
          </p>
          <p className="text-[9px] text-gray-800 font-bold mb-3 leading-tight">
            "SANTRI MANDIRI & BERDIKARI"
          </p>
          
          <div className="text-[9px] text-gray-600 mb-2 text-left">
            <p className="font-medium mb-1">Belanja Anda hari ini membantu:</p>
            <ul className="space-y-0.5 pl-2">
              <li className="flex items-start">
                <span className="mr-1">✓</span>
                <span>Beasiswa pendidikan santri yatim dan dhuafa</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1">✓</span>
                <span>Pelatihan kewirausahaan</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1">✓</span>
                <span>Pemberdayaan ekonomi pesantren</span>
              </li>
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-[9px] text-gray-600">
              Layanan Pelanggan: WA: 085955303882
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-300 flex gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWA}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share WA
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

