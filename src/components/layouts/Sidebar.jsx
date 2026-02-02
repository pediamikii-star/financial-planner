// src/components/layouts/Sidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  CreditCard, 
  Receipt, 
  Package, 
  TrendingUp, 
  Users, 
  Target,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import logo from "../../assets/Logo.jpg";

// TAMBAH PROPS untuk toggleCollapse
export default function Sidebar({ close, isCollapsed = false, toggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home size={22} /> },
    { path: "/accounts", label: "Accounts", icon: <CreditCard size={22} /> },
    { path: "/transactions", label: "Transactions", icon: <Receipt size={22} /> },
    { path: "/assets", label: "Assets", icon: <Package size={22} /> },
    { path: "/investments", label: "Investments", icon: <TrendingUp size={22} /> },
    { path: "/creators", label: "Creators", icon: <Users size={22} /> },
    { path: "/goals", label: "Goals", icon: <Target size={22} /> },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (close) close();
  };

  const logout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  return (
    <div className="h-full bg-gray-800 p-4 flex flex-col relative">
      {/* HEADER DENGAN TOMBOL COLLAPSE */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 relative`}>
        {/* LOGO DAN TEKS */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg" />
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-lg">Mikipedia</h1>
                <p className="text-gray-300 text-sm">Planner</p>
              </div>
            </div>
          )}
        </div>

        {/* TOMBOL COLLAPSE - DI DALAM SIDEBAR */}
        {!isCollapsed && toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {/* TOMBOL COLLAPSE SAAT SIDEBAR SUDAH COLLAPSED */}
        {isCollapsed && toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 
                     bg-gray-800 text-gray-300 hover:text-white 
                     border border-gray-700 hover:border-gray-600 
                     p-2 rounded-full shadow-lg transition-all hover:scale-110"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-3 gap-3'} 
                py-3 w-full rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
              title={isCollapsed ? item.label : ""}
            >
              {item.icon}
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className={`
          flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-3 gap-3'} 
          py-3 mt-6 rounded-lg text-red-400 
          hover:bg-red-900/30 hover:text-red-300 transition-colors
        `}
        title={isCollapsed ? "Logout" : ""}
      >
        <LogOut size={22} />
        {!isCollapsed && <span className="font-medium">Logout</span>}
      </button>
    </div>
  );
}