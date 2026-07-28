import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ChooseUsernameScreen } from '@/components/login/choose-username-screen';
import { ProfileSuccessScreen } from '@/components/login/profile-success-screen';
import { ForgotOtpScreen } from '@/components/login/forgot-otp-screen';
import { ForgotPasswordScreen } from '@/components/login/forgot-password-screen';
import { ForgotPhoneScreen } from '@/components/login/forgot-phone-screen';
import { ForgotSuccessScreen } from '@/components/login/forgot-success-screen';
import { OTP_LENGTH, RESEND_TIMER } from '@/components/login/login-styles';
import { SignupPhoneScreen } from '@/components/login/signup-phone-screen';
import { VerifyOtpScreen } from '@/components/login/verify-otp-screen';
import { WelcomeBackScreen } from '@/components/login/welcome-back-screen';
import { ApiError, useAuth } from '@/context/auth-context';

type Screen =
  | 'login'
  | 'phone'
  | 'otp'
  | 'profile'
  | 'profileSuccess'
  | 'forgotPhone'
  | 'forgotOtp'
  | 'forgotPassword'
  | 'forgotSuccess';

export default function LoginScreen() {
  const { user, login, requestOtp, verifyOtp, completeProfile } = useAuth();

  const [screen, setScreen] = useState<Screen>(user ? 'profile' : 'login');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  function handlePhoneChange(text: string) {
    let digits = text.replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    setPhone(digits.slice(0, 10));
  }
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  useEffect(() => {
    if (screen === 'otp' && otpCode.length === OTP_LENGTH && !submitting) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, screen]);

  const formatTimer = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  async function handleLogin() {
    const rawPhone = phone.trim().replace(/\s/g, '');
    if (rawPhone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(`+91${rawPhone}`, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  function goToSignUp() {
    setError(null);
    setScreen('phone');
  }

  async function handleSendOtp() {
    const rawPhone = phone.trim().replace(/\s/g, '');
    if (rawPhone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestOtp(`+91${rawPhone}`);
      setScreen('otp');
      setResendTimer(RESEND_TIMER);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length < OTP_LENGTH) {
      setError('Enter the complete 6-digit code');
      return;
    }
    const fullPhone = `+91${phone.trim().replace(/\s/g, '')}`;
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(fullPhone, otpCode);
      setScreen('profile');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0) return;
    setSubmitting(true);
    try {
      await requestOtp(`+91${phone.trim().replace(/\s/g, '')}`);
      setResendTimer(RESEND_TIMER);
      setOtpCode('');
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChooseUsername(details: {
    fullName: string;
    email?: string;
    state?: string;
    dateOfBirth?: string;
    password: string;
  }) {
    const finalName = details.fullName.trim();
    if (!finalName) {
      setError('Enter your full name');
      return;
    }
    if (details.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeProfile({
        name: finalName,
        email: details.email,
        state: details.state,
        dateOfBirth: details.dateOfBirth,
        password: details.password,
      });
      router.replace('/profile-success');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  function goBackToPhone() {
    setError(null);
    setOtpCode('');
    setScreen('phone');
  }

  function goToForgotPassword() {
    setError(null);
    setResetOtpCode('');
    setResetPassword('');
    setResetConfirmPassword('');
    setScreen('forgotPhone');
  }

  function handleSendResetCode() {
    const rawPhone = phone.trim().replace(/\s/g, '');
    if (rawPhone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setScreen('forgotOtp');
  }

  function handleVerifyResetCode() {
    if (resetOtpCode.length < OTP_LENGTH) {
      setError('Enter the complete 6-digit code');
      return;
    }
    setError(null);
    setScreen('forgotPassword');
  }

  function handleResetPassword() {
    if (resetPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setScreen('forgotSuccess');
  }

  function goBackToLogin() {
    setError(null);
    setPassword('');
    setScreen('login');
  }

  if (screen === 'login') {
    return (
      <WelcomeBackScreen
        phone={phone}
        onPhoneChange={handlePhoneChange}
        password={password}
        onPasswordChange={setPassword}
        showPassword={showPassword}
        onToggleShowPassword={() => setShowPassword((v) => !v)}
        error={error}
        submitting={submitting}
        onLogin={handleLogin}
        onForgotPassword={goToForgotPassword}
        onGoToSignUp={goToSignUp}
      />
    );
  }

  if (screen === 'phone') {
    return (
      <SignupPhoneScreen
        phone={phone}
        onPhoneChange={handlePhoneChange}
        error={error}
        submitting={submitting}
        onContinue={handleSendOtp}
        onGoToLogin={goBackToLogin}
      />
    );
  }

  if (screen === 'otp') {
    return (
      <VerifyOtpScreen
        phone={phone}
        otpCode={otpCode}
        onOtpChange={setOtpCode}
        resendTimer={resendTimer}
        formatTimer={formatTimer}
        error={error}
        submitting={submitting}
        onBack={goBackToPhone}
        onResend={handleResendOtp}
        onVerify={handleVerifyOtp}
      />
    );
  }

  if (screen === 'profile') {
    return (
      <ChooseUsernameScreen
        username={username}
        onUsernameChange={setUsername}
        error={error}
        submitting={submitting}
        onSubmit={handleChooseUsername}
      />
    );
  }

  if (screen === 'profileSuccess') {
    return <ProfileSuccessScreen onContinue={() => router.replace('/')} />;
  }

  if (screen === 'forgotPhone') {
    return (
      <ForgotPhoneScreen
        phone={phone}
        onPhoneChange={handlePhoneChange}
        error={error}
        onBack={goBackToLogin}
        onSendCode={handleSendResetCode}
      />
    );
  }

  if (screen === 'forgotOtp') {
    return (
      <ForgotOtpScreen
        phone={phone}
        resetOtpCode={resetOtpCode}
        onOtpChange={setResetOtpCode}
        error={error}
        onBack={() => { setError(null); setScreen('forgotPhone'); }}
        onResend={() => setResetOtpCode('')}
        onVerify={handleVerifyResetCode}
      />
    );
  }

  if (screen === 'forgotPassword') {
    return (
      <ForgotPasswordScreen
        resetPassword={resetPassword}
        onResetPasswordChange={setResetPassword}
        showResetPassword={showResetPassword}
        onToggleShowResetPassword={() => setShowResetPassword((v) => !v)}
        resetConfirmPassword={resetConfirmPassword}
        onResetConfirmPasswordChange={setResetConfirmPassword}
        showResetConfirmPassword={showResetConfirmPassword}
        onToggleShowResetConfirmPassword={() => setShowResetConfirmPassword((v) => !v)}
        error={error}
        onSubmit={handleResetPassword}
      />
    );
  }

  return <ForgotSuccessScreen onBackToLogin={goBackToLogin} />;
}
