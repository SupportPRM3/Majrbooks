-- Team members and invited clients don't own a subscription — they get access through
-- the firm owner (team_members / client linkage), not their own billing relationship.
-- handle_new_user() was unconditionally giving every new auth.users row a 14-day trial,
-- so invited staff/clients ended up with their own trial_ends_at, which made
-- checkSubscription() report is_trial=true for them and surfaced the trial banner /
-- upgrade prompts / expiry modal — UI that only makes sense for the actual account owner.
-- AcceptClientInvite.tsx already tags client signups with is_client: true; AcceptInvite.tsx
-- (team invites) now tags is_team_member: true. Skip trial activation for either.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_invited BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'is_client')::boolean, false)
                       OR COALESCE((NEW.raw_user_meta_data->>'is_team_member')::boolean, false);
BEGIN
  INSERT INTO public.profiles (id, full_name, email, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    CASE WHEN v_is_invited THEN NULL ELSE now() + interval '14 days' END
  );

  -- Default categories are only useful for accounts that manage their own books
  IF NOT v_is_invited THEN
    INSERT INTO public.categories (name, type, color, icon, user_id)
    VALUES
      ('Salary', 'income', '#10b981', 'Briefcase', NEW.id),
      ('Business', 'income', '#3b82f6', 'TrendingUp', NEW.id),
      ('Investment', 'income', '#8b5cf6', 'PiggyBank', NEW.id),
      ('Office', 'expense', '#ef4444', 'Building', NEW.id),
      ('Marketing', 'expense', '#f59e0b', 'Megaphone', NEW.id),
      ('Travel', 'expense', '#06b6d4', 'Plane', NEW.id),
      ('Utilities', 'expense', '#ec4899', 'Zap', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;
