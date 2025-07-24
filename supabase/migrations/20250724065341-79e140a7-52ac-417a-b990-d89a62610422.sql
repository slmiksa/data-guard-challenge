
-- Add time_taken column to employee_results table
ALTER TABLE public.employee_results 
ADD COLUMN time_taken INTEGER DEFAULT 0;
