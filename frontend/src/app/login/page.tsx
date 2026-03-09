'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Outfit } from 'next/font/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const outfit = Outfit({ subsets: ['latin'] });

// Validation Schema with Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const user = await login(values.email, values.password);
        if (user) {
          const role = (user.role || '').toLowerCase();
          if (role === 'admin') router.push('/dashboard/admin');
          else if (role === 'manager') router.push('/dashboard/manager');
          else router.push('/dashboard/employee');
        } else {
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!mounted) return null;

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 pt-20 mt-4 bg-background ${outfit.className} relative overflow-hidden transition-colors duration-500`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />



      {/* Main Login Card */}
      <div className="w-full max-w-[440px] glass-card p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-fade-in chai-glow">
        <div className="mb-10 text-center">
          <h1 className="text-[2.25rem] font-black leading-tight mb-2 text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in to your 360 Feedback account
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-2xl mb-6 border border-destructive/20 animate-pulse text-center">
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/70 ml-1">Email Address</label>
            <div className="relative group">
              <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.email && formik.errors.email ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@company.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.email && formik.errors.email
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-foreground/70">Password</label>
              <Link href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative group">
              <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.password && formik.errors.password ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="•••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={`w-full pl-12 pr-12 py-4 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.password && formik.errors.password
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-4 rounded-2xl font-bold bg-primary text-primary-foreground flex justify-center items-center gap-2 text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 group"
          >
            {formik.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
