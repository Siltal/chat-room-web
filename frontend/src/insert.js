// src/insert.js
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';

// 连接到 MySQL 数据库
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // 你的数据库用户名
  password: '123456',      // 你的数据库密码
  database: 'web'   // 你的数据库名称
});

// 用 bcrypt 对密码进行加密
const hashedPassword = bcrypt.hashSync('123456', 10);

// 向数据库中插入用户数据
db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword], (err, result) => {
  if (err) {
    console.error('Error inserting user:', err);
    return;
  }
  console.log('User inserted:', result);
});

// 关闭数据库连接
db.end();
