// src/hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuth from './useAuth';
import usePortalNavigation from './useNavigation';
import type { RoleKey } from '@config/roles';

export const useAuthGuard = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const auth = useAuth();
  const roleKey = (role || 'management') as RoleKey;
  const { goToLogin, goToHome } = usePortalNavigation(slug, roleKey);

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) {
      goToLogin();
    }
  }, [auth.isAuthenticated, auth.isLoading, goToLogin]);

  const handleLogout = async () => {
    await auth.logout();
    goToHome();
  };

  return {
    slug,
    roleKey,
    role,
    hotel: auth.hotel,
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
    handleLogout,
  };
};

export default useAuthGuard;