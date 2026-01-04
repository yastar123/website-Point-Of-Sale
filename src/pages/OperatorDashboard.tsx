import { useState, useEffect } from 'react';
import { Search, Printer, CheckCircle, Clock, Settings } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SPK {
  id: string;
  spk_number: string;
  order_id: string;
  production_status: 'pending' | 'printing' | 'finishing' | 'done';
  notes: string | null;
  created_at: string;
  orders: {
    order_number: string;
    total_amount: number;
    customers: {
      name: string;
    };
  };
}

const statusSteps = ['pending', 'printing', 'finishing', 'done'] as const;
const statusLabels = {
  pending: 'Menunggu',
  printing: 'Cetak',
  finishing: 'Finishing',
  done: 'Selesai'
};

export default function OperatorDashboard() {
  const [spkList, setSpkList] = useState<SPK[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSPK = async () => {
    const { data, error } = await supabase
      .from('spk')
      .select(`
        *,
        orders (
          order_number,
          total_amount,
          customers (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSpkList(data as SPK[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSPK();

    const channel = supabase
      .channel('spk-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spk' }, fetchSPK)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (spkId: string, currentStatus: string) => {
    const currentIndex = statusSteps.indexOf(currentStatus as typeof statusSteps[number]);
    if (currentIndex >= statusSteps.length - 1) return;

    const newStatus = statusSteps[currentIndex + 1];
    
    const { error } = await supabase
      .from('spk')
      .update({ 
        production_status: newStatus,
        operator_id: user?.id 
      })
      .eq('id', spkId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Diperbarui',
        description: `Produksi pindah ke ${statusLabels[newStatus]}`,
      });

      if (newStatus === 'done') {
        const spk = spkList.find(s => s.id === spkId);
        if (spk) {
          await supabase
            .from('orders')
            .update({ order_status: 'completed' })
            .eq('id', spk.order_id);
        }
      }

      fetchSPK();
    }
  };

  const filteredSPK = spkList.filter((spk) => {
    const matchesSearch =
      spk.spk_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.orders?.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || spk.production_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total SPK', value: spkList.length, icon: Settings, color: 'bg-primary' },
    { label: 'Menunggu', value: spkList.filter((s) => s.production_status === 'pending').length, icon: Clock, color: 'bg-warning' },
    { label: 'Proses', value: spkList.filter((s) => ['printing', 'finishing'].includes(s.production_status)).length, icon: Printer, color: 'bg-accent' },
    { label: 'Selesai', value: spkList.filter((s) => s.production_status === 'done').length, icon: CheckCircle, color: 'bg-success' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'printing': return Printer;
      case 'finishing': return Settings;
      case 'done': return CheckCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'printing': return 'bg-accent';
      case 'finishing': return 'bg-primary';
      case 'done': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getNextActionLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Mulai Cetak';
      case 'printing': return 'Mulai Finishing';
      case 'finishing': return 'Selesai';
      default: return '';
    }
  };

  return (
    <MainLayout title="Dashboard Operator" subtitle="Kelola produksi dan SPK">
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

      {/* Filters */}
      <GlassCard className="mb-5">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari SPK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-input border-border text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'pending', 'printing', 'finishing', 'done'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {status === 'all' ? 'Semua' : statusLabels[status as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* SPK Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center text-muted-foreground py-8 text-sm">Memuat...</p>
        ) : filteredSPK.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8 text-sm">Tidak ada SPK ditemukan</p>
        ) : (
          filteredSPK.map((spk) => {
            const StatusIcon = getStatusIcon(spk.production_status);
            const currentStepIndex = statusSteps.indexOf(spk.production_status);
            
            return (
              <motion.div
                key={spk.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard className="h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-base font-semibold text-foreground">{spk.spk_number}</p>
                      <p className="text-xs text-muted-foreground">{spk.orders?.order_number}</p>
                    </div>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getStatusColor(spk.production_status))}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground">Pelanggan</p>
                    <p className="text-sm font-medium text-foreground">{spk.orders?.customers?.name}</p>
                  </div>

                  {/* Progress Steps */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                isCompleted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground",
                                isCurrent && "ring-2 ring-primary/50"
                              )}
                            >
                              {index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((currentStepIndex + 1) / statusSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground mb-3">
                    {format(new Date(spk.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </p>

                  {/* Action */}
                  {spk.production_status !== 'done' ? (
                    <GradientButton
                      className="w-full"
                      size="sm"
                      onClick={() => updateStatus(spk.id, spk.production_status)}
                    >
                      {getNextActionLabel(spk.production_status)}
                    </GradientButton>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 text-success text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Selesai</span>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
