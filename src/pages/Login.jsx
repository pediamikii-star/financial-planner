import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  function handleLogin() {
    localStorage.setItem("auth", "true");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-xl w-80">
        <h1 className="text-xl font-bold text-white mb-4">
          Login
        </h1>

        <input
          className="w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white"
          placeholder="Email"
        />

        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white"
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 py-2 rounded font-semibold"
        >
          Masuk ke Dashboard
        </button>
      </div>
    </div>
  );
}
