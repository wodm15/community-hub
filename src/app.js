// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import logMiddleware from './middlewares/log.middleware.js';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 3018;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api',[UsersRouter]);
app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});