import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the App.tsx file
const appFilePath = path.join(__dirname, 'packages/admin-panel/src/App.tsx');

// Read the current App.tsx content
console.log(`Reading App.tsx from: ${appFilePath}`);
const currentContent = fs.readFileSync(appFilePath, 'utf8');

// Check if the file needs to be fixed
if (currentContent.includes('loading ? <div className="flex items-center justify-center h-screen">')) {
  console.log('App.tsx appears to have correct loading state handling.');
} else {
  console.log('App.tsx needs to be fixed to handle loading state properly.');
  
  // Create the fixed content
  const fixedContent = `import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthProvider from '@/components/AuthProvider';
import { LoginPage } from '@/pages/LoginPage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LogsPage from '@/pages/LogsPage';
import OverviewPage from '@/pages/OverviewPage';
import ModelsPage from '@/pages/ModelsPage';
import SettingsPage from '@/pages/SettingsPage';
import InsightsPage from '@/pages/InsightsPage';
import IntegrationPage from '@/pages/IntegrationPage';
import SDKShowroomPage from '@/pages/SDKShowroomPage';
import TestImport from './test-import';
import '@/App.css';

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-pulse">
                    <p className="text-lg font-medium">Loading application...</p>
                    <div className="mt-4 h-2 w-32 bg-gray-300 rounded mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/overview" /> : <LoginPage />} />
            <Route 
                path="/" 
                element={user ? <DashboardLayout /> : <Navigate to="/login" />}
            >
                <Route index element={<Navigate to="overview" />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="models" element={<ModelsPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="integration" element={<IntegrationPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="sdk-showroom" element={<SDKShowroomPage />} />
                <Route path="test-import" element={<TestImport />} />
            </Route>
            <Route 
                path="*"
                element={<Navigate to={user ? "/overview" : "/login"} />}
            />
        </Routes>
    );
};

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App;
`;

  // Create a backup of the original file
  const backupPath = `${appFilePath}.backup`;
  fs.writeFileSync(backupPath, currentContent, 'utf8');
  console.log(`Created backup of original App.tsx at: ${backupPath}`);
  
  // Write the fixed content to the file
  fs.writeFileSync(appFilePath, fixedContent, 'utf8');
  console.log('Successfully updated App.tsx with improved loading state handling and navigation logic.');
}

// Now let's check if the login page needs fixing
const loginPagePath = path.join(__dirname, 'packages/admin-panel/src/pages/LoginPage.tsx');
console.log(`Reading LoginPage.tsx from: ${loginPagePath}`);
const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');

// Check if the login page needs to be fixed
if (loginPageContent.includes('const { login, resetPassword } = useAuth();')) {
  console.log('LoginPage.tsx appears to have correct auth hook usage.');
} else {
  console.log('LoginPage.tsx needs to be fixed to use the auth hook properly.');
  
  // Create the fixed content for the login page
  const fixedLoginPageContent = `import { useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) throw error;
      navigate('/overview');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    await resetPassword(email);
    setError("If an account with that email exists, a password reset link has been sent.");
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
                <Input type="email" id="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input type="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="mt-4 text-center text-sm">
              <p>
                Don't have an account?{" "}
                <Link to="/signup" className="underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2">
                <button type="button" onClick={handlePasswordReset} className="underline text-sm hover:text-primary">
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
}`;

  // Create a backup of the original login page
  const loginPageBackupPath = `${loginPagePath}.backup`;
  fs.writeFileSync(loginPageBackupPath, loginPageContent, 'utf8');
  console.log(`Created backup of original LoginPage.tsx at: ${loginPageBackupPath}`);
  
  // Write the fixed content to the login page file
  fs.writeFileSync(loginPagePath, fixedLoginPageContent, 'utf8');
  console.log('Successfully updated LoginPage.tsx with improved auth hook usage.');
}

console.log('Component fix script completed!'); 