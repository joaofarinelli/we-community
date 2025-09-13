import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetUrl: string
  email: string
}

export const PasswordResetEmail = ({
  resetUrl,
  email,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinir sua senha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Redefinir Senha</Heading>
        
        <Text style={text}>
          Olá,
        </Text>
        
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta ({email}).
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Redefinir Senha
          </Button>
        </Section>
        
        <Text style={text}>
          Este link é válido por 1 hora. Se você não solicitou a redefinição de senha, 
          pode ignorar este email com segurança.
        </Text>
        
        <Text style={text}>
          Se o botão não funcionar, copie e cole este link no seu navegador:
        </Text>
        
        <Text style={link}>
          {resetUrl}
        </Text>
        
        <Text style={footer}>
          Atenciosamente,<br />
          Equipe de Suporte
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
}

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  marginBottom: '24px',
}