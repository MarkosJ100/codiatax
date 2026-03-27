import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import MobileShell from './components/Layout/MobileShell';
import { appDataLoader, getUserFromStorage, loadUserFromSupabaseSession } from './loaders/appLoader';
import { hasCompletedProfile } from './utils/userHelpers';

// Lazy Loaded Pages
const AuthScreen = lazy(() => import('./pages/AuthScreen'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Home = lazy(() => import('./pages/Home'));
const History = lazy(() => import('./pages/History'));
const AirportShifts = lazy(() => import('./pages/AirportShifts'));
const ServicesPage = lazy(() => import('./pages/Services').then(module => ({ default: module.Services })));
const Expenses = lazy(() => import('./pages/Expenses'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const TaxiCalculator = lazy(() => import('./pages/TaxiCalculator'));
const Billing = lazy(() => import('./pages/Billing'));
const Invoicing = lazy(() => import('./pages/Invoicing'));

// Loading Component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary, #0f172a)' }}>
    <div className="loading-spinner"></div>
    <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>Cargando...</p>
  </div>
);

// Wrapper for Lazy Pages with Suspense + per-page error boundary
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Global Error Boundary to show a readable message instead of a white screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || 'Error desconocido' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: '100vh', flexDirection: 'column', gap: '1rem',
          background: '#0f172a', padding: '2rem', textAlign: 'center'
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <p style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>Algo salió mal</p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 320 }}>{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: '#7c3aed', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth route wrapper (only accessible if NOT logged in)
// IMPORTANT: must wait for loading=false before redirecting, otherwise
// the async Supabase session check causes premature redirects on mobile.
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (user) {
    if (hasCompletedProfile(user)) return <Navigate to="/" replace />;
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
};

// Setup route wrapper (only accessible if logged in but profile incomplete)
const SetupRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasCompletedProfile(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Protected route wrapper (only accessible if logged in AND profile complete)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasCompletedProfile(user)) return <Navigate to="/setup" replace />;
  return <>{children}</>;
};

const routes = [
  {
    path: '/auth',
    element: <AuthRoute><AuthScreen /></AuthRoute>,
  },
  {
    path: '/setup',
    element: <SetupRoute><ProfileSetup /></SetupRoute>,
  },
  {
    path: '/',
    element: <ProtectedRoute><MobileShell /></ProtectedRoute>,
    HydrateFallback: LoadingFallback,
    loader: async () => {
      let user = getUserFromStorage();
      if (!user) {
        user = await loadUserFromSupabaseSession();
        if (!user) return redirect('/auth');
      }
      if (!hasCompletedProfile(user)) return redirect('/setup');
      return appDataLoader(user.name);
    },
    children: [
      { index: true, element: <PageWrapper><Home /></PageWrapper> },
      { path: 'services', element: <PageWrapper><ServicesPage /></PageWrapper> },
      { path: 'history', element: <PageWrapper><History /></PageWrapper> },
      { path: 'airport', element: <PageWrapper><AirportShifts /></PageWrapper> },
      { path: 'expenses', element: <PageWrapper><Expenses /></PageWrapper> },
      { path: 'maintenance', element: <PageWrapper><Maintenance /></PageWrapper> },
      { path: 'calculator', element: <PageWrapper><TaxiCalculator /></PageWrapper> },
      { path: 'billing', element: <PageWrapper><Billing /></PageWrapper> },
      { path: 'invoicing', element: <PageWrapper><Invoicing /></PageWrapper> },
    ],
  },
  {
    path: '/login',
    element: <Navigate to="/auth" replace />,
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} fallbackElement={<LoadingFallback />} />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
