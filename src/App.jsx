import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Campanhas from './pages/Campanhas';
import Assinatura from './pages/Assinatura';
import GerenciarCupons from './pages/GerenciarCupons';
import Metas from './pages/Metas';
import Suporte from './pages/Suporte';
import ExcluirConta from './pages/ExcluirConta';
import SimuladorReenquadramento from './pages/SimuladorReenquadramento';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Campanhas" element={
        <LayoutWrapper currentPageName="Campanhas">
          <Campanhas />
        </LayoutWrapper>
      } />
      {/* Assinatura desabilitada temporariamente */}
      <Route path="/GerenciarCupons" element={
        <LayoutWrapper currentPageName="GerenciarCupons">
          <GerenciarCupons />
        </LayoutWrapper>
      } />
      <Route path="/Metas" element={
        <LayoutWrapper currentPageName="Metas">
          <Metas />
        </LayoutWrapper>
      } />
      <Route path="/Suporte" element={
        <LayoutWrapper currentPageName="Suporte">
          <Suporte />
        </LayoutWrapper>
      } />
      <Route path="/ExcluirConta" element={
        <LayoutWrapper currentPageName="ExcluirConta">
          <ExcluirConta />
        </LayoutWrapper>
      } />
      <Route path="/SimuladorReenquadramento" element={
        <LayoutWrapper currentPageName="SimuladorReenquadramento">
          <SimuladorReenquadramento />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function useDarkModeSync() {
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
}

function App() {
  useDarkModeSync();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App