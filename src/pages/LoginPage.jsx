import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: {
      email: 'admin123@gmail.com',
      password: 'admin123'
    }
  });

  const onLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (e) {
      toast.error(e.code === 'auth/invalid-credential' ? 'Invalid email or password' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    const email = getValues('email');
    if (!email) { toast.error('Enter your email first'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent!');
      setForgotMode(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 mb-4">
              <img src="/solobiticon.png" alt="Alphabyte Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">ALPHABYTE</h2>
            <p className="text-blue-200 text-xs mt-1 uppercase tracking-widest font-semibold">Quotations</p>
          </div>

          <h3 className="text-lg font-semibold text-white mb-6 text-center">
            {forgotMode ? 'Reset your password' : 'Sign in to your account'}
          </h3>

          <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                  placeholder="admin@company.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password (not shown in forgot mode) */}
            {!forgotMode && (
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}

            {/* Forgot password link */}
            {!forgotMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-sm text-blue-300 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            {!forgotMode ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-60 mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            ) : (
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onForgot}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Email'}
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-blue-300 text-xs mt-6">
            Admin access only. Contact your administrator for credentials.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
