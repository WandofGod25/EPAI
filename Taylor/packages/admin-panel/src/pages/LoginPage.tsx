import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent } from "@/components/ui/card"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      const { error } = await login(email, password);
      
      if (error) {
        console.error('Login error:', error);
        setLoginError(error.message);
      } else {
        console.log('Login successful, redirecting...');
        setSuccess('Login successful! Redirecting...');
        // Small delay to show success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      setLoginError((error as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setLoginError("Please enter your email address above to reset your password.");
      return;
    }
    
    setLoginError(null);
    setSuccess(null);
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setLoginError(error.message);
      } else {
        setSuccess("If an account with that email exists, a password reset link has been sent.");
      }
    } catch {
      setLoginError("Failed to send password reset email. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-md bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Partner Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  type="email" 
                  id="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                  type="password" 
                  id="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                />
              </div>
            </div>
            
            {loginError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {loginError}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                {success}
              </div>
            )}
            
            <div className="mt-4 text-center text-sm">
              <p>
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2">
                <button 
                  type="button" 
                  onClick={handlePasswordReset} 
                  className="underline text-sm hover:text-primary"
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 