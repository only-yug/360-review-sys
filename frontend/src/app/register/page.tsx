'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Outfit } from 'next/font/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const outfit = Outfit({ subsets: ['latin'] });

// Validation Schema with Yup
const validationSchema = Yup.object({
  full_name: Yup.string()
    .min(3, 'Full name must be at least 3 characters')
    .required('Full name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await register({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
        });
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!mounted) return null;

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 pt-20 mt-5 bg-background ${outfit.className} relative overflow-hidden transition-colors duration-500`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />



      {/* Main Register Card */}
      <div className="w-full max-w-[500px] glass-card p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-fade-in chai-glow">
        <div className="mb-8 text-center">
          <h1 className="text-[2.25rem] font-black leading-tight mb-2 text-foreground ">
            Create Account
          </h1>
          <p className="text-muted-foreground text-lg">
            Join the 360 Feedback System
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-2xl mb-6 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/70 ml-1">Full Name</label>
            <div className="relative group">
              <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.full_name && formik.errors.full_name ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.full_name}
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.full_name && formik.errors.full_name
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
            </div>
            {formik.touched.full_name && formik.errors.full_name && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.full_name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/70 ml-1">Email Address</label>
            <div className="relative group">
              <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.email && formik.errors.email ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@company.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.email && formik.errors.email
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/70 ml-1">Password</label>
            <div className="relative group">
              <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.password && formik.errors.password ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="•••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.password && formik.errors.password
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/70 ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="•••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-white/5 dark:bg-black/20 text-foreground outline-none text-base transition-all focus:ring-2 placeholder:text-muted-foreground/50 ${formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive'
                  : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-destructive text-xs font-bold ml-1">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-4 mt-4 rounded-2xl font-bold bg-primary text-primary-foreground flex justify-center items-center gap-2 text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 group"
          >
            {formik.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                Register Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
