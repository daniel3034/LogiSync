-- public.city definition
-- Drop table
-- DROP TABLE public.city;
CREATE TABLE public.city (
    city_id text NOT NULL,
    city_name text NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT city_city_id_not_null NOT NULL city_id,
    CONSTRAINT city_pkey PRIMARY KEY (city_id)
);