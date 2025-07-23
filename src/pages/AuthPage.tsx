import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { CompanySignupForm } from '@/components/auth/CompanySignupForm';
import { Card, CardContent } from '@/components/ui/card';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-elegant border-0 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <CompanySignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};