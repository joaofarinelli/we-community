-- Update the constraint to include undo actions
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
  'challenge_reward'::text,
  'undo_create_post'::text,
  'undo_like_post'::text,
  'undo_comment_post'::text,
  'undo_receive_like'::text,
  'undo_receive_comment'::text,
  'lesson_complete'::text,
  'lesson_like'::text,
  'module_complete'::text,
  'course_complete'::text,
  'streak_milestone'::text,
  'trail_badge'::text,
  'trail_completion'::text,
  'refund_item'::text
]));