import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Palette, 
  CreditCard, 
  Settings, 
  LogOut,
  Home,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const roleNavItems = {
  designer: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/designer' },
    { icon: FileText, label: 'Orders', path: '/designer/orders' },
  ],
  cashier: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/cashier' },
    { icon: CreditCard, label: 'Payments', path: '/cashier/payments' },
  ],
  operator: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/operator' },
    { icon: Settings, label: 'Production', path: '/operator/production' },
  ],
};

export function Sidebar() {
  const location = useLocation();
  const { userRole, signOut, user } = useAuth();
  
  const navItems = userRole ? roleNavItems[userRole] || [] : [];

  const getRoleLabel = () => {
    switch (userRole) {
      case 'designer': return 'Designer';
      case 'cashier': return 'Kasir';
      case 'operator': return 'Operator';
      default: return 'User';
    }
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">Print Shop POS</h1>
            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === `/${userRole}` && location.pathname.startsWith(`/${userRole}`));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </motion.aside>
  );
}
