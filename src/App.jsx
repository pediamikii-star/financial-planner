import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "./lib/supabase.js";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Assets from "./pages/Assets";
import Investments from "./pages/Investments";
import Creators from "./pages/Creators";
import Goals from "./pages/Goals";
import Layout from "./components/layouts/Layout";
import BackupPage from './pages/BackupPage'
import AuthCallback from "./pages/AuthCallback";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check
    checkAuth();
    
    // Listen for auth changes
    const handleAuthChange = (event) => {
      const { user, event: authEvent } = event.detail;
      console.log('Auth change detected:', authEvent);
      setUser(user);
      
      // If user logs out, stop loading
      if (authEvent === 'SIGNED_OUT') {
        setLoading(false);
      }
    };
    
    window.addEventListener('supabase:auth', handleAuthChange);
    
    return () => {
      window.removeEventListener('supabase:auth', handleAuthChange);
    };
  }, []);

  async function checkAuth() {
    const user = await getCurrentUser();
    setUser(user);
    setLoading(false);
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* PROTECTED ROUTES */}
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/backup" element={<BackupPage />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}