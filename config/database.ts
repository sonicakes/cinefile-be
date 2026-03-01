import path from 'path';

export default ({ env }) => {
  // 1. Force 'postgres' if DATABASE_URL exists, otherwise use the variable or default to sqlite
  const client = env('DATABASE_URL') ? 'postgres' : env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    // ... mysql stays the same
    postgres: {
      connection: {
        // Use the connectionString from Neon
        connectionString: env('DATABASE_URL'),
        // SSL is MANDATORY for Neon
        ssl: env.bool('DATABASE_SSL', true) && {
          rejectUnauthorized: false, // Set to false for Neon/Railway compatibility
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};