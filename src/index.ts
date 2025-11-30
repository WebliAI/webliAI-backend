import { Hono } from 'hono'
import { contextMiddleware } from './api/middlewares/context.middleware';
import { loggingMiddleware } from './api/middlewares/logging.middleware';

const app = new Hono()

app.use('*', contextMiddleware);
app.use("*", loggingMiddleware);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
