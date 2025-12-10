import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    return () => {
      reset('password', 'password_confirmation');
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post(route('register.post'));
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Head title="Register" />

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
              <Link href="/login" className="font-medium text-accent-blue hover:text-accent">
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
                    onChange={(e) => setData('name', e.target.value)}
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
                    onChange={(e) => setData('email', e.target.value)}
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
                    onChange={(e) => setData('password', e.target.value)}
                  />
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="password_confirmation"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:border-accent-blue focus:ring-0 sm:text-sm"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-150 ease-in-out"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
