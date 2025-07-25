import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useApiKey } from '@/hooks/useApiKey';
import { ApiKeyCard } from '@/components/dashboard/ApiKeyCard';
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [nameLoading, setNameLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [partnerName, setPartnerName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { apiKey, loading: apiKeyLoading, error: apiKeyError, regenerateApiKey } = useApiKey();

    useEffect(() => {
        if (user?.user_metadata.partner_name) {
            setPartnerName(user.user_metadata.partner_name);
        }
    }, [user]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setNameLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { partner_name: partnerName }
            });

            if (error) throw error;
            
            await supabase.auth.refreshSession();

            toast({
                title: 'Success',
                description: 'Your partner name has been updated.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating name',
                description: (error as Error).message,
            });
        } finally {
            setNameLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
            });
            return;
        }
        if (!password) {
            toast({
                variant: 'destructive',
                title: 'Password cannot be empty',
            });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast({
                title: 'Success',
                description: 'Your password has been updated.',
            });
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating password',
                description: (error as Error).message,
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-500">Manage your account settings and API keys.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account and partner name.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateName} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="partnerName">Partner Name</label>
                            <Input
                                id="partnerName"
                                type="text"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={nameLoading}>
                            {nameLoading ? 'Updating...' : 'Update Name'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="newPassword">New Password</label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={passwordLoading}>
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {apiKeyLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <ApiKeyCard apiKey={apiKey} error={apiKeyError} onRegenerate={regenerateApiKey} />
                )}
            </div>
        </div>
    );
};

export default SettingsPage; 