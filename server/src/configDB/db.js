import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // change this to your MySQL password
    database: process.env.DB_DATABASE
});

db.connect(err => {
    if (err) throw err;
    console.log('✅ MySQL Connected...');
});

const promiseDb = db.promise();

export default promiseDb;
