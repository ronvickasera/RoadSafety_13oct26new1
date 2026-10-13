CREATE DATABASE road_safety;

-- Connect to road_safety before running the remaining statements.
-- In psql:
-- \c road_safety

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SURVEYOR','OFFICER','ADMIN')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY,
    surveyor_id INTEGER NOT NULL REFERENCES users(id),
    zone_name VARCHAR(150) NOT NULL,
    circle_name VARCHAR(150) NOT NULL,
    ward_name VARCHAR(150) NOT NULL,
    road_name VARCHAR(255),
    road_issue TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geom geometry(Point, 4326) NOT NULL,
    remarks TEXT,
    photo_data BYTEA,
    photo_mime_type VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED','REJECTED','OFFICER_APPROVED')),
    officer_id INTEGER REFERENCES users(id),
    officer_comments TEXT,
    officer_action_date TIMESTAMP,
    survey_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_history (
    id SERIAL PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    comments TEXT,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B  ---not working , correct below this

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_surveyor ON surveys(surveyor_id);
CREATE INDEX IF NOT EXISTS idx_surveys_geom ON surveys USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone);

-- Optional: create an automatically updated timestamp trigger.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS surveys_updated_at ON surveys;
CREATE TRIGGER surveys_updated_at
BEFORE UPDATE ON surveys
FOR EACH ROW EXECUTE FUNCTION set_updated_at();




-- C--- new -- use this one

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_phone
    ON users(phone);

CREATE INDEX IF NOT EXISTS idx_surveys_status
    ON surveys(status);

CREATE INDEX IF NOT EXISTS idx_surveys_surveyor
    ON surveys(surveyor_id);

CREATE INDEX IF NOT EXISTS idx_surveys_geom
    ON surveys USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_otp_phone
    ON otp_verifications(phone);


-- ============================================================
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


-- ============================================================
-- USERS UPDATED_AT TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS users_updated_at ON users;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- SURVEYS UPDATED_AT TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS surveys_updated_at ON surveys;

CREATE TRIGGER surveys_updated_at
BEFORE UPDATE ON surveys
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- D --Adding new fields in surveys table

ALTER TABLE public.surveys
ADD COLUMN IF NOT EXISTS length double precision,
ADD COLUMN IF NOT EXISTS width double precision,
ADD COLUMN IF NOT EXISTS depth double precision,
ADD COLUMN IF NOT EXISTS volume double precision,
ADD COLUMN IF NOT EXISTS road_type character varying(50),
ADD COLUMN IF NOT EXISTS rate double precision,
ADD COLUMN IF NOT EXISTS estimated_cost double precision;

-- validation

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_length_check
CHECK (length IS NULL OR length > 0);

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_width_check
CHECK (width IS NULL OR width > 0);

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_depth_check
CHECK (depth IS NULL OR depth > 0);

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_volume_check
CHECK (volume IS NULL OR volume >= 0);

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_rate_check
CHECK (rate IS NULL OR rate >= 0);

ALTER TABLE public.surveys
ADD CONSTRAINT surveys_estimated_cost_check
CHECK (estimated_cost IS NULL OR estimated_cost >= 0);




