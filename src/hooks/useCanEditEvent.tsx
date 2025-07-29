import { useAuth } from './useAuth';
import { useIsAdmin } from './useUserRole';
import { useSpaceMembers } from './useSpaceMembers';

export const useCanEditEvent = (event: { space_id: string; created_by: string }) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: spaceMembers } = useSpaceMembers(event.space_id);
  
  if (!user) return false;
  
  // Company owners/admins can edit any event
  if (isAdmin) return true;
  
  // Event creator can edit their own event
  if (event.created_by === user.id) return true;
  
  // Space admins can edit events in their space
  const userMembership = spaceMembers?.find(member => member.user_id === user.id);
  if (userMembership?.role === 'admin') return true;
  
  return false;
};