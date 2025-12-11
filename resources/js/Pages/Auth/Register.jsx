import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/');
        // Reload to update GuestLayout or use Context (reload is simpler hack)
        window.location.reload();
      } else {
        setErrors({ email: result.error || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ email: 'Network error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image (Different for Register) */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          alt="Event Atmosphere"
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent-blue hover:text-accent">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-accent-blue focus:ring-0 sm:text-sm"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                  />
                  {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                </div>
              </div>

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
                    required
                    className="appearance-none block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-accent-blue focus:ring-0 sm:text-sm"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                  />
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-150 ease-in-out"
                >
                  {processing ? 'Creating account...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
