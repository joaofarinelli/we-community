-- Create payment provider configurations table
CREATE TABLE public.payment_provider_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'tmb_educacao',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  credentials JSONB NOT NULL DEFAULT '{}',
  webhook_secret TEXT,
  coins_per_brl DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, provider)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'tmb_educacao',
  purpose_type TEXT NOT NULL, -- 'coin_topup' or 'marketplace_item'
  reference_id UUID, -- item_id for marketplace purchases
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_order_id TEXT,
  boleto_url TEXT,
  barcode TEXT,
  linha_digitavel TEXT,
  boleto_expiration TIMESTAMP WITH TIME ZONE,
  payer_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_provider_configs
CREATE POLICY "Company owners can manage payment configs"
ON public.payment_provider_configs
FOR ALL
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company admins can view payment configs"
ON public.payment_provider_configs
FOR SELECT
USING (company_id = get_user_company_id() AND (
  is_company_owner() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.company_id = payment_provider_configs.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  )
));

-- RLS policies for payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all payments"
ON public.payments
FOR SELECT
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create payments"
ON public.payments
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "System can update payments"
ON public.payments
FOR UPDATE
USING (company_id = get_user_company_id());

-- Create RPC function for external marketplace purchases
CREATE OR REPLACE FUNCTION public.finalize_marketplace_purchase_external(
  p_user_id UUID,
  p_company_id UUID,
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_delivery JSONB DEFAULT '{}',
  p_payment_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item_record RECORD;
  purchase_id UUID;
  seller_user_id UUID;
  seller_type_val TEXT;
  address_text TEXT := '';
BEGIN
  -- Get item details
  SELECT * INTO item_record
  FROM public.marketplace_items
  WHERE id = p_item_id 
    AND company_id = p_company_id 
    AND is_active = true 
    AND moderation_status = 'approved';
  
  IF item_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or not available');
  END IF;
  
  -- Check stock if limited
  IF item_record.stock_quantity IS NOT NULL AND item_record.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;
  
  seller_user_id := item_record.seller_id;
  seller_type_val := item_record.seller_type;

  -- Prepare address text if physical item
  IF item_record.item_type = 'physical' THEN
    address_text := ' Endereço: '
      || COALESCE(p_delivery->>'address','')
      || ', ' || COALESCE(p_delivery->>'number','')
      || ' - ' || COALESCE(p_delivery->>'neighborhood','')
      || ' - ' || COALESCE(p_delivery->>'city','')
      || '/' || COALESCE(p_delivery->>'state','')
      || ' CEP: ' || COALESCE(p_delivery->>'postal_code','');
  END IF;
  
  -- Create purchase record
  INSERT INTO public.marketplace_purchases (
    company_id, user_id, item_id, item_name, price_coins, quantity
  ) VALUES (
    p_company_id, p_user_id, p_item_id, item_record.name, item_record.price_coins, p_quantity
  ) RETURNING id INTO purchase_id;
  
  -- Update stock if limited
  IF item_record.stock_quantity IS NOT NULL THEN
    UPDATE public.marketplace_items 
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_item_id;
  END IF;

  -- Create delivery record
  IF item_record.item_type = 'digital' THEN
    INSERT INTO public.purchase_deliveries (
      purchase_id, company_id, buyer_id, seller_id, seller_type, delivery_type, delivery_data, delivery_status, delivered_at
    ) VALUES (
      purchase_id, p_company_id, p_user_id, seller_user_id, seller_type_val, 'digital',
      jsonb_build_object('url', item_record.digital_delivery_url),
      CASE WHEN item_record.digital_delivery_url IS NOT NULL THEN 'delivered' ELSE 'pending' END,
      CASE WHEN item_record.digital_delivery_url IS NOT NULL THEN now() ELSE NULL END
    );
  ELSE
    INSERT INTO public.purchase_deliveries (
      purchase_id, company_id, buyer_id, seller_id, seller_type, delivery_type, delivery_data, delivery_status
    ) VALUES (
      purchase_id, p_company_id, p_user_id, seller_user_id, seller_type_val, 'physical',
      COALESCE(p_delivery, '{}'::jsonb),
      'pending'
    );
  END IF;

  -- Notify seller if user seller
  IF seller_type_val = 'user' AND seller_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    VALUES (
      seller_user_id,
      p_company_id,
      'item_sold',
      'Item Vendido via Boleto!',
      'Seu item "' || item_record.name || '" foi vendido via boleto.' || address_text,
      purchase_id
    );
  END IF;

  -- Notify company owners/admins for company-sold physical items
  IF seller_type_val = 'company' AND item_record.item_type = 'physical' THEN
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    SELECT p.user_id, p_company_id, 'item_order', 'Novo Pedido via Boleto',
      'Pedido do item "' || item_record.name || '" (' || p_quantity || ' un.) pago via boleto.' || address_text,
      purchase_id
    FROM public.profiles p
    WHERE p.company_id = p_company_id AND p.role IN ('owner','admin') AND p.is_active = true;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'purchase_id', purchase_id
  );
END;
$$;

-- Add updated_at trigger for payment_provider_configs
CREATE TRIGGER update_payment_provider_configs_updated_at
BEFORE UPDATE ON public.payment_provider_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();