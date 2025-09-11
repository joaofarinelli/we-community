-- Criar tabela exclusiva para produtos TMB
CREATE TABLE public.tmb_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  tmb_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_brl DECIMAL(10,2),
  price_coins INTEGER,
  category TEXT,
  image_url TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tmb_data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, tmb_product_id)
);

-- Enable RLS
ALTER TABLE public.tmb_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company owners and admins can manage TMB products" 
ON public.tmb_products 
FOR ALL 
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id = tmb_products.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  ))
);

CREATE POLICY "Users can view active TMB products in their company" 
ON public.tmb_products 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

CREATE POLICY "System can sync TMB products" 
ON public.tmb_products 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tmb_products_updated_at
BEFORE UPDATE ON public.tmb_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_tmb_products_company_id ON public.tmb_products(company_id);
CREATE INDEX idx_tmb_products_tmb_id ON public.tmb_products(company_id, tmb_product_id);
CREATE INDEX idx_tmb_products_active ON public.tmb_products(company_id, is_active);