import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ClientRouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean; // admin or user (not client)
}

/**
 * Route guard that enforces role-based access
 * - Clients with active trial or subscription get FULL access to all features
 * - Clients without active subscription are redirected to client portal
 * - Admin-only routes redirect non-admins to dashboard
 */
const ClientRouteGuard = ({ 
  children, 
  requireAdmin = false,
  requireStaff = false 
}: ClientRouteGuardProps) => {
  const { user, isClient, isAdmin, loading, isTrial, isStripeTrial, subscribed } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Require admin access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Staff-only routes (admin or user, not client) - but clients with active trial/subscription bypass this
  if (requireStaff && isClient) {
    // Allow clients with active trial or subscription to access staff routes
    const hasActiveAccess = isTrial || isStripeTrial || subscribed;
    if (!hasActiveAccess) {
      return <Navigate to="/client-portal" replace />;
    }
  }

  // Client access logic - clients with active trial/subscription get FULL access
  if (isClient) {
    const hasActiveAccess = isTrial || isStripeTrial || subscribed;
    
    // If client has active trial or subscription, allow full access to all routes
    if (hasActiveAccess) {
      return <>{children}</>;
    }
    
    // Clients without active subscription - restrict to client-specific pages
    const clientAllowedPaths = [
      '/client-portal',
      '/client-invoices', 
      '/client-settings',
      '/bank-transactions',
      '/bank-reconciliation',
    ];
    
    const isAllowedPath = clientAllowedPaths.some(path => 
      location.pathname.startsWith(path)
    );
    
    if (!isAllowedPath) {
      return <Navigate to="/client-portal" replace />;
    }
  }

  return <>{children}</>;
};

export default ClientRouteGuard;
