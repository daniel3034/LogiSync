-- public.driver definition
-- Drop table
-- DROP TABLE public.driver;
CREATE TABLE public.driver (
    driver_id uuid DEFAULT uuidv7() NOT NULL,
    "name" text NOT NULL,
    phone text NOT NULL,
    truck_size text NULL,
    preferred_city_id uuid NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT driver_driver_id_not_null NOT NULL driver_id,
    CONSTRAINT driver_name_not_null NOT NULL name,
    CONSTRAINT driver_phone_not_null NOT NULL phone,
    CONSTRAINT driver_pkey PRIMARY KEY (driver_id)
);
-- public.driver foreign keys
ALTER TABLE public.driver
ADD CONSTRAINT fk_driver_city FOREIGN KEY (preferred_city_id) REFERENCES public.city(city_id) ON DELETE
SET NULL;