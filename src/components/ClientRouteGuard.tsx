import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface Props {
  requireClient?: boolean; // only clients — non-clients → /dashboard
  requireStaff?: boolean;  // user or admin only — clients → /client-portal
  requireAdmin?: boolean;  // admins only — everyone else → /dashboard
}

/**
 * Layout-route guard. Wrap route groups in App.tsx:
 *
 *   <Route element={<ClientRouteGuard requireClient />}>
 *     <Route path="/client-portal" element={<ClientPortal />} />
 *   </Route>
 *
 *   <Route element={<ClientRouteGuard requireStaff />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ClientRouteGuard requireAdmin />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 */
const ClientRouteGuard = ({
  requireClient = false,
  requireStaff = false,
  requireAdmin = false,
}: Props) => {
  const { user, isAdmin, isClient, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in → auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin-only route accessed by non-admin → dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Staff-only route accessed by a client → client portal
  if (requireStaff && isClient) {
    return <Navigate to="/client-portal" replace />;
  }

  // Client-only route accessed by staff/admin → dashboard
  if (requireClient && !isClient) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ClientRouteGuard;
