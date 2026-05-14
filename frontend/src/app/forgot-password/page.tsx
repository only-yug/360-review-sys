'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { Outfit } from 'next/font/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '@/lib/api';

const outfit = Outfit({ subsets: ['latin'] });

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const emailFormik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await apiClient.post('/auth/forgot-password', { email: values.email });
        setEmail(values.email);
        setStep('otp');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const otpFormik = useFormik({
    initialValues: { otp: '', newPassword: '', confirmPassword: '' },
    validationSchema: Yup.object({
      otp: Yup.string().required('OTP is required').length(6, 'OTP must be exactly 6 digits'),
      newPassword: Yup.string().required('New password is required').min(6, 'Must be at least 6 characters'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm your password'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await apiClient.post('/auth/reset-password', {
          email,
          otp: values.otp,
          newPassword: values.newPassword,
        });
        setStep('success');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to reset password. Please verify OTP and try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const currentOtp = otpFormik.values.otp.split('');
    while (currentOtp.length < 6) currentOtp.push('');

    if (value) {
      currentOtp[index] = value;
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    } else {
      currentOtp[index] = '';
    }

    otpFormik.setFieldValue('otp', currentOtp.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpFormik.values.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      otpFormik.setFieldValue('otp', pastedData);
      const nextIndex = pastedData.length === 6 ? 5 : pastedData.length;
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const otpArray = React.useMemo(() => {
    const arr = otpFormik.values.otp.split('');
    while (arr.length < 6) arr.push('');
    return arr;
  }, [otpFormik.values.otp]);

  if (!mounted) return null;

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 pt-20 mt-4 bg-background ${outfit.className} relative overflow-hidden transition-colors duration-500`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[440px] glass-card p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-fade-in chai-glow">
        <div className="mb-10 text-center">
          <h1 className="text-[2.25rem] font-black leading-tight mb-2 text-foreground">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'success' && 'Password Reset'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && `Enter the 6-digit OTP sent to ${email}`}
            {step === 'success' && 'Your password has been successfully updated.'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-2xl mb-6 border border-destructive/20 animate-pulse text-center">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={emailFormik.handleSubmit} className="space-y-6">
            <ValidatedInput
              label="Email Address"
              placeholder="john@company.com"
              {...emailFormik.getFieldProps('email')}
              error={emailFormik.touched.email ? emailFormik.errors.email : undefined}
              icon={<Mail size={20} />}
            />

            <button
              type="submit"
              disabled={emailFormik.isSubmitting}
              className="w-full py-4 rounded-2xl font-bold bg-primary text-primary-foreground flex justify-center items-center gap-2 text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 group"
            >
              {emailFormik.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>
                  Send OTP
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="text-center mt-6">
              <Link href="/login" className="text-sm font-bold text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={otpFormik.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">6-Digit OTP</label>
              </div>
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isError = otpFormik.touched.otp && otpFormik.errors.otp;
                  // Only show green if it's completely filled, no errors, and they clicked submit (or just filled)
                  const isSuccess = otpFormik.values.otp.length === 6 && !otpFormik.errors.otp;
                  
                  return (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpArray[index] || ''}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-xl font-black rounded-2xl transition-all outline-none focus:scale-105 border-2
                        ${isError 
                          ? 'bg-destructive/10 border-destructive/50 text-destructive focus:border-destructive focus:ring-4 focus:ring-destructive/10' 
                          : isSuccess 
                            ? 'bg-green-500/10 border-green-500/50 text-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'
                            : 'bg-white/5 border-white/10 text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 hover:bg-white/10'
                        }
                      `}
                    />
                  );
                })}
              </div>
              {otpFormik.touched.otp && otpFormik.errors.otp && (
                <p className="text-xs text-destructive font-semibold px-1 mt-1 animate-fade-in">
                  {otpFormik.errors.otp}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <ValidatedInput
                label="New Password"
                placeholder="•••••••"
                type={showPassword ? "text" : "password"}
                {...otpFormik.getFieldProps('newPassword')}
                error={otpFormik.touched.newPassword ? otpFormik.errors.newPassword : undefined}
                icon={<Lock size={20} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <ValidatedInput
                label="Confirm Password"
                placeholder="•••••••"
                type={showPassword ? "text" : "password"}
                {...otpFormik.getFieldProps('confirmPassword')}
                error={otpFormik.touched.confirmPassword ? otpFormik.errors.confirmPassword : undefined}
                icon={<Lock size={20} />}
              />
            </div>

            <button
              type="submit"
              disabled={otpFormik.isSubmitting}
              className="w-full py-4 rounded-2xl font-bold bg-primary text-primary-foreground flex justify-center items-center gap-2 text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 group"
            >
              {otpFormik.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 size={40} />
              </div>
            </div>
            <Link
              href="/login"
              className="w-full py-4 rounded-2xl font-bold bg-primary text-primary-foreground flex justify-center items-center gap-2 text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
