-- public.driver_preferred_city definition
-- Join table for Driver.preferredCities (comma-separated list in Prisma today).
-- Modeled here as a proper many-to-many relation; kept in sync manually until
-- the Prisma schema migrates preferredCities to a relation (see logisync-pricing skill).
-- Drop table
-- DROP TABLE public.driver_preferred_city;
CREATE TABLE public.driver_preferred_city (
    driver_id text NOT NULL,
    city_id text NOT NULL,
    creation_date timestamp DEFAULT now() NULL,
    CONSTRAINT driver_preferred_city_pkey PRIMARY KEY (driver_id, city_id)
);
-- public.driver_preferred_city foreign keys
ALTER TABLE public.driver_preferred_city
ADD CONSTRAINT fk_driver_preferred_city_driver FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id) ON DELETE CASCADE;
ALTER TABLE public.driver_preferred_city
ADD CONSTRAINT fk_driver_preferred_city_city FOREIGN KEY (city_id) REFERENCES public.city(city_id) ON DELETE CASCADE;
