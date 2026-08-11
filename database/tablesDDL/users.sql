-- public.users definition
-- Drop table
-- DROP TABLE public.users;
CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'DRIVER' NOT NULL,
    creation_date timestamp DEFAULT now() NOT NULL,
    update_date timestamp DEFAULT now() NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'DRIVER'))
);
