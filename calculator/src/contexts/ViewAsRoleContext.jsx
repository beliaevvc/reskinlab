import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const ViewAsRoleContext = createContext(null);

/**
 * Provider for "View As" role switching functionality.
 * Allows admins to preview the interface as different roles.
 */
export function ViewAsRoleProvider({ children }) {
  const { isAdmin, isAM, isClient, user } = useAuth();
  const [viewAsRole, setViewAsRole] = useState(null); // null means normal view

  // Only admin can use view-as feature
  const canUseViewAs = isAdmin;

  // Set the view-as role
  const setViewAs = useCallback((role) => {
    if (!canUseViewAs) return;
    
    // Validate role
    if (role && !['client', 'am', 'admin'].includes(role)) {
      console.warn('Invalid role:', role);
      return;
    }
    
    // If role is same as actual role, clear view-as
    if (role === 'admin' || !role) {
      setViewAsRole(null);
    } else {
      setViewAsRole(role);
    }
  }, [canUseViewAs]);

  // Clear view-as mode
  const clearViewAs = useCallback(() => {
    setViewAsRole(null);
  }, []);

  // Calculate effective role
  const effectiveRole = useMemo(() => {
    if (viewAsRole && canUseViewAs) {
      return viewAsRole;
    }
    // Return actual role
    if (isAdmin) return 'admin';
    if (isAM) return 'am';
    if (isClient) return 'client';
    return null;
  }, [viewAsRole, canUseViewAs, isAdmin, isAM, isClient]);

  // Effective permission checks (based on view-as role)
  const effectiveIsAdmin = effectiveRole === 'admin';
  const effectiveIsAM = effectiveRole === 'am';
  const effectiveIsClient = effectiveRole === 'client';
  const effectiveIsStaff = effectiveIsAdmin || effectiveIsAM;

  // Check if currently viewing as different role
  const isViewingAs = viewAsRole !== null && canUseViewAs;

  const value = useMemo(() => ({
    // View-as controls
    viewAsRole,
    setViewAs,
    clearViewAs,
    canUseViewAs,
    isViewingAs,
    
    // Effective role (considering view-as)
    effectiveRole,
    effectiveIsAdmin,
    effectiveIsAM,
    effectiveIsClient,
    effectiveIsStaff,
    
    // Real role (ignoring view-as)
    realIsAdmin: isAdmin,
    realIsAM: isAM,
    realIsClient: isClient,
    realIsStaff: isAdmin || isAM,
  }), [
    viewAsRole, setViewAs, clearViewAs, canUseViewAs, isViewingAs,
    effectiveRole, effectiveIsAdmin, effectiveIsAM, effectiveIsClient, effectiveIsStaff,
    isAdmin, isAM, isClient
  ]);

  return (
    <ViewAsRoleContext.Provider value={value}>
      {children}
    </ViewAsRoleContext.Provider>
  );
}

/**
 * Hook to access view-as role functionality
 */
export function useViewAsRole() {
  const context = useContext(ViewAsRoleContext);
  if (!context) {
    throw new Error('useViewAsRole must be used within ViewAsRoleProvider');
  }
  return context;
}

export default ViewAsRoleContext;
