export const demoSchema = `
CREATE TYPE public.billing_type AS ENUM (
    'per_kwh',
    'per_minute'
);

CREATE TYPE public.range AS ENUM (
    'ideal',
    'rated'
);

CREATE TYPE public.states_status AS ENUM (
    'online',
    'offline',
    'asleep'
);

CREATE TYPE public.unit_of_length AS ENUM (
    'km',
    'mi'
);

CREATE TYPE public.unit_of_pressure AS ENUM (
    'bar',
    'psi'
);

CREATE TYPE public.unit_of_temperature AS ENUM (
    'C',
    'F'
);

CREATE TABLE public.addresses (
    id integer NOT NULL,
    display_name character varying(512),
    latitude numeric(8,6),
    longitude numeric(9,6),
    name character varying(255),
    house_number character varying(255),
    road character varying(255),
    neighbourhood character varying(255),
    city character varying(255),
    county character varying(255),
    postcode character varying(255),
    state character varying(255),
    state_district character varying(255),
    country character varying(255),
    raw jsonb,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    osm_id bigint,
    osm_type text
);

CREATE TABLE public.car_settings (
    id bigint NOT NULL,
    suspend_min integer DEFAULT 21 NOT NULL,
    suspend_after_idle_min integer DEFAULT 15 NOT NULL,
    req_not_unlocked boolean DEFAULT false NOT NULL,
    free_supercharging boolean DEFAULT false NOT NULL,
    use_streaming_api boolean DEFAULT true NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    lfp_battery boolean DEFAULT false NOT NULL
);

CREATE TABLE public.cars (
    id smallint NOT NULL,
    eid bigint NOT NULL,
    vid bigint NOT NULL,
    model character varying(255),
    efficiency double precision,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    vin text NOT NULL,
    name text,
    trim_badging text,
    settings_id bigint NOT NULL,
    exterior_color text,
    spoiler_type text,
    wheel_type text,
    display_priority smallint DEFAULT 1 NOT NULL,
    marketing_name character varying(255)
);

CREATE TABLE public.charges (
    id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    battery_heater_on boolean,
    battery_level smallint,
    charge_energy_added numeric(8,2) NOT NULL,
    charger_actual_current smallint,
    charger_phases smallint,
    charger_pilot_current smallint,
    charger_power smallint NOT NULL,
    charger_voltage smallint,
    fast_charger_present boolean,
    conn_charge_cable character varying(255),
    fast_charger_brand character varying(255),
    fast_charger_type character varying(255),
    ideal_battery_range_km numeric(6,2) NOT NULL,
    not_enough_power_to_heat boolean,
    outside_temp numeric(4,1),
    charging_process_id integer NOT NULL,
    battery_heater boolean,
    battery_heater_no_power boolean,
    rated_battery_range_km numeric(6,2),
    usable_battery_level smallint,
    CONSTRAINT positive_charger_phases CHECK ((charger_phases > 0))
);

CREATE TABLE public.charging_processes (
    id integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    charge_energy_added numeric(8,2),
    start_ideal_range_km numeric(6,2),
    end_ideal_range_km numeric(6,2),
    start_battery_level smallint,
    end_battery_level smallint,
    duration_min smallint,
    outside_temp_avg numeric(4,1),
    car_id smallint NOT NULL,
    position_id integer NOT NULL,
    address_id integer,
    start_rated_range_km numeric(6,2),
    end_rated_range_km numeric(6,2),
    geofence_id integer,
    charge_energy_used numeric(8,2),
    cost numeric(14,2)
);

CREATE TABLE public.drives (
    id integer CONSTRAINT trips_id_not_null NOT NULL,
    start_date timestamp without time zone CONSTRAINT trips_start_date_not_null NOT NULL,
    end_date timestamp without time zone,
    outside_temp_avg numeric(4,1),
    speed_max smallint,
    power_max smallint,
    power_min smallint,
    start_ideal_range_km numeric(6,2),
    end_ideal_range_km numeric(6,2),
    start_km double precision,
    end_km double precision,
    distance double precision,
    duration_min smallint,
    car_id smallint CONSTRAINT trips_car_id_not_null NOT NULL,
    inside_temp_avg numeric(4,1),
    start_address_id integer,
    end_address_id integer,
    start_rated_range_km numeric(6,2),
    end_rated_range_km numeric(6,2),
    start_position_id integer,
    end_position_id integer,
    start_geofence_id integer,
    end_geofence_id integer,
    ascent smallint,
    descent smallint
);

CREATE TABLE public.geofences (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    latitude numeric(8,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    radius smallint DEFAULT 25 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    cost_per_unit numeric(9,4),
    session_fee numeric(14,2),
    billing_type public.billing_type DEFAULT 'per_kwh'::public.billing_type NOT NULL
);

CREATE TABLE public.positions (
    id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    latitude numeric(8,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    speed smallint,
    power smallint,
    odometer double precision,
    ideal_battery_range_km numeric(6,2),
    battery_level smallint,
    outside_temp numeric(4,1),
    elevation smallint,
    fan_status integer,
    driver_temp_setting numeric(4,1),
    passenger_temp_setting numeric(4,1),
    is_climate_on boolean,
    is_rear_defroster_on boolean,
    is_front_defroster_on boolean,
    car_id smallint NOT NULL,
    drive_id integer,
    inside_temp numeric(4,1),
    battery_heater boolean,
    battery_heater_on boolean,
    battery_heater_no_power boolean,
    est_battery_range_km numeric(6,2),
    rated_battery_range_km numeric(6,2),
    usable_battery_level smallint,
    tpms_pressure_fl numeric(4,1),
    tpms_pressure_fr numeric(4,1),
    tpms_pressure_rl numeric(4,1),
    tpms_pressure_rr numeric(4,1)
);

CREATE TABLE public.settings (
    id bigint NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    unit_of_length public.unit_of_length DEFAULT 'km'::public.unit_of_length NOT NULL,
    unit_of_temperature public.unit_of_temperature DEFAULT 'C'::public.unit_of_temperature NOT NULL,
    preferred_range public.range DEFAULT 'rated'::public.range NOT NULL,
    base_url character varying(255),
    grafana_url character varying(255),
    language text DEFAULT 'en'::text NOT NULL,
    unit_of_pressure public.unit_of_pressure DEFAULT 'bar'::public.unit_of_pressure NOT NULL,
    theme_mode text DEFAULT 'system'::text NOT NULL
);

CREATE TABLE public.states (
    id integer NOT NULL,
    state public.states_status NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    car_id smallint NOT NULL,
    CONSTRAINT positive_duration CHECK ((end_date >= start_date))
);

CREATE TABLE public.updates (
    id integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    version character varying(255),
    car_id smallint NOT NULL,
    CONSTRAINT positive_duration CHECK ((end_date >= start_date))
);

ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.car_settings ADD CONSTRAINT car_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cars ADD CONSTRAINT cars_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.charges ADD CONSTRAINT charges_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.charging_processes ADD CONSTRAINT charging_processes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.geofences ADD CONSTRAINT geofences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.positions ADD CONSTRAINT positions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.states ADD CONSTRAINT states_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.drives ADD CONSTRAINT trips_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.updates ADD CONSTRAINT updates_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX addresses_osm_id_osm_type_index ON public.addresses USING btree (osm_id, osm_type);

CREATE UNIQUE INDEX cars_eid_index ON public.cars USING btree (eid);

CREATE UNIQUE INDEX cars_settings_id_index ON public.cars USING btree (settings_id);

CREATE UNIQUE INDEX cars_vid_index ON public.cars USING btree (vid);

CREATE UNIQUE INDEX cars_vin_index ON public.cars USING btree (vin);

CREATE INDEX charges_charging_process_id_index ON public.charges USING btree (charging_process_id);

CREATE INDEX charges_date_index ON public.charges USING btree (date);

CREATE INDEX charging_processes_address_id_index ON public.charging_processes USING btree (address_id);

CREATE INDEX charging_processes_car_id_index ON public.charging_processes USING btree (car_id);

CREATE INDEX charging_processes_position_id_index ON public.charging_processes USING btree (position_id);

CREATE INDEX drives_end_geofence_id_index ON public.drives USING btree (end_geofence_id);

CREATE INDEX drives_end_position_id_index ON public.drives USING btree (end_position_id);

CREATE INDEX drives_start_geofence_id_index ON public.drives USING btree (start_geofence_id);

CREATE INDEX drives_start_position_id_index ON public.drives USING btree (start_position_id);

CREATE INDEX positions_car_id_index ON public.positions USING btree (car_id);

CREATE INDEX states_car_id_index ON public.states USING btree (car_id);

CREATE INDEX trips_car_id_index ON public.drives USING btree (car_id);

CREATE INDEX trips_end_address_id_index ON public.drives USING btree (end_address_id);

CREATE INDEX trips_start_address_id_index ON public.drives USING btree (start_address_id);

CREATE INDEX updates_car_id_index ON public.updates USING btree (car_id);

CREATE INDEX positions_car_id_date_index ON public.positions USING btree (car_id, date);

CREATE INDEX positions_drive_id_index ON public.positions USING btree (drive_id);

CREATE INDEX drives_car_id_start_date_index ON public.drives USING btree (car_id, start_date);

CREATE INDEX charging_processes_car_id_start_date_index ON public.charging_processes USING btree (car_id, start_date);

CREATE INDEX states_car_id_start_date_index ON public.states USING btree (car_id, start_date);
`;
