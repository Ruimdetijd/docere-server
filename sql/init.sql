DROP DATABASE IF EXISTS docere;
CREATE DATABASE docere;

\c docere;

CREATE EXTENSION pgcrypto;

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
	created TIMESTAMP WITH TIME ZONE,
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