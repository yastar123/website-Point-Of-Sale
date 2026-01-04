import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Palette, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  role: z.enum(['designer', 'cashier', 'operator']),
});

type UserRole = 'designer' | 'cashier' | 'operator';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('designer');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Gagal',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Selamat datang!', description: 'Mengarahkan ke dashboard...' });
          setTimeout(() => navigate(`/${role}`), 500);
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName, role });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          toast({
            title: 'Registrasi Gagal',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Akun dibuat!', description: 'Selamat datang di sistem POS.' });
          navigate(`/${role}`);
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: 'designer', label: 'Designer', desc: 'Buat pesanan' },
    { value: 'cashier', label: 'Kasir', desc: 'Proses pembayaran' },
    { value: 'operator', label: 'Operator', desc: 'Produksi' },
  ];

  // Demo accounts info
  const demoAccounts = [
    { email: 'designer@demo.com', role: 'Designer' },
    { email: 'cashier@demo.com', role: 'Kasir' },
    { email: 'operator@demo.com', role: 'Operator' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Print Shop POS</h1>
              <p className="text-xs text-muted-foreground">Sistem Manajemen Percetakan</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nama Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-sm">Pilih Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        role === r.value
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <span className="text-sm font-medium block">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <GradientButton type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Memproses...' : (
                <>
                  {isLogin ? 'Masuk' : 'Daftar'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </GradientButton>
          </form>

          {/* Demo Accounts */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Akun Demo (password: demo123)</p>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('demo123');
                    setIsLogin(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
                >
                  <span className="text-foreground">{acc.email}</span>
                  <span className="text-muted-foreground ml-2">({acc.role})</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
