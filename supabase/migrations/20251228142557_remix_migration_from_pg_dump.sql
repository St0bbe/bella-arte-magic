CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'super_admin'
);


--
-- Name: get_user_tenant(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tenant(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.tenants WHERE owner_id = _user_id LIMIT 1
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    client_name text NOT NULL,
    client_phone text,
    event_date date NOT NULL,
    event_time time without time zone,
    event_type text,
    location text,
    notes text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recurrence_type text,
    recurrence_end_date date,
    parent_appointment_id uuid,
    estimated_value numeric DEFAULT 0
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    appointment_id uuid,
    quote_id uuid,
    client_name text NOT NULL,
    client_email text,
    client_phone text,
    contract_type text DEFAULT 'party'::text,
    file_url text,
    status text DEFAULT 'draft'::text,
    sent_at timestamp with time zone,
    signed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    signature_token text,
    signature_data text,
    signer_ip text,
    signer_user_agent text,
    signer_location text,
    CONSTRAINT contracts_contract_type_check CHECK ((contract_type = ANY (ARRAY['party'::text, 'rental'::text, 'decoration'::text, 'other'::text]))),
    CONSTRAINT contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'cancelled'::text])))
);


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    theme text NOT NULL,
    event_type text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    deleted_at timestamp with time zone
);


--
-- Name: gift_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gift_list_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric,
    image_url text,
    link_url text,
    is_reserved boolean DEFAULT false,
    reserved_by text,
    reserved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gift_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invitation_id uuid,
    tenant_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    share_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text),
    child_name text NOT NULL,
    child_age integer,
    theme text NOT NULL,
    event_date date,
    event_time text,
    event_location text,
    additional_info text,
    image_url text,
    background_color text DEFAULT '#FFFFFF'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gift_list_url text
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    message text,
    source text DEFAULT 'contact_form'::text,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quote_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    service_id uuid,
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0,
    total_price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    appointment_id uuid,
    client_name text NOT NULL,
    client_email text,
    client_phone text,
    status text DEFAULT 'pending'::text,
    valid_until date,
    notes text,
    total_value numeric DEFAULT 0,
    approval_token text,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quotes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'approved'::text, 'rejected'::text, 'expired'::text])))
);


--
-- Name: reminder_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    tenant_id uuid,
    client_name text NOT NULL,
    client_phone text,
    event_date date NOT NULL,
    event_time text,
    message text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    tenant_id uuid
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#FF6B9D'::text,
    secondary_color text DEFAULT '#C084FC'::text,
    whatsapp_number text,
    address text,
    is_active boolean DEFAULT true,
    subscription_status text DEFAULT 'trial'::text,
    subscription_ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_signature_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_signature_token_key UNIQUE (signature_token);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: gift_items gift_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_pkey PRIMARY KEY (id);


--
-- Name: gift_lists gift_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_lists
    ADD CONSTRAINT gift_lists_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_share_token_key UNIQUE (share_token);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_approval_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_approval_token_key UNIQUE (approval_token);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: reminder_logs reminder_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_tenant_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_tenant_key_unique UNIQUE (tenant_id, key);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_appointments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_parent ON public.appointments USING btree (parent_appointment_id);


--
-- Name: idx_appointments_recurrence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_recurrence ON public.appointments USING btree (recurrence_type) WHERE (recurrence_type IS NOT NULL);


--
-- Name: idx_contracts_signature_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_signature_token ON public.contracts USING btree (signature_token);


--
-- Name: idx_gallery_items_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_items_deleted_at ON public.gallery_items USING btree (deleted_at);


--
-- Name: idx_reminder_logs_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_logs_appointment ON public.reminder_logs USING btree (appointment_id);


--
-- Name: idx_reminder_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_logs_status ON public.reminder_logs USING btree (status);


--
-- Name: idx_reminder_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_logs_tenant ON public.reminder_logs USING btree (tenant_id);


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gallery_items update_gallery_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invitations update_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quotes update_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_settings update_site_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_parent_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_parent_appointment_id_fkey FOREIGN KEY (parent_appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gallery_items gallery_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gift_items gift_items_gift_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_gift_list_id_fkey FOREIGN KEY (gift_list_id) REFERENCES public.gift_lists(id) ON DELETE CASCADE;


--
-- Name: gift_lists gift_lists_invitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_lists
    ADD CONSTRAINT gift_lists_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.invitations(id) ON DELETE CASCADE;


--
-- Name: gift_lists gift_lists_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_lists
    ADD CONSTRAINT gift_lists_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invitations invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: leads leads_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: quotes quotes_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: quotes quotes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: reminder_logs reminder_logs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: reminder_logs reminder_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: services services_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_settings site_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invitations Admins can delete tenant invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete tenant invitations" ON public.invitations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.tenants t ON ((t.owner_id = ur.user_id)))
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])) AND (t.id = invitations.tenant_id)))));


--
-- Name: gift_items Admins can manage gift items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage gift items" ON public.gift_items USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: gift_lists Admins can manage gift lists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage gift lists" ON public.gift_lists USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: invitations Admins can update tenant invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tenant invitations" ON public.invitations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.tenants t ON ((t.owner_id = ur.user_id)))
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])) AND (t.id = invitations.tenant_id)))));


--
-- Name: reminder_logs Admins can view all reminder logs for their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reminder logs for their tenant" ON public.reminder_logs FOR SELECT USING (((tenant_id IN ( SELECT public.get_user_tenant(auth.uid()) AS get_user_tenant)) OR public.is_super_admin(auth.uid())));


--
-- Name: invitations Anyone can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create invitations" ON public.invitations FOR INSERT WITH CHECK (true);


--
-- Name: leads Anyone can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);


--
-- Name: gift_items Anyone can reserve gifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can reserve gifts" ON public.gift_items FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: contracts Anyone can sign contracts with valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can sign contracts with valid token" ON public.contracts FOR UPDATE USING ((signature_token IS NOT NULL)) WITH CHECK ((signature_token IS NOT NULL));


--
-- Name: tenants Anyone can view active tenants by slug; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active tenants by slug" ON public.tenants FOR SELECT USING ((is_active = true));


--
-- Name: contracts Anyone can view contracts by signature token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view contracts by signature token" ON public.contracts FOR SELECT USING ((signature_token IS NOT NULL));


--
-- Name: invitations Anyone can view invitations by share token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view invitations by share token" ON public.invitations FOR SELECT USING ((share_token IS NOT NULL));


--
-- Name: quotes Anyone can view quotes by token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view quotes by token" ON public.quotes FOR SELECT USING ((approval_token IS NOT NULL));


--
-- Name: gallery_items Anyone can view tenant gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tenant gallery items" ON public.gallery_items FOR SELECT USING (true);


--
-- Name: services Anyone can view tenant services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tenant services" ON public.services FOR SELECT USING (true);


--
-- Name: site_settings Anyone can view tenant site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tenant site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: gift_items Gift items are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gift items are viewable by everyone" ON public.gift_items FOR SELECT USING (true);


--
-- Name: gift_lists Gift lists are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gift lists are viewable by everyone" ON public.gift_lists FOR SELECT USING (true);


--
-- Name: tenants Owners can update their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their own tenant" ON public.tenants FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: tenants Owners can view their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their own tenant" ON public.tenants FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: tenants Super admins can delete tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can delete tenants" ON public.tenants FOR DELETE USING (public.is_super_admin(auth.uid()));


--
-- Name: tenants Super admins can insert tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can insert tenants" ON public.tenants FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles USING (public.is_super_admin(auth.uid()));


--
-- Name: tenants Super admins can update all tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can update all tenants" ON public.tenants FOR UPDATE USING (public.is_super_admin(auth.uid()));


--
-- Name: tenants Super admins can view all tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all tenants" ON public.tenants FOR SELECT USING (public.is_super_admin(auth.uid()));


--
-- Name: reminder_logs System can insert reminder logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert reminder logs" ON public.reminder_logs FOR INSERT WITH CHECK (true);


--
-- Name: reminder_logs System can update reminder logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update reminder logs" ON public.reminder_logs FOR UPDATE USING (true);


--
-- Name: appointments Tenant owners can delete their appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their appointments" ON public.appointments FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: contracts Tenant owners can delete their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their contracts" ON public.contracts FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: gallery_items Tenant owners can delete their gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their gallery items" ON public.gallery_items FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: leads Tenant owners can delete their leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their leads" ON public.leads FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: quotes Tenant owners can delete their quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their quotes" ON public.quotes FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: services Tenant owners can delete their services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their services" ON public.services FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: site_settings Tenant owners can delete their site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can delete their site settings" ON public.site_settings FOR DELETE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: appointments Tenant owners can insert appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert appointments" ON public.appointments FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: contracts Tenant owners can insert contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert contracts" ON public.contracts FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: gallery_items Tenant owners can insert gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert gallery items" ON public.gallery_items FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: quotes Tenant owners can insert quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert quotes" ON public.quotes FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: services Tenant owners can insert services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert services" ON public.services FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: site_settings Tenant owners can insert site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: quote_items Tenant owners can manage quote items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can manage quote items" ON public.quote_items USING ((EXISTS ( SELECT 1
   FROM public.quotes q
  WHERE ((q.id = quote_items.quote_id) AND ((q.tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid()))))));


--
-- Name: appointments Tenant owners can update their appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their appointments" ON public.appointments FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: contracts Tenant owners can update their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their contracts" ON public.contracts FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: gallery_items Tenant owners can update their gallery items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their gallery items" ON public.gallery_items FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: leads Tenant owners can update their leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their leads" ON public.leads FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: quotes Tenant owners can update their quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their quotes" ON public.quotes FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: services Tenant owners can update their services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their services" ON public.services FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: site_settings Tenant owners can update their site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can update their site settings" ON public.site_settings FOR UPDATE USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: appointments Tenant owners can view their appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can view their appointments" ON public.appointments FOR SELECT USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: contracts Tenant owners can view their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can view their contracts" ON public.contracts FOR SELECT USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: leads Tenant owners can view their leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can view their leads" ON public.leads FOR SELECT USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: quotes Tenant owners can view their quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant owners can view their quotes" ON public.quotes FOR SELECT USING (((tenant_id = public.get_user_tenant(auth.uid())) OR public.is_super_admin(auth.uid())));


--
-- Name: tenants Users can create their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tenant" ON public.tenants FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: user_roles Users can insert their own admin role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own admin role" ON public.user_roles FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (role = 'admin'::public.app_role)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

--
-- Name: gift_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;

--
-- Name: gift_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gift_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;