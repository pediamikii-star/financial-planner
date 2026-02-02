import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Assets from "./pages/Assets";
import Investments from "./pages/Investments";
import Creators from "./pages/Creators";
import Goals from "./pages/Goals";
import Layout from "./components/layouts/Layout";

export default function App() {
  // Cek apakah user sudah login
  const isAuth = localStorage.getItem("auth");

  return (
    <Routes>
      {/* ===== PUBLIC ROUTE ===== */}
      {/* Halaman login - accessible tanpa auth */}
      <Route path="/login" element={<Login />} />

      {/* ===== PROTECTED ROUTES WITH LAYOUT ===== */}
      {/* Semua route di bawah ini menggunakan Layout (dengan sidebar) */}
      {/* Layout hanya ditampilkan jika user sudah login */}
      <Route element={isAuth ? <Layout /> : <Navigate to="/login" />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Accounts */}
        <Route path="/accounts" element={<Accounts />} />
        
        {/* Transactions */}
        <Route path="/transactions" element={<Transactions />} />
        
        {/* Assets */}
        <Route path="/assets" element={<Assets />} />
        
        {/* Investments */}
        <Route path="/investments" element={<Investments />} />
        
        {/* Creators */}
        <Route path="/creators" element={<Creators />} />
        
        {/* Goals */}
        <Route path="/goals" element={<Goals />} />
      </Route>

      {/* ===== FALLBACK ROUTE ===== */}
      {/* Redirect semua route yang tidak dikenal ke login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}