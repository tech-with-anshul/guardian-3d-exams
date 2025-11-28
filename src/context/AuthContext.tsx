import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

// Define user types
export type UserRole = "faculty" | "student" | "admin" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  erpId?: string;
  department?: string;
  course?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role from database
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id)
        .single();

      const userData: User = {
        id: supabaseUser.id,
        name: profile?.full_name || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        role: (roleData?.role as UserRole) || null,
      };

      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set basic user data even if profile fetch fails
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        role: null,
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user);
          }, 0);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserData(data.user);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "This email is already registered. Please login instead." };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Assign role to the user
        if (role) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: role,
            });

          if (roleError) {
            console.error("Error assigning role:", roleError);
          }
        }

        return { success: true };
      }

      return { success: false, error: "Signup failed" };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user && !!session, 
      isLoading,
      login, 
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
