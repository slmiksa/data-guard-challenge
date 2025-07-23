
-- Create table for employee test results
CREATE TABLE public.employee_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert their results
CREATE POLICY "Allow insert employee results" 
  ON public.employee_results 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Create policy to allow anyone to select (for duplicate check)
CREATE POLICY "Allow select employee results" 
  ON public.employee_results 
  FOR SELECT 
  TO anon
  USING (true);

-- Create index for faster employee_id lookups
CREATE INDEX idx_employee_results_employee_id ON public.employee_results(employee_id);
