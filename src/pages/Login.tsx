import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dia-auth-page flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="dia-auth-card flex w-full max-w-5xl flex-col md:flex-row">
        <div className="dia-auth-aside flex w-full flex-col justify-center gap-5 p-7 text-white sm:p-10 md:w-1/2">
          <p className="dia-auth-kicker">DiaFit / Daily care coordination</p>
          <h1 className="mb-0 text-4xl font-semibold">Welcome back.</h1>
          <p className="mb-1 max-w-md text-lg text-white/75">One clear view for the people supporting everyday care.</p>
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80"
            alt="Health Monitoring"
            className="dia-auth-image"
          />
        </div>

        <div className="dia-auth-form w-full p-7 sm:p-10 md:w-1/2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="h-8 w-8 text-emerald-800" />
              <h2 className="text-2xl font-bold">Login to DiaFit</h2>
            </div>

            <p className="dia-medical-note rounded-md p-3 text-sm">
              DiaFit is not a medical device. It does not diagnose conditions or prescribe treatment. Consult a qualified clinician for medical decisions.
            </p>

            {(loginError || error) && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {loginError || error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full shadow-sm focus:border-emerald-700 focus:ring focus:ring-emerald-100"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 block w-full shadow-sm focus:border-emerald-700 focus:ring focus:ring-emerald-100"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label className="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>
              <Link to="/forgot-password" className="text-sm font-medium text-emerald-800 hover:text-emerald-950">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="dia-primary-button flex w-full items-center justify-center gap-2 px-4 py-3"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-emerald-800 hover:text-emerald-950">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;