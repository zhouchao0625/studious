"use client";
import { RootState } from "@/store/store";
import { trpc } from "@/lib/trpc";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RouterInputs, RouterOutputs } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { toast } from "sonner";
import { setAuth } from "@/store/appSlice";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";

export default function Login() {
  const t = useTranslations('auth.login');
  const tVerification = useTranslations('auth.verification');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [formData, setFormData] = useState<RouterInputs['auth']['login']>({
    username: '',
    password: '',
  });

  const [resendEmailFormData, setResendEmailFormData] = useState<RouterInputs['auth']['resendVerificationEmail']>({
    email: '',
  });
  const dispatch = useDispatch();

  const [userNotVerified, setUserNotVerified] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: RouterOutputs['auth']['login']) => {
      if ('token' in data) {
        toast.success(t('successMessage'));
        // set the session cookie
        setCookie('token', data.token);
        dispatch(setAuth({
          loggedIn: true,
          username: data.user.username,
          id: data.user.id,
        }));
        router.push('/classes/');
      } else {
        // user not verified
        setUserNotVerified(true);
        setResendEmailFormData({ email: data.user.email });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const resendVerificationMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setResendSuccess(true);
      toast.success(tVerification('emailSent'));
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const appState = useSelector((state: RootState) => state.app);

  useEffect(() => {
    if (appState.user.loggedIn) {
      redirect('/classes/');
    }
  }, [appState.user.loggedIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleResendEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResendEmailFormData({ email: e.target.value });
  };

  const handleResendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    resendVerificationMutation.mutate(resendEmailFormData);
  };

  const handleBackToLogin = () => {
    setUserNotVerified(false);
    setShowResendForm(false);
    setResendSuccess(false);
    setResendEmailFormData({ email: '' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background-subtle px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img src="/logo.png" alt="Studious" className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-sm sm:text-base text-foreground-muted">{t('subtitle')}</p>
        </div>

        {userNotVerified && (
          <Card className="p-6 sm:p-8 mb-6">
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Warning Icon */}
              <div className="flex justify-center">
                <div className="p-3 sm:p-4 bg-yellow-100 rounded-full">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">{tVerification('notVerified')}</h2>
                <p className="text-sm sm:text-base text-foreground-muted">
                  {tVerification('message')}
                </p>
              </div>

              {/* Email Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-foreground-muted mb-1">{tVerification('emailSentTo')}</p>
                <p className="font-medium text-foreground">{resendEmailFormData.email}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!resendSuccess ? (
                  <>
                    <Button
                      onClick={() => setShowResendForm(true)}
                      className="w-full font-medium"
                    >
                      {tVerification('resendEmail')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBackToLogin}
                      className="w-full font-medium"
                    >
                      {tVerification('backToSignIn')}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-700 font-medium">{tVerification('emailSent')}</p>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        {tVerification('checkInbox')}
                      </p>
                    </div>
                    <Button
                      onClick={handleBackToLogin}
                      className="w-full font-medium"
                    >
                      {tVerification('backToSignIn')}
                    </Button>
                  </>
                )}
              </div>

              {/* Resend Form */}
              {showResendForm && !resendSuccess && (
                <div className="border-t border-gray-200 pt-6">
                  <form onSubmit={handleResendVerification} className="space-y-4">
                    <Input
                      value={resendEmailFormData.email}
                      onChange={handleResendEmailChange}
                      placeholder={tVerification('enterEmail')}
                      required
                    />
                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        className="flex-1 font-medium"
                        disabled={resendVerificationMutation.isPending}
                      >
                        {resendVerificationMutation.isPending ? tVerification('sending') : tVerification('sendEmail')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowResendForm(false)}
                        className="flex-1 font-medium"
                      >
                        {tCommon('cancel')}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </Card>
        )}

        {!userNotVerified && (
          <>
            {/* Login Form */}
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('username')}</label>
                  <Input
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    placeholder={t('username')}
                  />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                  <label className="text-sm font-medium">{t('password')}</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder={t('password')}
                  />
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between w-full">
                  <Checkbox
                    checked={true}
                    onChange={() => {}}
                  />
                  <Link href="/forgot-password" className="text-sm text-primary-500 hover:underline">
                    {t('forgotPassword')}
                  </Link>
              </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t('signingIn') : t('signIn')}
              </Button>
            </form>
        </Card>

            {/* Signup Link */}
            <div className="text-center mt-6">
              <p className="text-sm sm:text-base text-foreground-muted">
                {t('noAccount')}{' '}
                <Link href="/signup" className="text-primary-500 hover:underline font-medium">
                  {t('signUp')}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
