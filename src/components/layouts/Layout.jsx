// src/components/layouts/Layout.jsx
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== SIDEBAR DESKTOP ===== */}
      <div className={`
        hidden lg:block
        ${isCollapsed ? 'w-20' : 'w-64'} 
        transition-all duration-300
        bg-gray-800
        h-screen
        fixed left-0 top-0
        z-30
      `}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleCollapse={toggleCollapse}
        />
      </div>

      {/* ===== MOBILE OVERLAY ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              close={() => setSidebarOpen(false)} 
              isCollapsed={false}
            />
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className={`
        flex-1
        transition-all duration-300
        ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        min-h-screen
        bg-gray-50
      `}>
        {/* HANYA TOMBOL MENU MOBILE - TANPA HEADER PUTIH */}
        <div className="lg:hidden sticky top-0 z-20 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* PAGE CONTENT LANGSUNG */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}