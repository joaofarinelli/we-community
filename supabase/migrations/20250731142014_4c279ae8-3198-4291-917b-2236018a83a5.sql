-- Add badge selection to trails
ALTER TABLE public.trails 
ADD COLUMN completion_badge_id uuid,
ADD COLUMN auto_complete boolean DEFAULT true;

-- Add foreign key reference to trail_badges
ALTER TABLE public.trails 
ADD CONSTRAINT fk_trails_completion_badge 
FOREIGN KEY (completion_badge_id) REFERENCES public.trail_badges(id) ON DELETE SET NULL;

-- Create function to auto-complete trail when all stages are done
CREATE OR REPLACE FUNCTION public.auto_complete_trail_on_stage_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  trail_record RECORD;
  badge_id UUID;
BEGIN
  -- Only proceed if the stage was just completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    
    -- Get trail info
    SELECT * INTO trail_record FROM public.trails WHERE id = NEW.trail_id;
    
    -- Only auto-complete if enabled for this trail
    IF trail_record.auto_complete = true THEN
      
      -- Count total stages for this trail
      SELECT COUNT(*) INTO total_stages
      FROM public.trail_stages
      WHERE trail_id = NEW.trail_id;
      
      -- Count completed stages for this user
      SELECT COUNT(*) INTO completed_stages
      FROM public.trail_progress
      WHERE trail_id = NEW.trail_id 
      AND user_id = NEW.user_id 
      AND is_completed = true;
      
      -- If all stages are completed, mark trail as completed
      IF total_stages > 0 AND completed_stages = total_stages THEN
        UPDATE public.trails 
        SET status = 'completed',
            updated_at = now()
        WHERE id = NEW.trail_id;
        
        -- Award completion badge if configured
        IF trail_record.completion_badge_id IS NOT NULL THEN
          INSERT INTO public.user_trail_badges (user_id, company_id, trail_id, badge_id)
          VALUES (NEW.user_id, NEW.company_id, NEW.trail_id, trail_record.completion_badge_id)
          ON CONFLICT (user_id, trail_id, badge_id) DO NOTHING;
          
          -- Get badge details for coins reward
          SELECT coins_reward INTO badge_id
          FROM public.trail_badges 
          WHERE id = trail_record.completion_badge_id;
          
          -- Award coins if badge has reward
          IF badge_id > 0 THEN
            INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
            VALUES (NEW.user_id, NEW.company_id, 'trail_completion', badge_id, badge_id, NEW.trail_id);
            
            -- Update user's total coins
            INSERT INTO public.user_points (user_id, company_id, total_coins)
            VALUES (NEW.user_id, NEW.company_id, badge_id)
            ON CONFLICT (user_id, company_id)
            DO UPDATE SET 
              total_coins = user_points.total_coins + badge_id,
              updated_at = now();
          END IF;
        END IF;
        
        -- Create completion notification
        INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
        VALUES (
          NEW.user_id,
          NEW.company_id,
          'trail_completed',
          'Trilha Concluída! 🎉',
          'Parabéns! Você concluiu a trilha "' || trail_record.name || '".',
          NEW.trail_id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-completion
DROP TRIGGER IF EXISTS trigger_auto_complete_trail ON public.trail_progress;
CREATE TRIGGER trigger_auto_complete_trail
  AFTER UPDATE OF is_completed ON public.trail_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_trail_on_stage_completion();