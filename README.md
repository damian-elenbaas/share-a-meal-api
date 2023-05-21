# Share A Meal API 

An API server written in JavaScript using the Express JS framework

With this API you can share meals with people to prevent foodwaste! 

## Installation

1. Clone this repository
2. Open the folder in your terminal
3. Run `npm install` to install all the dependencies
4. Specifiy your database credentials in your enviroment variables
   - `DB_HOST`: Ip address of your database
   - `DB_USER`: User name of your database
   - `DB_PASSWORD`: Password of your database user
   - `DB_PORT`: Port of your database
6. Run the `share-a-meal.sql` script on your database
7. (Optional) Define `PORT` in your enviroment variables where your server should be running on
8. Run npm dev 

## Usage

This Share A Meal API has a few endpoints:

**Login**
- `[POST] /api/login` to login and get a JWT token

**Users**
- `[POST] /api/user` to create a new user
- `[GET] /api/user` to get all users *(JWT required)*
- `[GET] /api/user/:userId` to get user by id *(JWT required)*
- `[PUT] /api/user/:userId` to update user *(JWT required)*
- `[DELETE] /api/user/:userId` to delete user by id *(JWT required)*
- `[GET] /api/user/profile` to get your own profile *(JWT required)*

**Meals**
- `[POST] /api/meal` to add a meal *(JWT required)*
- `[GET] /api/meal` to get all meals, with `GET` parameters you can filter on existing fields 
- `[GET] /api/meal/:mealId` to get a meal by id
- `[PUT] /api/meal/:mealId` to update meal *(JWT required)*
- `[DELETE] /api/meal/:mealId` to delete meal *(JWT required)*

**Participations**
- `[POST] /api/meal/:mealId/participate` to participate on a meal *(JWT required)*
- `[DELETE] /api/meal/:mealId/participate` to remove participation on a meal *(JWT required)*
- `[GET] /api/meal/:mealId/participants` to get all participants of a meal *(JWT required)*
- `[GET] /api/meal/:mealId/participants/:participantId` to get details of a specific participant *(JWT required)*
