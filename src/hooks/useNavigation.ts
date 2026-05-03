// src/hooks/useNavigation.ts
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import type { RoleKey } from '@config/roles';

/**
 * Centralized portal navigation.
 * Single source of truth for all role-based routes.
 */
export const usePortalNavigation = (
  slug: string | undefined,
  roleKey: RoleKey,
) => {
  const navigate = useNavigate();

  const portalRoutes: Record<string, string> = {
    // Common
    dashboard:    `/portal/${slug}/${roleKey}/dashboard`,
    staff:        `/portal/${slug}/${roleKey}/staff`,
    rooms:        `/portal/${slug}/${roleKey}/rooms`,
    qrcodes:      `/portal/${slug}/${roleKey}/qr-codes`,
    qrrooms:      `/portal/${slug}/${roleKey}/qr-rooms`,
    services:     `/portal/${slug}/${roleKey}/services`,
    settings:     `/portal/${slug}/${roleKey}/settings`,

    // Frontdesk
    reservations: `/portal/${slug}/${roleKey}/reservations`,
    checkin:      `/portal/${slug}/${roleKey}/checkin`,
    checkout:     `/portal/${slug}/${roleKey}/checkout`,
    billing:      `/portal/${slug}/${roleKey}/billing`,

    // Management
    reports:      `/portal/${slug}/${roleKey}/reports`,

    // Housekeeping
    tasks:        `/portal/${slug}/${roleKey}/tasks`,
    cleaning:     `/portal/${slug}/${roleKey}/cleaning`,
  };

  const goTo = useCallback(
    (key: string) => {
      const path = portalRoutes[key];
      if (path) navigate(path);
    },
    [slug, roleKey, navigate],
  );

  const goToDashboard = useCallback(() => goTo('dashboard'), [goTo]);
  const goToStaff = useCallback(() => goTo('staff'), [goTo]);
  const goToRooms = useCallback(() => goTo('rooms'), [goTo]);
  const goToLogin = useCallback(() => {
    navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
  }, [slug, roleKey, navigate]);
  const goToHome = useCallback(() => {
    navigate(`/portal/${slug}`, { replace: true });
  }, [slug, navigate]);

  return {
    goTo,
    goToDashboard,
    goToStaff,
    goToRooms,
    goToLogin,
    goToHome,
    routes: portalRoutes,
  };
};

export default usePortalNavigation;