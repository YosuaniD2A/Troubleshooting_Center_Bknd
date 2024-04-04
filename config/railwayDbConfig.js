const mysql = require('mysql2');
require('dotenv').config()

const poolRail = mysql.createPool({
    host: process.env.DB_RW_HOST,
    user: process.env.DB_RW_USER,
    password: process.env.DB_RW_PASSWORD,
    port: process.env.DB_RW_PORT,
    database: process.env.DB_RW_DATABASE
})

module.exports = poolRail;