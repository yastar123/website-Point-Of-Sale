import { cn } from '@/lib/utils';

type Status = 'pending' | 'paid' | 'printing' | 'finishing' | 'done' | 'failed' | 'in_production' | 'completed';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'status-pending' },
  paid: { label: 'Lunas', className: 'status-paid' },
  printing: { label: 'Cetak', className: 'status-printing' },
  finishing: { label: 'Finishing', className: 'status-finishing' },
  done: { label: 'Selesai', className: 'status-done' },
  failed: { label: 'Gagal', className: 'bg-destructive/15 text-destructive border-destructive/25' },
  in_production: { label: 'Produksi', className: 'status-printing' },
  completed: { label: 'Selesai', className: 'status-done' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
      config.className,
      className
    )}>
      <span className="w-1 h-1 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
}
