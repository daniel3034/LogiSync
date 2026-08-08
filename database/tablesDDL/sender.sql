-- public.sender definition
-- Drop table
-- DROP TABLE public.sender;
CREATE TABLE public.sender (
    sender_id uuid DEFAULT uuidv7() NOT NULL,
    "name" text NOT NULL,
    phone text NULL,
    creation_date timestamp DEFAULT now() NULL,
    update_date timestamp NULL,
    CONSTRAINT sender_name_not_null NOT NULL name,
    CONSTRAINT sender_pkey PRIMARY KEY (sender_id),
    CONSTRAINT sender_sender_id_not_null NOT NULL sender_id
);