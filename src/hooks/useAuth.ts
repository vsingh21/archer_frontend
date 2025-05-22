import { useState, useEffect } from 'react';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

// Custom hook for authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check current auth status
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth status:', error);
          return;
        }
        
        if (session) {
          console.log('Auth session found:', { 
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          });
          
          // Always set role to admin for any authenticated user
          const userRole = 'admin';
          console.log('Setting default admin role for authenticated user');
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: userRole
          });
          setToken(session.access_token);
        } else {
          console.log('No auth session found');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          console.log('New session:', { 
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          });
          
          // Always set role to admin for any authenticated user
          const userRole = 'admin';
          console.log('Setting default admin role for authenticated user');
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: userRole
          });
          setToken(session.access_token);
        } else {
          console.log('Session ended');
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error logging in:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setToken(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    user,
    token,
    loading,
    login,
    logout,
    supabase
  };
} 