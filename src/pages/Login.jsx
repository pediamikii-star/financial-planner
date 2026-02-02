import { useNavigate } from "react-router-dom";
import { useState } from "react"; // IMPORT useState!

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault(); // TAMBAH INI!
    
    // Simple validation
    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password");
      return;
    }

    console.log("Logging in with:", { email, password }); // Debug
    
    // Simpan auth ke localStorage
    localStorage.setItem("auth", "true");
    localStorage.setItem("userEmail", email);
    
    console.log("Auth set, navigating..."); // Debug
    
    // Force navigation
    navigate("/dashboard", { replace: true });
    
    // Fallback jika navigate gagal
    setTimeout(() => {
      if (window.location.pathname !== "/dashboard") {
        window.location.href = "/dashboard";
      }
    }, 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-xl w-80">
        <h1 className="text-xl font-bold text-white mb-4">
          Login
        </h1>

        <form onSubmit={handleLogin}> {/* TAMBAH FORM TAG */}
          <input
            className="w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Masuk ke Dashboard"}
          </button>
        </form>
        
        {/* DEMO CREDENTIALS */}
        <p className="text-gray-400 text-sm mt-4 text-center">
          Demo: any email/password works
        </p>
      </div>
    </div>
  );
}