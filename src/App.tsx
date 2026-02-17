import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import LoansList from './pages/LoansList';
import NewLoan from './pages/NewLoan';
import Payments from './pages/Payments';
import Plans from './pages/Plans';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Config from './pages/Config';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        {/* Rutas Protegidas */}
        <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/clientes" element={session ? <Clients /> : <Navigate to="/login" />} />
        <Route path="/prestamos" element={session ? <LoansList /> : <Navigate to="/login" />} />
        <Route path="/nuevo-prestamo" element={session ? <NewLoan /> : <Navigate to="/login" />} />
        <Route path="/pagos/:id" element={session ? <Payments /> : <Navigate to="/login" />} />
        <Route path="/reportes" element={session ? <Reports /> : <Navigate to="/login" />} />
        <Route path="/planes" element={session ? <Plans /> : <Navigate to="/login" />} />
        <Route path="/configuracion" element={session ? <Config /> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
