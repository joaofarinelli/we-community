-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct',
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create conversation_participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  company_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_edited BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_conversations_company_id ON public.conversations(company_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations in their company"
ON public.conversations
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update conversations they participate in"
ON public.conversations
FOR UPDATE
USING (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants in conversations they're part of"
ON public.conversation_participants
FOR SELECT
USING (
  company_id = get_user_company_id() AND
  (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id
    AND cp2.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can join conversations in their company"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants
FOR UPDATE
USING (
  company_id = get_user_company_id() AND
  user_id = auth.uid()
);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
USING (
  company_id = get_user_company_id() AND
  user_id = auth.uid()
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in conversations they participate in"
ON public.messages
FOR SELECT
USING (
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in conversations they participate in"
ON public.messages
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id() AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (
  company_id = get_user_company_id() AND
  sender_id = auth.uid()
);

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  company_id = get_user_company_id() AND
  sender_id = auth.uid()
);

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation last_message_at when a message is created
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to find or create direct conversation between two users
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_company_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing direct conversation between the two users
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  WHERE c.company_id = p_company_id
    AND c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user1_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_user2_id
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = 2;

  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (company_id, type)
    VALUES (p_company_id, 'direct')
    RETURNING id INTO conversation_id;

    -- Add both users as participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, company_id)
    VALUES 
      (conversation_id, p_user1_id, p_company_id),
      (conversation_id, p_user2_id, p_company_id);
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;