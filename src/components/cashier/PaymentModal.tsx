import { useState } from 'react';
import { X, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  customers: {
    name: string;
    phone: string | null;
    email: string | null;
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

function PaymentForm({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);

    try {
      let stripePaymentId = null;

      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast({ title: 'Error', description: 'Stripe belum dimuat', variant: 'destructive' });
          setLoading(false);
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast({ title: 'Error', description: 'Card element tidak ditemukan', variant: 'destructive' });
          setLoading(false);
          return;
        }

        const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          toast({ title: 'Error Pembayaran', description: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }

        stripePaymentId = pm.id;
      }

      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: order.id,
        amount: order.total_amount,
        payment_method: paymentMethod,
        stripe_payment_id: stripePaymentId,
        cashier_id: user?.id,
      });

      if (paymentError) throw paymentError;

      const { error: orderError } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', order_status: 'paid' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      setSuccess(true);
      toast({ title: 'Pembayaran Berhasil', description: `Order ${order.order_number} sudah dibayar` });
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#64748b',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-success flex items-center justify-center mb-4"
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Pembayaran Berhasil!</h3>
        <p className="text-sm text-muted-foreground">Order {order.order_number} sudah lunas</p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Order Summary */}
      <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 mb-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order</span>
          <span className="font-mono text-foreground">{order.order_number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pelanggan</span>
          <span className="text-foreground">{order.customers?.name}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-2">Metode Pembayaran</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={cn(
              "p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all",
              paymentMethod === 'cash'
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/20"
            )}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-xs font-medium">Tunai</span>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              "p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all",
              paymentMethod === 'card'
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/20"
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Kartu</span>
          </button>
        </div>
      </div>

      {/* Card Input */}
      {paymentMethod === 'card' && (
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">Detail Kartu</p>
          <div className="p-3 bg-input rounded-lg border border-border">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Test: 4242 4242 4242 4242 | Exp: any future | CVC: any
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <GradientButton type="button" variant="ghost" onClick={onClose} className="flex-1">
          Batal
        </GradientButton>
        <GradientButton onClick={handlePayment} loading={loading} className="flex-1">
          {paymentMethod === 'cash' ? 'Konfirmasi Tunai' : 'Proses Kartu'}
        </GradientButton>
      </div>
    </>
  );
}

export function PaymentModal({ isOpen, onClose, order, onSuccess }: PaymentModalProps) {
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
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Pembayaran</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <Elements stripe={stripePromise}>
              <PaymentForm order={order} onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
