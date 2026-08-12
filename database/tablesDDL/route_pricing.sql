-- public.route_pricing definition
-- Drop table
-- DROP TABLE public.route_pricing;
CREATE TABLE public.route_pricing (
    route_pricing_id text NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    multiplier float8 NOT NULL,
    creation_date timestamp DEFAULT now() NOT NULL,
    update_date timestamp DEFAULT now() NOT NULL,
    CONSTRAINT route_pricing_pkey PRIMARY KEY (route_pricing_id),
    CONSTRAINT route_pricing_origin_destination_key UNIQUE (origin, destination)
);
