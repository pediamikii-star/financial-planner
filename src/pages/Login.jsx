import { supabase } from '../lib/supabase.js';
import { useState } from 'react';

// GANTI export function jadi export default
export default function LoginPage() { // ← TAMBAHKAN default
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) throw error;
      
      setMessage('✅ Link login sudah dikirim ke email Anda! Cek inbox Anda.');
      setEmail('');
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🔐 Login ke Finance App</h2>
        <p>Masukkan email untuk menerima link login</p>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading || !email}>
            {loading ? 'Mengirim...' : 'Kirim Link Login'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <div className="login-info">
          <p><strong>📌 Cara kerja:</strong></p>
          <p>1. Masukkan email Anda</p>
          <p>2. Cek email untuk link login</p>
          <p>3. Klik link untuk login otomatis</p>
          <p>4. Data akan sync ke cloud</p>
        </div>
      </div>
      
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .login-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 400px;
        }
        
        .login-card h2 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .login-card p {
          color: #666;
          margin-bottom: 30px;
        }
        
        .login-card input {
          width: 100%;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 10px;
          font-size: 16px;
          margin-bottom: 20px;
          box-sizing: border-box;
        }
        
        .login-card input:focus {
          border-color: #667eea;
          outline: none;
        }
        
        .login-card button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .login-card button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .message {
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
          text-align: center;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .login-info {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          font-size: 14px;
        }
        
        .login-info p {
          margin: 5px 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}