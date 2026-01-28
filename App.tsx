
import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { Deadlines } from './pages/Deadlines';
import { Calendar } from './pages/Calendar';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { Team } from './pages/Team';
import { Publications } from './pages/Publications';
import { SplashScreen } from './components/SplashScreen';

const AppContent: React.FC = () => {
  const { currentUser, pendingAction } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');


  const [showSearch, setShowSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'cases': return <Cases />;
      case 'deadlines': return <Deadlines />;
      case 'calendar': return <Calendar />;
      case 'clients': return <Clients />;
      case 'settings': return <Settings />;
      case 'team': return <Team />;
      case 'publications': return <Publications setPage={setCurrentPage} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-950 transition-colors font-sans animate-fade-in">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          setPage={setCurrentPage}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderPage()}
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
