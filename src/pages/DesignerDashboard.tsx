import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, DollarSign, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { OrderFormModal } from '@/components/designer/OrderFormModal';
import { SPKModal } from '@/components/designer/SPKModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  deadline: string | null;
  notes: string | null;
  created_at: string;
  customers: {
    name: string;
    phone: string | null;
    email: string | null;
  };
}

export default function DesignerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSPKModal, setShowSPKModal] = useState(false);
  const { user } = useAuth();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (name, phone, email)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Pesanan', value: orders.length, icon: FileText, color: 'bg-primary' },
    { label: 'Belum Bayar', value: orders.filter((o) => o.payment_status === 'pending').length, icon: Clock, color: 'bg-warning' },
    { label: 'Produksi', value: orders.filter((o) => o.order_status === 'in_production').length, icon: Package, color: 'bg-accent' },
    { label: 'Pendapatan', value: `Rp ${orders.filter((o) => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-success' },
  ];

  const handleGenerateSPK = (order: Order) => {
    setSelectedOrder(order);
    setShowSPKModal(true);
  };

  return (
    <MainLayout title="Dashboard Designer" subtitle="Kelola pesanan dan buat SPK">
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

      {/* Actions & Filters */}
      <GlassCard className="mb-5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari pesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-input border-border text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Lunas</option>
              <option value="in_production">Produksi</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <GradientButton onClick={() => setShowOrderModal(true)}>
            <Plus className="w-4 h-4" />
            Pesanan Baru
          </GradientButton>
        </div>
      </GlassCard>

      {/* Orders Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">No. Order</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Pelanggan</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Bayar</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Belum ada pesanan. Buat pesanan pertama Anda!
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-foreground">{order.order_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.customers?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.customers?.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      Rp {Number(order.total_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="py-3 px-4">
                      {order.payment_status === 'paid' && order.order_status === 'paid' && (
                        <GradientButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateSPK(order)}
                        >
                          Buat SPK
                        </GradientButton>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modals */}
      <OrderFormModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSuccess={fetchOrders}
      />

      {selectedOrder && (
        <SPKModal
          isOpen={showSPKModal}
          onClose={() => {
            setShowSPKModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}
    </MainLayout>
  );
}
