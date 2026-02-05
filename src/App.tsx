import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import MobileShell from './components/Layout/MobileShell';
import Login from './pages/Login';
import Home from './pages/Home';
import History from './pages/History';
import AirportShifts from './pages/AirportShifts';
import { Services } from './pages/Services';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';

const AppRoutes: React.FC = () => {
  const { user } = useApp();

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<MobileShell />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="history" element={<History />} />
        <Route path="airport" element={<AirportShifts />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="maintenance" element={<Maintenance />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
