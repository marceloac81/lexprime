
import React, { useState, useEffect, Suspense } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Cases = React.lazy(() => import('./pages/Cases').then(m => ({ default: m.Cases })));
const Deadlines = React.lazy(() => import('./pages/Deadlines').then(m => ({ default: m.Deadlines })));
const Calendario = React.lazy(() => import('./pages/Calendario').then(m => ({ default: m.Calendario })));
const Clients = React.lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Team = React.lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const Publications = React.lazy(() => import('./pages/Publications').then(m => ({ default: m.Publications })));
const Calculations = React.lazy(() => import('./pages/Calculations'));

const PageLoader: React.FC<{ theme?: string }> = ({ theme }) => (
  <div className="flex-1 h-full min-h-[240px] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${theme === 'hybrid' ? 'border-[#00a884]' : 'border-blue-600'}`} />
      <span className={`text-xs font-medium ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500'}`}>Carregando módulo...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { currentUser, pendingAction, theme } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [showSearch, setShowSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Keyboard shortcut for Search (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Quick Actions Navigation
  useEffect(() => {
    if (pendingAction === 'newCase') setCurrentPage('cases');
    if (pendingAction === 'newClient') setCurrentPage('clients');
    if (pendingAction === 'newDeadline' || pendingAction?.startsWith('editDeadline:')) setCurrentPage('deadlines');
    if (pendingAction?.startsWith('editCase:')) setCurrentPage('cases');
  }, [pendingAction]);

  // Route Protection for Settings
  useEffect(() => {
    if (currentPage === 'settings' && currentUser && !currentUser.isAdmin) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, currentUser]);

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setPage={setCurrentPage} />;
      case 'cases': return <Cases />;
      case 'deadlines': return <Deadlines />;
      case 'calendario': return <Calendario />;
      case 'clients': return <Clients />;
      case 'settings': return <Settings />;
      case 'team': return <Team />;
      case 'publications': return <Publications setPage={setCurrentPage} />;
      case 'calculations': return <Calculations />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors font-sans animate-fade-in ${theme === 'hybrid' ? 'bg-[#222e35]' : 'bg-white'}`}>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[110] md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        activePage={currentPage}
        setPage={setCurrentPage}
        isOpen={isSidebarOpen}
        close={() => setIsSidebarOpen(false)}
        collapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          setPage={setCurrentPage}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ErrorBoundary key={currentPage} fallbackTitle="Erro ao carregar esta página">
            <Suspense fallback={<PageLoader theme={theme} />}>
              {renderPage()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
