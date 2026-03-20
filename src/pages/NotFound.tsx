import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-body selection:bg-secondary/30">
      <div className="text-center px-6">
        <span className="material-symbols-outlined text-7xl text-secondary/40 mb-6 block">restaurant</span>
        <h1 className="text-6xl font-headline font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-on-surface-variant mb-6 font-body">This page doesn't exist</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary/20"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
