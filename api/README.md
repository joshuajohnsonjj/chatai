## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

[Prisma setup](https://docs.nestjs.com/recipes/prisma)

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## prisma

To make schema changes
1. make updates in `schema.prisma`
1. run `npx prisma generate` generate based on schema file
1. run `npx prisma migrate dev --name [name]`

* to apply unapplied migrations run `npx prisma migrate dev`
* to seed db run `npx prisma db seed`
* to update schema file based on current db run `npx prisma db pull` 
* to wipe db and run all migrations run `npx prisma migrate reset` 


## Heroku deploys (manual, temp)

1. add, commit
1. from root dir, `git subtree push --prefix api heroku main`
1. run new migrations (if needed)
