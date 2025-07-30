-- Insert default trail badges only for companies with owners
INSERT INTO public.trail_badges (company_id, name, description, icon_name, color, badge_type, coins_reward, created_by)
SELECT 
  c.id,
  badge.name,
  badge.description,
  badge.icon_name,
  badge.color,
  badge.badge_type,
  badge.coins_reward,
  p.user_id
FROM public.companies c
INNER JOIN public.profiles p ON p.company_id = c.id AND p.role = 'owner'
CROSS JOIN (
  VALUES 
    ('Desperta', 'Selo para quem inicia sua jornada de autoconhecimento', 'Sunrise', '#F59E0B', 'desperta', 25),
    ('Decidida', 'Selo para quem toma decisões importantes em sua vida', 'Target', '#8B5CF6', 'decidida', 50),
    ('Corajosa', 'Selo para quem enfrenta seus medos e desafios', 'Shield', '#EF4444', 'corajosa', 75),
    ('Em Movimento', 'Selo para quem está ativamente trabalhando em seus objetivos', 'Zap', '#10B981', 'em_movimento', 100),
    ('Celebrante', 'Selo para quem celebra suas conquistas e marcos', 'Star', '#F59E0B', 'celebrante', 150)
) AS badge(name, description, icon_name, color, badge_type, coins_reward)
WHERE NOT EXISTS (
  SELECT 1 FROM public.trail_badges tb 
  WHERE tb.company_id = c.id AND tb.badge_type = badge.badge_type
);