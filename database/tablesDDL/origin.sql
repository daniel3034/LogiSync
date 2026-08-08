-- public.origin definition
-- Drop table
-- DROP TABLE public.origin;
CREATE TABLE public.origin (
    origin_id uuid DEFAULT uuidv7() NOT NULL,
    city_id uuid NULL,
    sender_id uuid NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT origin_origin_id_not_null NOT NULL origin_id,
    CONSTRAINT origin_pkey PRIMARY KEY (origin_id)
);
-- public.origin foreign keys
ALTER TABLE public.origin
ADD CONSTRAINT fk_origin_city FOREIGN KEY (city_id) REFERENCES public.city(city_id) ON DELETE CASCADE;
ALTER TABLE public.origin
ADD CONSTRAINT fk_origin_sender FOREIGN KEY (sender_id) REFERENCES public.sender(sender_id) ON DELETE CASCADE;