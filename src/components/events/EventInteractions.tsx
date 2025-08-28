import { EventLikeButton } from './EventLikeButton';
import { EventComments } from './EventComments';
import { Separator } from '@/components/ui/separator';

interface EventInteractionsProps {
  eventId: string;
}

export const EventInteractions = ({ eventId }: EventInteractionsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <EventLikeButton eventId={eventId} />
      </div>
      
      <Separator />
      
      <EventComments eventId={eventId} />
    </div>
  );
};