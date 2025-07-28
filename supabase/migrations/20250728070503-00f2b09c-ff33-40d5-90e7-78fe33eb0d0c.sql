
-- Add DELETE policy for employee_results table
CREATE POLICY "Allow delete employee results" 
ON public.employee_results 
FOR DELETE 
USING (true);
