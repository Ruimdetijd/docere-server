# Docere server

# Dev
Start the DBs (PostgreSQL, ElasticSearch)
$ npm run start:backend

Will run the server with `nodemon`
$ npm run start:dev

Will watch file changes
$ npm run watch

## Explore data
$ docker run --network docere_default --link docere_pg_1:db -p 8080:8080 adminer

## Create deep zoom images
$ cd public/facsimile/<project-slug>
$ docker run --rm -ti -v $PWD:/data argu/alpine-vips /bin/sh
$ for f in /data/**/*.jpg; do vips dzsave "$f" "$(dirname $f)/$(basename $f .jpg)"; echo "$f"; done;
