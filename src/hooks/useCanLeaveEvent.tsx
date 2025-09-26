import { useAuth } from './useAuth';
import { useIsAdmin } from './useUserRole';
import { useSpaceMembers } from './useSpaceMembers';

interface EventParticipant {
  payment_status: string;
  status: string;
}

interface Event {
  space_id: string;
  created_by: string;
}

export const useCanLeaveEvent = (
  event: Event | null, 
  participation: EventParticipant | null
) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: spaceMembers } = useSpaceMembers(event?.space_id || '');
  
  if (!user || !event || !participation) return false;
  
  // Company admins can always remove participants
  if (isAdmin) return true;
  
  // Event creator can remove participants
  if (event.created_by === user.id) return true;
  
  // Space admins can remove participants
  const userMembership = spaceMembers?.find(member => member.user_id === user.id);
  if (userMembership?.role === 'admin') return true;
  
  // Regular users can only leave if they haven't paid and are not confirmed
  const hasPaid = participation.payment_status !== 'none' && participation.payment_status !== 'cancelled';
  const isConfirmed = participation.status === 'confirmed';
  
  // If user has paid or is confirmed, they cannot leave
  if (hasPaid || isConfirmed) return false;
  
  return true;
};