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
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
    <div className="loading-spinner"></div>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
  </div>
);

// Wrapper for Lazy Pages with Transition
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// Auth route wrapper (only accessible if NOT logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    // If logged in, check if profile is complete
    if (hasCompletedProfile(user)) {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/setup" replace />;
    }
  }
  return <>{children}</>;
};

// Setup route wrapper (only accessible if logged in but profile incomplete)
const SetupRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (hasCompletedProfile(user)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Protected route wrapper (only accessible if logged in AND profile complete)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (!hasCompletedProfile(user)) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
};

// Create router
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthRoute><AuthScreen /></AuthRoute>,
  },
  {
    path: "/setup",
    element: <SetupRoute><ProfileSetup /></SetupRoute>,
  },
  {
    path: "/",
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
      { path: "services", element: <PageWrapper><ServicesPage /></PageWrapper> },
      { path: "history", element: <PageWrapper><History /></PageWrapper> },
      { path: "airport", element: <PageWrapper><AirportShifts /></PageWrapper> },
      { path: "expenses", element: <PageWrapper><Expenses /></PageWrapper> },
      { path: "maintenance", element: <PageWrapper><Maintenance /></PageWrapper> },
      { path: "calculator", element: <PageWrapper><TaxiCalculator /></PageWrapper> },
      { path: "billing", element: <PageWrapper><Billing /></PageWrapper> },
      { path: "invoicing", element: <PageWrapper><Invoicing /></PageWrapper> },
    ],
  },
  // Redirect old /login to /auth
  {
    path: "/login",
    element: <Navigate to="/auth" replace />,
  },
]);

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} fallbackElement={<LoadingFallback />} />
    </AppProvider>
  );
}

export default App;
