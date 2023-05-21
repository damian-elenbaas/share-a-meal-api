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

This Share A Meal has a few endpoints:

**Login**
- `[POST] /api/login` to login and get a JWT token

**Users**
- `[POST] /api/user` to create a new user
- `[GET] /api/user` to get all users
- `[GET] /api/user/:userId` to get user by id 
- `[PUT] /api/user/:userId` to update user
- `[DELETE] /api/user/:userId` to delete user by id
- `[GET] /api/user/profile` to get your own profile

**Meals**

