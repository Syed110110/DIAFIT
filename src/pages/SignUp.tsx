import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calculator, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { register, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    height: '',
    weight: '',
  });
  const [bmi, setBmi] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const calculateBMI = () => {
    const heightInMeters = parseFloat(formData.height) / 100;
    const weight = parseFloat(formData.weight);
    const calculatedBMI = weight / (heightInMeters * heightInMeters);
    setBmi(parseFloat(calculatedBMI.toFixed(1)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupError(null);
    
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dia-auth-page flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="dia-auth-card flex w-full max-w-5xl flex-col md:flex-row">
        <div className="dia-auth-aside flex w-full flex-col justify-center gap-5 p-7 text-white sm:p-10 md:w-1/2">
          <p className="dia-auth-kicker">DiaFit / Daily care coordination</p>
          <h1 className="mb-0 text-4xl font-semibold">A little more connected.</h1>
          <p className="mb-1 max-w-md text-lg text-white/75">A shared, accountable record for the people who help with everyday care.</p>
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"
            alt="Health Monitoring"
            className="dia-auth-image"
          />
        </div>

        <div className="dia-auth-form w-full p-7 sm:p-10 md:w-1/2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
            
            {(signupError || error) && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {signupError || error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full shadow-sm focus:border-emerald-700 focus:ring focus:ring-emerald-100"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

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

            <div className="mt-6 rounded-lg border border-[var(--dia-line)] bg-[#f7f9f5] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-semibold">BMI Calculator</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full shadow-sm focus:border-emerald-700 focus:ring focus:ring-emerald-100"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full shadow-sm focus:border-emerald-700 focus:ring focus:ring-emerald-100"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={calculateBMI}
                className="dia-primary-button mt-4 w-full px-4 py-2"
              >
                Calculate BMI
              </button>
              
              {bmi && (
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">Your BMI: {bmi}</p>
                  <p className="text-sm text-gray-600">
                    {bmi < 18.5 ? 'Underweight' :
                     bmi < 25 ? 'Normal weight' :
                     bmi < 30 ? 'Overweight' : 'Obese'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="dia-primary-button mt-6 flex w-full items-center justify-center gap-2 px-4 py-3"
            >
              {isLoading ? 'Creating Account...' : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-800 hover:text-emerald-950">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;