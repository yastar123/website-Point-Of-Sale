import { useState, useEffect } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export function OrderFormModal({ isOpen, onClose, onSuccess }: OrderFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [items, setItems] = useState<OrderItem[]>([{ product_name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    if (data) setCustomers(data);
  };

  const generateOrderNumber = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${date}-${random}`;
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let customerId = selectedCustomerId;

      if (showNewCustomer) {
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert({
            name: newCustomer.name,
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
          })
          .select()
          .single();

        if (custError) throw custError;
        customerId = newCust.id;
      }

      if (!customerId) {
        toast({ title: 'Error', description: 'Pilih atau buat pelanggan', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const orderNumber = generateOrderNumber();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          designer_id: user?.id,
          total_amount: calculateTotal(),
          notes: notes || null,
          deadline: deadline || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.filter(item => item.product_name).map((item) => ({
        order_id: order.id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
      }));

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      toast({ title: 'Berhasil', description: `Pesanan ${orderNumber} berhasil dibuat` });
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setShowNewCustomer(false);
    setNewCustomer({ name: '', phone: '', email: '' });
    setItems([{ product_name: '', quantity: 1, price: 0 }]);
    setNotes('');
    setDeadline('');
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
          className="w-full max-w-xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Pesanan Baru</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Pelanggan</Label>
                {!showNewCustomer ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
                    >
                      <option value="">Pilih pelanggan...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone && `(${c.phone})`}
                        </option>
                      ))}
                    </select>
                    <GradientButton type="button" variant="outline" size="sm" onClick={() => setShowNewCustomer(true)}>
                      <User className="w-3.5 h-3.5" />
                      Baru
                    </GradientButton>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Pelanggan Baru</span>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomer(false)}
                        className="text-xs text-primary hover:underline"
                      >
                        Gunakan existing
                      </button>
                    </div>
                    <Input
                      placeholder="Nama Pelanggan *"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="bg-input border-border text-sm"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="No. HP"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="bg-input border-border text-sm"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className="bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Item Pesanan</Label>
                  <GradientButton type="button" variant="ghost" size="sm" onClick={addItem}>
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </GradientButton>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Nama produk"
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      className="flex-1 bg-input border-border text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 bg-input border-border text-sm"
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Harga"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-input border-border text-sm"
                      min={0}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg border border-border/50">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>

              {/* Deadline & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-input border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Catatan</Label>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-input border-border h-[38px] resize-none text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <GradientButton type="button" variant="ghost" onClick={onClose} className="flex-1">
                  Batal
                </GradientButton>
                <GradientButton type="submit" loading={loading} className="flex-1">
                  Buat Pesanan
                </GradientButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
