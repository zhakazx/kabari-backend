import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),

  DATABASE_URL: Joi.string().required(),

  REDIS_URL: Joi.string().required(),

  UPLOAD_DEST: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(10_485_760), // 10 MB
});
