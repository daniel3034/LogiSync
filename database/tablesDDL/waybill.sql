-- public.waybill definition
-- Drop table
-- DROP TABLE public.waybill;
CREATE TABLE public.waybill (
    waybill_id uuid DEFAULT uuidv7() NOT NULL,
    origin_id uuid NULL,
    destination_id uuid NULL,
    weight float8 NULL,
    volume float8 NULL,
    description text NULL,
    sender_cost float8 NULL,
    driver_payment float8 NULL,
    driver_id uuid NULL,
    net_margin float8 NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT waybill_pkey PRIMARY KEY (waybill_id),
    CONSTRAINT waybill_waybill_id_not_null NOT NULL waybill_id
);
-- public.waybill foreign keys
ALTER TABLE public.waybill
ADD CONSTRAINT fk_waybill_destination FOREIGN KEY (destination_id) REFERENCES public.destination(destination_id) ON DELETE
SET NULL;
ALTER TABLE public.waybill
ADD CONSTRAINT fk_waybill_driver FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id) ON DELETE
SET NULL;
ALTER TABLE public.waybill
ADD CONSTRAINT fk_waybill_origin FOREIGN KEY (origin_id) REFERENCES public.origin(origin_id) ON DELETE
SET NULL;