-- Add bug reports email configuration to companies table
ALTER TABLE public.companies 
ADD COLUMN bug_reports_email TEXT;