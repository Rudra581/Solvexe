const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'prisma+postgres://accelerate.prisma-data.net/?api_key=test' });
pool.query('SELECT NOW()').then(console.log).catch(e => console.error(e.message));
