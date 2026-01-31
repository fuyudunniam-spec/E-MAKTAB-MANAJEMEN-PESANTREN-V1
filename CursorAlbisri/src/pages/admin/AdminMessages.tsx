import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Loader2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data pesan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openMessageDialog = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);

    if (!message.is_read) {
      try {
        await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .eq('id', message.id);
        
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m))
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pesan ini?')) return;

    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Pesan berhasil dihapus' });
      fetchMessages();
      if (selectedMessage?.id === id) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pesan',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pesan Masuk</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : 'Semua pesan sudah dibaca'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengirim</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada pesan masuk
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id} className={!message.is_read ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div>
                        <p className={`font-medium ${!message.is_read ? 'text-foreground' : ''}`}>
                          {message.name}
                        </p>
                        {message.email && (
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-xs">{message.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.is_read ? 'secondary' : 'default'}>
                        {message.is_read ? 'Dibaca' : 'Baru'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(message.created_at), 'd MMM yyyy, HH:mm', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openMessageDialog(message)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Pengirim</h4>
                <p className="text-lg">{selectedMessage.name}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                {selectedMessage.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedMessage.email}`} className="hover:text-primary">
                      {selectedMessage.email}
                    </a>
                  </div>
                )}
                {selectedMessage.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedMessage.phone}`} className="hover:text-primary">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Pesan</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Dikirim pada {format(new Date(selectedMessage.created_at), 'd MMMM yyyy, HH:mm', { locale: id })}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {selectedMessage.phone && (
                  <Button asChild variant="outline">
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/\D/g, '')}?text=Assalamu'alaikum ${selectedMessage.name}, terima kasih telah menghubungi Pesantren Mahasiswa An-Nur.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Balas via WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => deleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Pesan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
