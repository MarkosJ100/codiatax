import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import MobileShell from './components/Layout/MobileShell';
import AuthScreen from './pages/AuthScreen';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import History from './pages/History';
import AirportShifts from './pages/AirportShifts';
import { Services } from './pages/Services';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import TaxiCalculator from './pages/TaxiCalculator';
import Billing from './pages/Billing';
import { appDataLoader, getUserFromStorage } from './loaders/appLoader';
import { supabase } from './supabase';
import PinGuard from './components/Auth/PinGuard';

// Check if user has completed profile setup
const hasCompletedProfile = (user: any): boolean => {
  return user && user.name && user.licenseNumber;
};

// Auth route wrapper (only accessible if NOT logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
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
  const { user } = useApp();
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
  const { user } = useApp();
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
    element: <ProtectedRoute><PinGuard><MobileShell /></PinGuard></ProtectedRoute>,
    loader: async () => {
      let user = getUserFromStorage();
      // Fallback: if localStorage is empty (race condition), check the live Supabase session
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const metadata = session.user.user_metadata;
          user = {
            name: metadata.name || '',
            role: metadata.role || 'propietario',
            licenseNumber: metadata.licenseNumber || '',
          };
          // Persist for next time
          localStorage.setItem('codiatax_user', JSON.stringify(user));
        } else {
          return redirect('/auth');
        }
      }
      if (!hasCompletedProfile(user)) return redirect('/setup');
      return appDataLoader(user.name);
    },
    children: [
      { index: true, element: <Home /> },
      { path: "services", element: <Services /> },
      { path: "history", element: <History /> },
      { path: "airport", element: <AirportShifts /> },
      { path: "expenses", element: <Expenses /> },
      { path: "maintenance", element: <Maintenance /> },
      { path: "calculator", element: <TaxiCalculator /> },
      { path: "billing", element: <Billing /> },
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
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
