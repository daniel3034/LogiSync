-- public.waybill definition
-- Drop table
-- DROP TABLE public.waybill;
CREATE TABLE public.waybill (
    waybill_id text NOT NULL,
    driver_id text NULL,
    sender_name text NOT NULL,
    sender_phone text NOT NULL,
    receiver_name text NOT NULL,
    receiver_phone text NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    weight float8 NOT NULL,
    volume float8 NOT NULL,
    description text NULL,
    client_cost float8 NOT NULL,
    driver_payment float8 NOT NULL,
    net_margin float8 NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    creation_date timestamp DEFAULT now() NOT NULL,
    update_date timestamp DEFAULT now() NOT NULL,
    CONSTRAINT waybill_pkey PRIMARY KEY (waybill_id),
    CONSTRAINT waybill_waybill_id_not_null NOT NULL waybill_id,
    CONSTRAINT waybill_sender_name_not_null NOT NULL sender_name,
    CONSTRAINT waybill_sender_phone_not_null NOT NULL sender_phone,
    CONSTRAINT waybill_receiver_name_not_null NOT NULL receiver_name,
    CONSTRAINT waybill_receiver_phone_not_null NOT NULL receiver_phone,
    CONSTRAINT waybill_origin_not_null NOT NULL origin,
    CONSTRAINT waybill_destination_not_null NOT NULL destination,
    CONSTRAINT waybill_weight_not_null NOT NULL weight,
    CONSTRAINT waybill_volume_not_null NOT NULL volume,
    CONSTRAINT waybill_client_cost_not_null NOT NULL client_cost,
    CONSTRAINT waybill_driver_payment_not_null NOT NULL driver_payment,
    CONSTRAINT waybill_net_margin_not_null NOT NULL net_margin,
    CONSTRAINT waybill_status_not_null NOT NULL status
);
-- public.waybill foreign keys
ALTER TABLE public.waybill
ADD CONSTRAINT fk_waybill_driver FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id) ON DELETE
SET NULL;
