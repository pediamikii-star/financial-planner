import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Supabase akan otomatis handle token dari URL
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("✅ Login successful:", session.user.email);
        
        // Tunggu sebentar lalu redirect ke dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Auth callback error:", error);
      navigate("/login");
    }
  }

  return (
    <div className="auth-callback">
      <h2>Processing login...</h2>
      <p>Please wait while we authenticate you.</p>
      <div className="spinner"></div>
      <style jsx>{`
        .auth-callback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-top: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}