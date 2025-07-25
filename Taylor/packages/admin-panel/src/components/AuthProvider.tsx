import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('[AuthProvider] Error getting session.', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signUp: (email, password, partnerName) => {
            return supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        partner_name: partnerName,
                    },
                },
            });
        },
        signOut: () => supabase.auth.signOut(),
        resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        }),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
