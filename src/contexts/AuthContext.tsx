import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchPerfilRol,
  getCurrentSession,
  logout,
  subscribeToAuthChanges,
} from '../services';
import type { Rol, User } from '../services';

interface AuthContextType {
  user: User | null;
  profile: { rol: Rol } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ rol: Rol } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión actual
    getCurrentSession().then(({ session }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Escuchar cambios en la sesión
    const subscription = subscribeToAuthChanges((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await fetchPerfilRol(userId);

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
