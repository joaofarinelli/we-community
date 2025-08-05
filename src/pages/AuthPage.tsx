import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoStepSignupForm } from '@/components/auth/TwoStepSignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyByDomain } from '@/hooks/useCompanyByDomain';
import { useLoginPageTheme } from '@/hooks/useLoginPageTheme';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const AuthPage = () => {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const { data: company } = useCompanyByDomain();
  
  // Initialize Supabase context for multi-company users
  useSupabaseContext();
  
  // Apply company theme
  useLoginPageTheme();

  // If we have a company with login banner, show the banner layout
  if (company?.login_banner_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex">
        {/* Left Banner */}
        <div 
          className="hidden md:flex md:min-w-[500px] md:max-w-[500px] lg:max-w-[600px] relative self-stretch"
          style={{
            background: `url(${company.login_banner_url}) center center / cover no-repeat`,
            minHeight: '60px',
            height: 'auto',
            alignSelf: 'stretch',
            flexGrow: 0
          }}
        >
          {/* Gradient overlay for better branding integration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 z-10" />
        </div>

        {/* Right Content */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-screen overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <Card className="shadow-elegant border-0 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
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