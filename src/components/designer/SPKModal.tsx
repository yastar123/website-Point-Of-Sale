import { useState } from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  customers: {
    name: string;
    phone: string | null;
  };
}

interface SPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export function SPKModal({ isOpen, onClose, order, onSuccess }: SPKModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const generateSPKNumber = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SPK-${date}-${random}`;
  };

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const spkNumber = generateSPKNumber();
      
      const { error } = await supabase
        .from('spk')
        .insert({
          spk_number: spkNumber,
          order_id: order.id,
          notes: notes || null,
          production_status: 'pending',
        });

      if (error) throw error;

      await supabase
        .from('orders')
        .update({ order_status: 'in_production' })
        .eq('id', order.id);

      toast({ title: 'SPK Dibuat', description: `SPK ${spkNumber} berhasil dibuat` });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Buat SPK</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Order Info */}
            <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">No. Order</span>
                <span className="font-mono text-foreground">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="text-foreground">{order.customers?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 mb-5">
              <Label className="text-sm">Catatan Produksi</Label>
              <Textarea
                placeholder="Instruksi khusus untuk operator..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-input border-border min-h-[80px] text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <GradientButton type="button" variant="ghost" onClick={onClose} className="flex-1">
                Batal
              </GradientButton>
              <GradientButton onClick={handleGenerate} loading={loading} className="flex-1">
                <Printer className="w-4 h-4" />
                Buat SPK
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
