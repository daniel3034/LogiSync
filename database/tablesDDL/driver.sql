-- public.driver definition
-- Drop table
-- DROP TABLE public.driver;
CREATE TABLE public.driver (
    driver_id text NOT NULL,
    "name" text NOT NULL,
    phone text NOT NULL,
    truck_size text NOT NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT driver_driver_id_not_null NOT NULL driver_id,
    CONSTRAINT driver_name_not_null NOT NULL name,
    CONSTRAINT driver_phone_not_null NOT NULL phone,
    CONSTRAINT driver_truck_size_not_null NOT NULL truck_size,
    CONSTRAINT driver_pkey PRIMARY KEY (driver_id),
    CONSTRAINT driver_phone_key UNIQUE (phone)
);