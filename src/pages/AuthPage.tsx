import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoStepSignupForm } from '@/components/auth/TwoStepSignupForm';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyByDomain } from '@/hooks/useCompanyByDomain';
import { useLoginPageTheme } from '@/hooks/useLoginPageTheme';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { data: company } = useCompanyByDomain();
  
  // Apply company theme
  useLoginPageTheme();

  // If we have a company with login banner, show the banner layout
  if (company?.login_banner_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex">
        {/* Left Banner */}
        <div className="hidden lg:flex lg:w-full lg:max-w-[500px] relative">
          <div className="w-full h-screen overflow-hidden">
            <img
              src={company.login_banner_url}
              alt="Banner da empresa"
              className="w-full h-full object-cover"
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
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-elegant border-0 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-8">
                {isLogin ? (
                  <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
                ) : (
                  <TwoStepSignupForm onSwitchToLogin={() => setIsLogin(true)} />
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
            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <TwoStepSignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};