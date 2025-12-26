import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Role-based redirection
        if (result.user.role === 'admin') {
          navigate('/admin/operations');
        } else {
          navigate('/catalog');
        }

        window.location.reload();
      } else {
        setErrors({ email: result.message || 'Login failed' });
      }
    } catch (err) {
      setErrors({ email: 'Network error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          alt="Event Crowd"
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">Admin Access</p>
                  <p className="text-sm font-mono text-gray-700">admin@example.com</p>
                  <p className="text-sm font-mono text-gray-400 italic">pass: admin123</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">User Access</p>
                  <p className="text-sm font-mono text-gray-700">client@example.com</p>
                  <p className="text-sm font-mono text-gray-400 italic">pass: client123</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-accent-blue hover:text-accent">
                register for free
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={submit} className="space-y-6">
              {/* ... form fields ... */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-accent-blue focus:ring-0 sm:text-sm"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                  />
                  {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-accent-blue focus:ring-0 sm:text-sm"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                  />
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                    checked={data.remember}
                    onChange={(e) => setData({ ...data, remember: e.target.checked })}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-150 ease-in-out"
                >
                  {processing ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
