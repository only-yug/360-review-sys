# GFF Sequelize Migration
# TEST
## Set up sequelize-cli

    1. yarn add sequelize-cli -D
    2. npx sequelize-cli init
    3. Modify config.json file

## Create first model using Migrations

    1. npx sequelize-cli migration:generate --name user-model
        - This will create a new file under /migrations/timestamp_name.js
    2. npx sequelize-cli db:migrate
        - This will run the migrations

## Create Seeders

    1. npx sequelize-cli seed:generate --name demo-user
    2. Running Seeds: npx sequelize-cli db:seed:all
    3. Undoing Seeds: npx sequelize-cli db:seed:undo
    4. Run single Seeder File: npx sequelize-cli db:seed --seed my-seeder-file.js

## Change Existing Column Definition

    1. npx sequelize-cli migration:generate --name change-user-column-id
    2. Add queryInterface.changeColumn code
        - We've defined "id" column as Integer type. Not as a primary key.
        - Running this change-user-column-id migration will change "id" column's definition.
    3. Run migration: npx sequelize-cli db:migrate

## Renaming a column

    1. npx sequelize-cli migration:generate --name rename-user-columns
    2. Run migration: npx sequelize-cli db:migrate
        - This will rename column names of "first_name" and "last_name" to "firstName" and "lastName" respectively.

## UNDO

    1. npx sequelize-cli db:migrate:undo
        - This will undo latest migration. That means, "firstName" column will get renamed to "first_name" and "lastName" to "last_name". 
