import { useState } from "react";
import { MapPin, Phone, Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  contact: z.string().trim().min(5, "Email/No WA minimal 5 karakter").max(100, "Email/No WA maksimal 100 karakter"),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(1000, "Pesan maksimal 1000 karakter"),
});

export function ContactSection() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      contact: formData.get('contact') as string,
      message: formData.get('message') as string,
    };

    // Validate input check
    const result = contactSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const isEmail = data.contact.includes('@');

      const { error } = await supabase.from('contact_messages').insert([{
        name: data.name,
        email: isEmail ? data.contact : null,
        phone: !isEmail ? data.contact : null,
        message: data.message,
      }]);

      if (error) throw error;

      toast.success("Pesan berhasil dikirim! Kami akan segera menghubungi Anda.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="kontak" className="relative py-24 bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-1/4 -z-10" />

      <div className="container-section">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24">

          {/* Info Side */}
          <div className="space-y-10">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
                Hubungi Kami
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 leading-tight mb-6">
                Mari Saling Terhubung
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed font-light">
                Kami selalu terbuka untuk silaturahmi. Jangan ragu untuk menghubungi kami terkait pendaftaran santri, donasi, atau informasi lainnya.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { icon: MapPin, title: "Alamat", content: "Jl. Pendidikan No. 123, Kota Santri, Indonesia", action: null },
                { icon: Phone, title: "Telepon / WhatsApp", content: "+62 812-3456-7890", action: "https://wa.me/6281234567890" },
                { icon: Mail, title: "Email", content: "info@pesantrenannur.id", action: "mailto:info@pesantrenannur.id" }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>
                    {item.action ? (
                      <a href={item.action} className="text-slate-600 hover:text-primary transition-colors text-base font-light">
                        {item.content}
                      </a>
                    ) : (
                      <p className="text-slate-600 font-light max-w-xs">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.82496091476882!3d-6.194741395493371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2ad6e1e0e9bcc8!2sMonas!5e0!3m2!1sen!2sid!4v1635134456789!5m2!1sen!2sid"
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '1rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="shadow-md grayscale hover:grayscale-0 transition-all duration-500 opacity-90 hover:opacity-100"
              />
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 h-fit">
            <h3 className="text-2xl font-heading font-bold text-slate-900 mb-8">Kirim Pesan</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-500 font-medium">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 h-12 rounded-xl"
                  placeholder="Nama Lengkap Anda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact" className="text-slate-500 font-medium">Email / WhatsApp</Label>
                <Input
                  id="contact"
                  name="contact"
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 h-12 rounded-xl"
                  placeholder="email@anda.com atau 0812..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-500 font-medium">Pesan</Label>
                <Textarea
                  id="message"
                  name="message"
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 min-h-[150px] rounded-xl resize-none"
                  placeholder="Tuliskan pesan Anda..."
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Pesan Sekarang
                  </>
                )}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
