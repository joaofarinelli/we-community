-- Function to handle post deletion with coin reversal
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove coins for the deleted post
  PERFORM public.remove_user_coins(OLD.author_id, OLD.company_id, 'create_post', OLD.id);
  RETURN OLD;
END;
$function$