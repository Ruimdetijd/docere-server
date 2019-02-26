DROP DATABASE IF EXISTS docere;
CREATE DATABASE docere;

\c docere;

CREATE EXTENSION pgcrypto;

CREATE TYPE es_data_type AS ENUM ('text', 'keyword', 'date', 'boolean', 'integer', 'geo_point', 'null');

CREATE TYPE entry_data_type AS ENUM ('meta', 'text');

CREATE TABLE project (
	id SERIAL PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	title TEXT,
	files TEXT[],
	description TEXT,
	splitter TEXT,
	extractors JSON,
	metadata_extractor TEXT,
	facsimile_extractor TEXT,
	created TIMESTAMP WITH TIME ZONE,
	updated TIMESTAMP WITH TIME ZONE
);

CREATE TABLE metadata (
	id SERIAL PRIMARY KEY,
	project_id SERIAL REFERENCES project,
	slug TEXT NOT NULL,
	title TEXT NOT NULL,
	sortorder SMALLINT NOT NULL,
	aside BOOLEAN NOT NULL DEFAULT true,
	es_data_type es_data_type NOT NULL DEFAULT 'keyword',
	type entry_data_type NOT NULL DEFAULT 'meta',
	created TIMESTAMP WITH TIME ZONE NOT NULL,
	updated TIMESTAMP WITH TIME ZONE
);

CREATE TABLE docere_user (
	id SERIAL PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	created TIMESTAMP WITH TIME ZONE,
	updated TIMESTAMP WITH TIME ZONE
);

CREATE TABLE project__user (
	project_id SERIAL REFERENCES project,
	user_id SERIAL REFERENCES docere_user,
	PRIMARY KEY (project_id, user_id)
);
