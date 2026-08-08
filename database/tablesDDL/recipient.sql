-- public.recipient definition
-- Drop table
-- DROP TABLE public.recipient;
CREATE TABLE public.recipient (
    recipient_id uuid DEFAULT uuidv7() NOT NULL,
    "name" text NOT NULL,
    phone text NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT recipient_name_not_null NOT NULL name,
    CONSTRAINT recipient_pkey PRIMARY KEY (recipient_id),
    CONSTRAINT recipient_recipient_id_not_null NOT NULL recipient_id
);