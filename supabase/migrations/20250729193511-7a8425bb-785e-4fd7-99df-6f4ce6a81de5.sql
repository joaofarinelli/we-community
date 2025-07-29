-- Add foreign key constraint between event_participants and events
ALTER TABLE public.event_participants 
ADD CONSTRAINT fk_event_participants_event_id 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Add foreign key constraint between events and spaces  
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_space_id 
FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;