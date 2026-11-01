/* @module: routes/index — application routes with lazy loading and suspense */
import React, { Suspense, useState, useEffect } from 'react';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';

const HomePage = React.lazy(() => import('../modules/home'));
const AuthPage = React.lazy(() => import('../modules/auth'));
const DashboardPage = React.lazy(() => import('../modules/dashboard'));

export const AppRoutes: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setMobileDrawerOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setMobileDrawerOpen(false);
  };

  const renderRoute = () => {
    if (currentPath === '/auth') {
      return <AuthPage onSuccess={() => navigate('/dashboard')} onBack={() => navigate('/')} />;
    }
    if (currentPath === '/dashboard') {
      return (
        <DashboardPage
          isMobileDrawerOpen={mobileDrawerOpen}
          onToggleMobileDrawer={() => setMobileDrawerOpen((prev) => !prev)}
          onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
          onNavigateHome={() => navigate('/')}
        />
      );
    }
    return <HomePage onEnterPlatform={() => navigate('/dashboard')} />;
  };

  const getSectionTitle = () => {
    if (currentPath === '/auth') return 'Authentication & Access';
    if (currentPath === '/dashboard') return 'Live Coordination Dashboard';
    return 'Public Portal & Emergency Coordination';
  };

  return (
    <div className="min-h-screen bg-lifedrop-bg flex flex-col selection:bg-lifedrop-primary selection:text-white">
      <Navbar
        activeSectionTitle={getSectionTitle()}
        onNavigate={navigate}
        currentPath={currentPath}
        onToggleSidebar={currentPath === '/dashboard' ? () => setMobileDrawerOpen((prev) => !prev) : undefined}
      />

      <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-500 font-bold text-sm">Loading LifeDrop...</div>}>
        {renderRoute()}
      </Suspense>

      {currentPath !== '/' && <Footer onRoleSelect={() => navigate('/dashboard')} />}
    </div>
  );
};

export default AppRoutes;

