import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoStepSignupForm } from '@/components/auth/TwoStepSignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyByDomain } from '@/hooks/useCompanyByDomain';
import { useLoginPageTheme } from '@/hooks/useLoginPageTheme';

export const AuthPage = () => {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const { data: company } = useCompanyByDomain();
  
  // Apply company theme
  useLoginPageTheme();

  // If we have a company with login banner, show the banner layout
  if (company?.login_banner_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex">
        {/* Left Banner */}
        <div className="hidden md:flex md:w-full md:max-w-[400px] lg:max-w-[500px] relative">
          <div className="w-full min-h-screen max-h-screen overflow-hidden">
            <img
              src={company.login_banner_url}
              alt="Banner da empresa"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // Hide banner if image fails to load
                const parent = e.currentTarget.parentElement?.parentElement;
                if (parent) {
                  parent.style.display = 'none';
                }
              }}
            />
            {/* Gradient overlay for better branding integration */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20" />
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-screen">
          <div className="w-full max-w-md">
            <Card className="shadow-elegant border-0 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-8">
                {authView === 'login' ? (
                  <LoginForm 
                    onSwitchToSignup={() => setAuthView('signup')} 
                    onSwitchToForgotPassword={() => setAuthView('forgot')}
                  />
                ) : authView === 'signup' ? (
                  <TwoStepSignupForm onSwitchToLogin={() => setAuthView('login')} />
                ) : (
                  <ForgotPasswordForm onBackToLogin={() => setAuthView('login')} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default layout without banner
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-elegant border-0 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {authView === 'login' ? (
              <LoginForm 
                onSwitchToSignup={() => setAuthView('signup')} 
                onSwitchToForgotPassword={() => setAuthView('forgot')}
              />
            ) : authView === 'signup' ? (
              <TwoStepSignupForm onSwitchToLogin={() => setAuthView('login')} />
            ) : (
              <ForgotPasswordForm onBackToLogin={() => setAuthView('login')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};