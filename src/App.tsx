import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import MobileShell from './components/Layout/MobileShell';
import Login from './pages/Login';
import Home from './pages/Home';
import History from './pages/History';
import AirportShifts from './pages/AirportShifts';
import { Services } from './pages/Services';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import TaxiCalculator from './pages/TaxiCalculator';
import { appDataLoader, getUserFromStorage } from './loaders/appLoader';

// Protected route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Public route wrapper (redirects to home if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Create router once (stable reference)
const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/",
    element: <ProtectedRoute><MobileShell /></ProtectedRoute>,
    loader: async () => {
      const user = getUserFromStorage();
      if (!user) return redirect('/login');
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
    ],
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
