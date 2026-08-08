-- public.destination definition
-- Drop table
-- DROP TABLE public.destination;
CREATE TABLE public.destination (
    destination_id uuid DEFAULT uuidv7() NOT NULL,
    city_id uuid NULL,
    recipient_id uuid NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT destination_destination_id_not_null NOT NULL destination_id,
    CONSTRAINT destination_pkey PRIMARY KEY (destination_id)
);
-- public.destination foreign keys
ALTER TABLE public.destination
ADD CONSTRAINT fk_destination_city FOREIGN KEY (city_id) REFERENCES public.city(city_id) ON DELETE
SET NULL;
ALTER TABLE public.destination
ADD CONSTRAINT fk_destination_recipient FOREIGN KEY (recipient_id) REFERENCES public.recipient(recipient_id) ON DELETE
SET NULL;