/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { name: 'GTAMarket API', version: '0.0.1', author: 'MrDrawn (Felipe Gusmão)' }
})

Route.group(() => {
  Route.post('/login', 'AuthController.login')
}).prefix('auth')

Route.group(() => {
  Route.get('/', 'UsersController.all').middleware(['Auth'])
  Route.get('/me', 'UsersController.me').middleware(['Auth'])
  Route.post('/create', 'UsersController.create')
  Route.get('/verify/:token', 'UsersController.verify')
  Route.post('/recovery', 'UsersController.recovery')
  Route.post('/reset/:token', 'UsersController.reset')
  Route.post('/update', 'UsersController.update').middleware(['Auth'])
  Route.delete('/delete/:id', 'UsersController.delete').middleware(['Auth'])
}).prefix('users')
