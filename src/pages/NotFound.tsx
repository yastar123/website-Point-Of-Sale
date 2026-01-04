import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-xl p-10 max-w-sm mx-auto text-center">
        <div className="w-14 h-14 rounded-xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        
        <h1 className="text-5xl font-bold text-primary mb-3">404</h1>
        <h2 className="text-lg font-semibold text-foreground mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Halaman yang Anda cari tidak ada.
        </p>

        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
