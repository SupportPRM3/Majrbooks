import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves which account's data a signed-in user should see: their own,
 * or — if they're an accepted team member — the firm owner's. Never the
 * whole platform, regardless of app_user_roles.role.
 */
export const getScopeOwnerId = async (userId: string) => {
  const { data } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.owner_id || userId;
};
