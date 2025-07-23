-- Add missing RLS policies for INSERT operations

-- Allow authenticated users to create companies
CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to create their own roles
CREATE POLICY "Users can create their own roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add missing UPDATE and DELETE policies for user_roles
CREATE POLICY "Users can update their own roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);