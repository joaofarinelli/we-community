-- Add transfer action types to the point_transactions constraint
ALTER TABLE public.point_transactions 
DROP CONSTRAINT IF EXISTS point_transactions_action_type_check;

ALTER TABLE public.point_transactions 
ADD CONSTRAINT point_transactions_action_type_check 
CHECK (action_type = ANY (ARRAY[
  'create_post'::text,
  'like_post'::text, 
  'comment_post'::text,
  'receive_like'::text,
  'receive_comment'::text,
  'transfer_sent'::text,
  'transfer_received'::text,
  'purchase_item'::text,
  'item_sold'::text,
  'challenge_reward'::text
]));