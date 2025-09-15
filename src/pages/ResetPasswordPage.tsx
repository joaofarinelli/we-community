import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Mail } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação deve ter pelo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const resendEmailSchema = z.object({
  email: z.string().email('Digite um email válido'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ResendEmailFormData = z.infer<typeof resendEmailSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    error?: string;
    error_code?: string;
    error_description?: string;
  } | null>(null);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const {
    register: registerResend,
    handleSubmit: handleSubmitResend,
    formState: { errors: resendErrors },
  } = useForm<ResendEmailFormData>({
    resolver: zodResolver(resendEmailSchema),
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Verificar se há uma sessão de recuperação de senha ativa
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setIsValidToken(false);
        } else if (session) {
          setIsValidToken(true);
        } else {
          // Tentar extrair tokens da URL (query params ou fragments)
          let accessToken = searchParams.get('access_token');
          let refreshToken = searchParams.get('refresh_token');
          let type = searchParams.get('type');
          
          // Se não estiver nos query params, verificar nos fragments da URL (após #)
          if (!accessToken || !refreshToken) {
            const fragment = window.location.hash.substring(1);
            const fragmentParams = new URLSearchParams(fragment);
            accessToken = fragmentParams.get('access_token');
            refreshToken = fragmentParams.get('refresh_token');
            type = fragmentParams.get('type') || 'recovery';
            
            // Verificar se há erros nos fragmentos
            const errorParam = fragmentParams.get('error');
            const errorCode = fragmentParams.get('error_code');
            const errorDescription = fragmentParams.get('error_description');
            
            if (errorParam) {
              setErrorInfo({
                error: errorParam,
                error_code: errorCode || undefined,
                error_description: errorDescription || undefined,
              });
            }
          }
          
          if (accessToken && refreshToken) {
            // Configurar a sessão com os tokens
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              setIsValidToken(false);
            } else {
              setIsValidToken(true);
              
              // Limpar a URL após configurar a sessão
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            setIsValidToken(false);
          }
        }
      } catch (error) {
        console.error('Error during token validation:', error);
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setResetSuccess(true);
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi redefinida com sucesso.',
        variant: 'default',
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message || 'Ocorreu um erro ao redefinir sua senha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  const onResendSubmit = async (data: ResendEmailFormData) => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResendSuccess(true);
      toast({
        title: 'Email enviado!',
        description: 'Um novo link de redefinição foi enviado para seu email.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Ocorreu um erro ao enviar o email. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const getErrorMessage = () => {
    if (!errorInfo) return 'O link de redefinição de senha é inválido ou expirou.';
    
    if (errorInfo.error_code === 'otp_expired') {
      return 'O link de redefinição de senha expirou. Solicite um novo link.';
    }
    
    if (errorInfo.error === 'access_denied') {
      return 'Acesso negado. O link pode ter expirado ou ser inválido.';
    }
    
    if (errorInfo.error_description) {
      const description = decodeURIComponent(errorInfo.error_description);
      if (description.includes('expired')) {
        return 'O link de redefinição de senha expirou. Solicite um novo link.';
      }
      if (description.includes('invalid')) {
        return 'O link de redefinição de senha é inválido. Solicite um novo link.';
      }
      return description;
    }
    
    return 'O link de redefinição de senha é inválido ou expirou.';
  };

  const shouldShowResendOption = () => {
    return errorInfo && (
      errorInfo.error_code === 'otp_expired' ||
      errorInfo.error === 'access_denied' ||
      (errorInfo.error_description && (
        errorInfo.error_description.includes('expired') ||
        errorInfo.error_description.includes('invalid')
      ))
    );
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Verificando link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    if (resendSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-500">Email Enviado!</CardTitle>
              <CardDescription>
                Um novo link de redefinição foi enviado para seu email. Verifique sua caixa de entrada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleBackToLogin} className="w-full">
                Voltar ao Login
              </Button>
              <Button
                onClick={() => setResendSuccess(false)}
                variant="outline"
                className="w-full"
              >
                Enviar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (showResendForm) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Solicitar Novo Link</CardTitle>
              <CardDescription>
                Digite seu email para receber um novo link de redefinição de senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitResend(onResendSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Email</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Digite seu email"
                    {...registerResend('email')}
                    disabled={resendLoading}
                  />
                  {resendErrors.email && (
                    <p className="text-sm text-destructive">{resendErrors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={resendLoading}>
                    {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Novo Link
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResendForm(false)}
                    className="w-full"
                    disabled={resendLoading}
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              {errorInfo?.error_code === 'otp_expired' ? 'Link Expirado' : 'Link Inválido'}
            </CardTitle>
            <CardDescription>
              {getErrorMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shouldShowResendOption() && (
              <Button onClick={() => setShowResendForm(true)} className="w-full">
                Solicitar Novo Link
              </Button>
            )}
            <Button 
              onClick={handleBackToLogin} 
              variant={shouldShowResendOption() ? "outline" : "default"}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-500">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToLogin} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  {...register('password')}
                  className="pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme sua nova senha"
                  {...register('confirmPassword')}
                  className="pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Senha
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleBackToLogin}
                className="w-full"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}