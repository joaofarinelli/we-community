import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useAuth } from "@/hooks/useAuth";

interface EventParticipationDropdownProps {
  eventId: string;
}

export const EventParticipationDropdown = ({ eventId }: EventParticipationDropdownProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent } = useEventParticipants(eventId);
  
  const userParticipation = participants?.find(p => p.user_id === user?.id);
  const currentStatus = userParticipation ? 'confirmed' : 'not_confirmed';

  const handleStatusChange = (value: string) => {
    if (value === 'confirmed' && !userParticipation) {
      joinEvent.mutate();
    } else if (value === 'not_confirmed' && userParticipation) {
      leaveEvent.mutate();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Status de Participação</label>
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusChange}
        disabled={joinEvent.isPending || leaveEvent.isPending}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_confirmed">Não confirmado</SelectItem>
          <SelectItem value="confirmed">Confirmado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};