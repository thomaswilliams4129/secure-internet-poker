require('dotenv').config();

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

let connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

connectionString = `postgresql://pbeisgzm:vP4migqUdJULP8w_dE2dYJK-FwYpJBBx@rajje.db.elephantsql.com:5432/pbeisgzm`;

const pool = new Pool({
    connectionString,
    ssl: false,
    connectionTimeoutMills: 100,
});

module.exports = { pool };
