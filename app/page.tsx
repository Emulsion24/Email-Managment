'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid Admin Credentials');
      }
    } catch (err) {
      setError('System Error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-2xl rounded-2xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-extrabold mb-2 text-center text-slate-800">Rezillion Admin</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">Manage your users and installers</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email Address" required
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:bg-slate-400"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}