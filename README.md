# Docere server

# Dev
Start the DBs (PostgreSQL, ElasticSearch)
```
$ npm run backend
```

Will run the server with `nodemon`
```
$ npm run dev
```

Will watch file changes
```
$ npm run watch
```

## Explore data
```
$ docker run --network docere_default --link docere_pg_1:db -p 8080:8080 adminer
```
