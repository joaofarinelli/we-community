import { useAuth } from './useAuth';
import { useIsAdmin } from './useUserRole';
import { useSpaceMembers } from './useSpaceMembers';

export const useCanEditEvent = (event: { space_id: string; created_by: string; status?: string }) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: spaceMembers } = useSpaceMembers(event.space_id);
  
  if (!user) return false;
  
  // Only allow editing of draft events, or if user is admin
  const canEditBasedOnStatus = event.status === 'draft' || isAdmin;
  
  if (!canEditBasedOnStatus) return false;
  
  // Company owners/admins can edit any event
  if (isAdmin) return true;
  
  // Event creator can edit their own draft events
  if (event.created_by === user.id) return true;
  
  // Space admins can edit draft events in their space
  const userMembership = spaceMembers?.find(member => member.user_id === user.id);
  if (userMembership?.role === 'admin') return true;
  
  return false;
};