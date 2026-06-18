-- Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC, anon, and authenticated.
-- These are trigger/utility functions that must not be callable via REST API
-- (/rest/v1/rpc/handle_new_user or /rest/v1/rpc/rls_auto_enable).
-- Supabase Advisor warnings resolved:
--   anon_security_definer_function_executable (handle_new_user, rls_auto_enable)
--   authenticated_security_definer_function_executable (handle_new_user, rls_auto_enable)

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
