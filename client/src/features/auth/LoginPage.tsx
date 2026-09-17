import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './useAuth';
import { AuthShell } from './AuthShell';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (!isLoading && isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      error(getErrorMessage(err, 'Login failed. Please try again.'));
    }
  };

  return (
    <AuthShell title="Sign in">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          id="login-email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          id="login-password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="p-1 hover:text-gray-700"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register('password')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        New here?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
        <p className="text-xs text-gray-500 font-medium">Demo account (after running the seed)</p>
        <p className="text-xs text-gray-700 mt-0.5">demo@moi.app · demo1234</p>
      </div>
    </AuthShell>
  );
};
