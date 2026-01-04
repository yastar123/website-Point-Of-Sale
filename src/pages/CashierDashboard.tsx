import { useState, useEffect } from 'react';
import { Search, CreditCard, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { PaymentModal } from '@/components/cashier/PaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'paid' | 'in_production' | 'completed';
  created_at: string;
  customers: {
    name: string;
    phone: string | null;
    email: string | null;
  };
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  orders: {
    order_number: string;
    customers: {
      name: string;
    };
  };
}

export default function CashierDashboard() {
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchData = async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`*, customers (name, phone, email)`)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false });

    if (ordersData) setUnpaidOrders(ordersData as Order[]);

    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`*, orders (order_number, customers (name))`)
      .order('payment_date', { ascending: false })
      .limit(20);

    if (paymentsData) setPayments(paymentsData as Payment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('cashier-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = unpaidOrders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayPayments = payments.filter(
    (p) => new Date(p.payment_date).toDateString() === new Date().toDateString()
  );

  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const stats = [
    { label: 'Pesanan Pending', value: unpaidOrders.length, icon: Clock, color: 'bg-warning' },
    { label: 'Bayar Hari Ini', value: todayPayments.length, icon: CheckCircle, color: 'bg-success' },
    { label: 'Total Hari Ini', value: `Rp ${todayTotal.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-accent' },
    { label: 'Total Transaksi', value: payments.length, icon: CreditCard, color: 'bg-primary' },
  ];

  const handleProcessPayment = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  return (
    <MainLayout title="Dashboard Kasir" subtitle="Proses pembayaran dan kelola transaksi">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Unpaid Orders */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Menunggu Pembayaran</h2>
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-input border-border text-sm h-8"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Memuat...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada pembayaran pending</p>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.customers?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-foreground">Rp {Number(order.total_amount).toLocaleString('id-ID')}</p>
                    <GradientButton size="sm" onClick={() => handleProcessPayment(order)}>
                      Bayar
                    </GradientButton>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Payment History */}
        <GlassCard>
          <h2 className="text-base font-semibold text-foreground mb-4">Riwayat Pembayaran</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Belum ada pembayaran</p>
            ) : (
              payments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{payment.orders?.order_number}</p>
                    <p className="text-xs text-muted-foreground">{payment.orders?.customers?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(payment.payment_date), 'dd MMM, HH:mm', { locale: id })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-success">Rp {Number(payment.amount).toLocaleString('id-ID')}</p>
                    <span className="text-xs text-muted-foreground capitalize">{payment.payment_method === 'cash' ? 'Tunai' : 'Kartu'}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {selectedOrder && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={fetchData}
        />
      )}
    </MainLayout>
  );
}
