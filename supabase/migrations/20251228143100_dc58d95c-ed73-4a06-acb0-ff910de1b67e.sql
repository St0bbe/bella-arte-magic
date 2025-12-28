-- Criar função para configurar admin automaticamente para o email específico
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  -- Se for o email da admin principal, configurar automaticamente
  IF NEW.email = 'thaisapgalk@gmail.com' THEN
    -- Adicionar role de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Associar ao tenant bellaarte
    SELECT id INTO tenant_record FROM public.tenants WHERE slug = 'bellaarte' LIMIT 1;
    
    IF tenant_record.id IS NOT NULL THEN
      UPDATE public.tenants 
      SET owner_id = NEW.id 
      WHERE id = tenant_record.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();