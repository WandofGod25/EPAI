-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  result := json_build_object('success', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role; 