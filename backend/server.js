import express from 'express';
import mysql from 'mysql2';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import http from 'http'; // 导入 HTTP 模块
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


dotenv.config();
const app = express();
const port = process.env.port;
const jwtSecretKey = process.env.JWT_SECRET_KEY || 'default-secret-key';
app.use(cors());
app.use(express.json());
const db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});


// 中间件：验证 Token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.userId; // 将解码后的用户 ID 保存到请求对象中
    next();
  });
}


// ====================================== WEBSOKCET API ===========================================

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // 允许任何来源
    methods: ['GET', 'POST'],
  }
});

// 存储所有连接的客户端，支持同一用户多连接
const clients = {};

// Socket.io 身份验证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.userId || decoded.user_id;
    next();
  });
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`用户 ${userId} 通过 Socket.io 连接`);

  // 将 socket 添加到用户的连接列表中
  if (!clients[userId]) {
    clients[userId] = [];
  }
  clients[userId].push(socket);

  // 监听用户加入聊天房间事件
  socket.on('join_chat', ({ chatId }) => {
    socket.join(`chat_${chatId}`);
    console.log(`用户 ${userId} 加入聊天房间 chat_${chatId}`);
  });

  // 监听断开连接事件，移除 socket
  socket.on('disconnect', () => {
    console.log(`用户 ${userId} 断开 Socket.io 连接`);
    if (clients[userId]) {
      clients[userId] = clients[userId].filter(s => s !== socket);
      if (clients[userId].length === 0) {
        delete clients[userId];
      }
    }
  });

  socket.on('join_group', ({ groupId }) => {
    socket.join(`group_${groupId}`);
    console.log(`用户 ${userId} 加入群组房间 group_${groupId}`);
  });
});
// ========================================== FILE UPLOADER ========================================

const uploadDir = path.join(__dirname, 'uploads/avatars');

// 配置存储路径
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
// 文件过滤
const fileFilter = (req, file, cb) => {
  // 允许的 MIME 类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF)'), false); // 拒绝文件
  }
};
// 创建 Multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/avatars', express.static('uploads/avatars/'));


// ====================================== RESTFUL API ========================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database query error' });
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Error comparing passwords' });
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      // 生成 JWT token
      const token = jwt.sign({ userId: user.user_id, username: user.username }, jwtSecretKey, { expiresIn: '1h' });
      res.json({ token });
    });
  });
});

app.post('/api/register', upload.single('avatar'), (req, res) => {
  const { username, password, email } = req.body;
  const avatarFile = req.file;  // 头像文件信息
  console.log('Uploaded file:', req.file);
  console.log('Request body:', req.body);

  // 验证请求体中的数据
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码是必需的' });
  }

  // 检查用户名是否已存在
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {

    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ message: '数据库查询错误' });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: '用户名已被注册' });
    }

    // 使用 bcrypt 哈希密码
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('密码哈希错误:', err);
        return res.status(500).json({ message: '密码处理错误' });
      }

      // 头像文件上传成功后，将文件路径保存到数据库
      let avatarUrl = null;
      if (avatarFile) {
        // 头像路径
        avatarUrl = `avatars/${avatarFile.filename}`;
      }
      console.log(avatarUrl)

      // 将新用户插入数据库
      db.query(
        'INSERT INTO users (username, password_hash, email, avatar_url) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email, avatarUrl],
        (err, result) => {
          if (err) {
            console.error('数据库插入错误:', err);
            return res.status(500).json({ message: '用户注册失败' });
          }

          // 注册成功后生成 JWT token
          const token = jwt.sign({ userId: result.insertId, username: username }, jwtSecretKey, { expiresIn: '1h' });

          res.json({ message: '注册成功', token });
        }
      );
    });
  });
});

app.get('/api/messages', verifyToken, (req, res) => {
  const userId = req.userId;
  db.query('SELECT * FROM messages WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ message: '数据库查询错误' });
    }
    res.json({ messages: results });
  });
});


app.get('/api/posts', (req, res) => {
  const userId = req.userId;
  db.query(`
    SELECT * FROM posts p LEFT JOIN users u ON p.user_id = u.user_id ORDER BY p.post_id DESC;`, (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ message: '数据库查询错误' });
    }
    res.json({ posts: results });
  });
});

app.post('/api/posts', verifyToken, (req, res) => {
  // const userId = req.userId;
  const { content, userId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: '内容不能为空' });
  }

  const sql = 'INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, NOW())';
  db.query(sql, [userId, content], (err, result) => {
    if (err) {
      console.error('数据库插入错误:', err);
      return res.status(500).json({ message: '发布动态失败' });
    }

    // 获取新发布的动态信息，包括用户名
    const activityId = result.insertId;
    const sqlGet = `
      SELECT p.*, u.username ,u.avatar_url FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = ?
    `;
    db.query(sqlGet, [activityId], (err, results) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ message: '获取动态失败' });
      }
      res.json({ post: results[0] });
    });
  });
});

app.get('/api/verify-token', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid' });
});

app.get('/api/privatechats', verifyToken, (req, res) => {
  const userId = req.userId; // 从Token中获取用户ID

  // 查询用户参与的所有私聊（聊天记录）
  const sql = `
SELECT 
    c.chat_id, 
    IF(c.user1_id = ?, c.user2_id, c.user1_id) AS other_user_id, 
    IF(c.user1_id = ?, u2.username, u1.username) AS other_user_name, 
    IF(c.user1_id = ?, u2.avatar_url, u1.avatar_url) AS other_user_avatar, 
    m.message AS last_message,
    m.created_at AS last_message_time
FROM 
    private_chats c
JOIN 
    users u1 ON c.user1_id = u1.user_id
JOIN 
    users u2 ON c.user2_id = u2.user_id
JOIN 
    (
        SELECT 
            pm1.chat_id, 
            pm1.message, 
            pm1.created_at
        FROM 
            private_messages pm1
        INNER JOIN 
            (
                SELECT 
                    chat_id, 
                    MAX(created_at) AS latest_time
                FROM 
                    private_messages
                GROUP BY 
                    chat_id
            ) pm2 
            ON pm1.chat_id = pm2.chat_id 
            AND pm1.created_at = pm2.latest_time
    ) m 
    ON c.chat_id = m.chat_id
WHERE 
    (c.user1_id = ? OR c.user2_id = ?)
ORDER BY 
    m.created_at DESC;


  `;

  db.query(sql, [userId, userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ message: '获取私聊列表失败' });
    }

    // 返回用户参与的私聊列表
    res.json({ privatechats: results });
  });
});


// 获取特定私聊的所有消息
app.get('/api/private_chats/:chatId', verifyToken, (req, res) => {
  const userId = req.userId;
  const chatId = req.params.chatId;


  const sql = `
  SELECT
  m.message_id,
  m.sender_id,
  m.receiver_id,
  m.message,
  m.created_at,
  usender.avatar_url AS sender_avatar,  -- 发送者头像
  ureceiver.avatar_url AS receiver_avatar, -- 接收者头像
  usender.username AS sender_username,  -- 发送者昵称
  ureceiver.username AS receiver_username -- 接收者昵称
FROM
  private_messages m
LEFT JOIN
  users usender ON m.sender_id = usender.user_id  -- 连接发送者
LEFT JOIN
  users ureceiver ON m.receiver_id = ureceiver.user_id  -- 连接接收者
WHERE
  m.chat_id = ?
ORDER BY
  m.created_at ASC;
  `;

  db.query(sql, [chatId], (err, results) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ message: '获取消息失败' });
    }

    // 如果没有找到消息，则返回空数组
    if (results.length === 0) {
      return res.json({ messages: [] });
    }

    res.json({ messages: results });
  });
});

// POST 路由：发送新消息
app.post('/api/private_chats/:chatId/messages', verifyToken, (req, res) => {
  const userId = req.userId;
  const chatId = req.params.chatId;
  const { message } = req.body;

  // 验证消息内容是否为空
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: '消息内容不能为空' });
  }

  // 查询私聊会话，验证当前用户是否为参与者之一
  const chatQuery = 'SELECT user1_id, user2_id FROM private_chats WHERE chat_id = ?';
  db.query(chatQuery, [chatId], (err, chatResults) => {
    if (err) {
      console.error('查询聊天会话失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (chatResults.length === 0) {
      return res.status(404).json({ error: '聊天会话不存在' });
    }

    const { user1_id, user2_id } = chatResults[0];

    // 验证当前用户是否是聊天会话的参与者
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ error: '您没有权限发送消息到此聊天会话' });
    }

    // 确定接收者 ID（当前用户的对方）
    const receiver_id = userId === user1_id ? user2_id : user1_id;

    // 手动生成 created_at
    const created_at = new Date();

    // 插入新消息到 private_messages 表
    const insertMessageQuery = `
      INSERT INTO private_messages (chat_id, sender_id, receiver_id, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertMessageQuery, [chatId, userId, receiver_id, message, created_at], (err, insertResult) => {
      if (err) {
        console.error('插入消息失败:', err);
        return res.status(500).json({ error: '发送消息失败，请稍后再试' });
      }

      const message_id = insertResult.insertId;

      // 获取发送者和接收者的头像
      const usersQuery = `
        SELECT user_id, avatar_url 
        FROM users 
        WHERE user_id IN (?, ?)
      `;
      db.query(usersQuery, [userId, receiver_id], (err, userResults) => {
        if (err) {
          console.error('查询用户信息失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        if (userResults.length < 2) {
          console.error('用户信息不足');
          return res.status(500).json({ error: '服务器错误' });
        }

        let sender_avatar = '';
        let receiver_avatar = '';

        userResults.forEach(user => {
          if (user.user_id === userId) {
            sender_avatar = user.avatar_url || 'https://via.placeholder.com/40';
          } else if (user.user_id === receiver_id) {
            receiver_avatar = user.avatar_url || 'https://via.placeholder.com/40';
          }
        });

        // 构建返回的消息对象
        const newMessage = {
          chat_id: chatId,
          message_id: message_id,
          sender_id: userId,
          receiver_id: receiver_id,
          message: message,
          created_at: created_at.toISOString(),
          sender_avatar: sender_avatar,
          receiver_avatar: receiver_avatar
        };

        // 通过 Socket.io 向聊天房间内的所有用户发送新消息
        io.to(`chat_${chatId}`).emit('new_message', newMessage);

        // 返回新创建的消息
        res.status(200).send();
      });
    });
  });
});

// 搜索用户接口
app.get('/api/search', verifyToken, (req, res) => {
  const userId = req.userId;
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: '查询参数不能为空' });
  }

  const searchQuery = `
    SELECT user_id, username, avatar_url
    FROM users
    WHERE username LIKE ? AND user_id != ? AND user_id NOT IN (
      SELECT IF(user1_id = ?, user2_id, user1_id)
      FROM private_chats
      WHERE user1_id = ? OR user2_id = ?
    )
  `;
  const searchTerm = `%${query}%`;

  db.query(searchQuery, [searchTerm, userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error('搜索用户失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    res.json({ users: results });
  });
});

app.get('/api/groupchats', verifyToken, (req, res) => {
  const userId = req.userId;

  // SQL 查询以获取用户所属的群组
  const sql = `
select *
from group_members as gm
         left join \`groups\` as g on gm.group_id = g.group_id
where gm.user_id = ?
    ORDER BY 
      g.created_at DESC
  `;

  // 执行查询
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('查询群组失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }

    // 返回获取的群组
    res.json({ groups: results });
  });
});


// 查询联系人接口
/* 只要私聊表中user1_id  user2_id 有自己的id 那么就把 另一个的用户名和头像返回 （多个）*/
app.get('/api/contacts', verifyToken, (req, res) => {
  const userId = req.userId;

  // 不需要检查query参数，因为这是一个获取联系人接口，不是搜索
  // 如果有需要，可以保留相关逻辑

  const sql = `
    SELECT DISTINCT u.user_id, u.username, u.avatar_url
    FROM private_chats pc
    JOIN users u ON (
      (pc.user1_id = ? AND u.user_id = pc.user2_id) OR
      (pc.user2_id = ? AND u.user_id = pc.user1_id)
    )
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      console.error('查询联系人失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    res.json({ users: results });
  });
});


// 发送消息并创建私聊记录接口
app.post('/api/initContact', verifyToken, (req, res) => {
  const senderId = req.userId;
  const { receiver_id, message } = req.body;

  // 验证请求参数
  if (!receiver_id || !message || message.trim() === '') {
    return res.status(400).json({ error: '接收者ID和消息内容不能为空' });
  }

  // 检查是否已存在私聊
  const checkChatQuery = `
    SELECT chat_id 
    FROM private_chats 
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    LIMIT 1
  `;
  db.query(checkChatQuery, [senderId, receiver_id, receiver_id, senderId], (err, chatResults) => {
    if (err) {
      console.error('查询私聊会话失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (chatResults.length > 0) {
      // 私聊已存在，使用现有的 chat_id
      const chatId = chatResults[0].chat_id;
      sendMessage(chatId);
    } else {
      // 私聊不存在，创建新的私聊会话
      const createChatQuery = `
        INSERT INTO private_chats (user1_id, user2_id, created_at)
        VALUES (?, ?, NOW())
      `;
      db.query(createChatQuery, [senderId, receiver_id], (err, insertChatResult) => {
        if (err) {
          console.error('创建私聊会话失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        const newChatId = insertChatResult.insertId;
        sendMessage(newChatId);
      });
    }
  });

  // 函数：发送消息
  function sendMessage(chatId) {
    // 手动生成 created_at
    const created_at = new Date();

    // 插入新消息
    const insertMessageQuery = `
      INSERT INTO private_messages (chat_id, sender_id, receiver_id, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertMessageQuery, [chatId, senderId, receiver_id, message, created_at], (err, insertResult) => {
      if (err) {
        console.error('插入消息失败:', err);
        return res.status(500).json({ error: '发送消息失败，请稍后再试' });
      }

      const message_id = insertResult.insertId;

      // 获取发送者和接收者的头像
      const usersQuery = `
        SELECT user_id, avatar_url 
        FROM users 
        WHERE user_id IN (?, ?)
      `;
      db.query(usersQuery, [senderId, receiver_id], (err, userResults) => {
        if (err) {
          console.error('查询用户信息失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        if (userResults.length < 2) {
          console.error('用户信息不足');
          return res.status(500).json({ error: '服务器错误' });
        }

        let sender_avatar = '';
        let receiver_avatar = '';

        userResults.forEach(user => {
          if (user.user_id === senderId) {
            sender_avatar = user.avatar_url || 'https://via.placeholder.com/40';
          } else if (user.user_id === receiver_id) {
            receiver_avatar = user.avatar_url || 'https://via.placeholder.com/40';
          }
        });

        // 构建返回的消息对象
        const newMessage = {
          chat_id: chatId,
          message_id: message_id,
          sender_id: senderId,
          receiver_id: receiver_id,
          message: message,
          created_at: created_at.toISOString(),
          sender_avatar: sender_avatar,
          receiver_avatar: receiver_avatar
        };

        // 通过 Socket.io 向聊天房间内的所有用户发送新消息
        io.to(`chat_${chatId}`).emit('new_message', newMessage);

        // 返回新创建的消息
        res.status(201).json(newMessage);
      });
    });
  }
});

// 
app.post('/api/initGroup', verifyToken, (req, res) => {
  const creatorId = req.userId; 
  const { group_name, group_description, group_members } = req.body;

  // 检查群名是否为空
  if (!group_name || group_name.trim() === '') {
    return res.status(400).json({ error: '群聊名称不能为空' });
  }

  const groupDescValue = group_description && group_description.trim() !== '' 
    ? group_description.trim() 
    : null;

  const insertGroupQuery = `
    INSERT INTO \`groups\` (group_name, group_description, created_by)
    VALUES (?, ?, ?)
  `;

  // 插入群信息
  db.query(insertGroupQuery, [group_name.trim(), groupDescValue, creatorId], (err, groupResult) => {
    if (err) {
      console.error('创建群聊失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    const groupId = groupResult.insertId;

    // 准备成员列表：包括创建者和传入的其他成员（如有）
    const memberList = Array.isArray(group_members) ? group_members : [];
    // 将创建者加入成员列表
    if (!memberList.includes(creatorId)) {
      memberList.unshift(creatorId);
    }

    // 如果没有成员需要插入，则直接返回成功（不太常见，但为健壮性预留）
    if (memberList.length === 0) {
      return res.json({ success: true, message: '群聊创建成功，但无成员加入', group_id: groupId });
    }

    // 批量插入成员
    // 注意：批量插入的语法为: INSERT INTO table (col1,col2) VALUES ?, ? 
    // 在node-mysql中，需要将参数放在数组中，如[[groupId, memberId1], [groupId, memberId2], ...]
    const memberValues = memberList.map(userId => [groupId, userId]);
    const insertMemberQuery = `
      INSERT INTO group_members (group_id, user_id) VALUES ?
    `;
    db.query(insertMemberQuery, [memberValues], (mErr) => {
      if (mErr) {
        console.error('添加群成员失败:', mErr);
        return res.status(500).json({ error: '服务器错误' });
      }

      return res.json({ 
        success: true,
        message: '群聊创建并加入成功',
        group_id: groupId,
        members: memberList 
      });
    });
  });
});

// 获取特定群组的所有消息
app.get('/api/groups/:groupId', verifyToken, (req, res) => {
  const userId = req.userId;
  const groupId = req.params.groupId;

  // 检查当前用户是否是群成员
  const memberCheckQuery = 'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1';
  db.query(memberCheckQuery, [groupId, userId], (err, memberResults) => {
    if (err) {
      console.error('查询群成员失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (memberResults.length === 0) {
      return res.status(403).json({ error: '您不是该群的成员，无法查看群消息' });
    }

    // 查询群消息及发送者信息
    const sql = `
      SELECT
        gm.message_id,
        gm.group_id,
        gm.sender_id,
        gm.message,
        gm.created_at,
        u.avatar_url AS sender_avatar,
        u.username AS sender_username
      FROM group_messages gm
      LEFT JOIN users u ON gm.sender_id = u.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at ASC
    `;

    db.query(sql, [groupId], (err, results) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ message: '获取群消息失败' });
      }

      if (results.length === 0) {
        return res.json({ messages: [] });
      }

      res.json({ messages: results });
    });
  });
});


// 发送新群组消息
app.post('/api/groups/:groupId/messages', verifyToken, (req, res) => {
  const userId = req.userId;
  const groupId = req.params.groupId;
  const { message } = req.body;

  // 验证消息内容
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: '消息内容不能为空' });
  }

  // 检查当前用户是否是该群成员
  const memberCheckQuery = 'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1';
  db.query(memberCheckQuery, [groupId, userId], (err, memberResults) => {
    if (err) {
      console.error('查询群成员失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (memberResults.length === 0) {
      return res.status(403).json({ error: '您不是该群的成员，无法发送消息' });
    }

    // 插入新消息
    const created_at = new Date();
    const insertMessageQuery = `
      INSERT INTO group_messages (group_id, sender_id, message, created_at)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertMessageQuery, [groupId, userId, message, created_at], (err, insertResult) => {
      if (err) {
        console.error('插入群消息失败:', err);
        return res.status(500).json({ error: '发送消息失败，请稍后再试' });
      }

      const message_id = insertResult.insertId;

      // 查询发送者信息（头像、昵称）
      const senderQuery = `
        SELECT user_id, avatar_url, username
        FROM users
        WHERE user_id = ?
      `;
      db.query(senderQuery, [userId], (err, senderResults) => {
        if (err) {
          console.error('查询用户信息失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        if (senderResults.length === 0) {
          console.error('未找到发送者用户信息');
          return res.status(500).json({ error: '服务器错误' });
        }

        const sender = senderResults[0];
        const sender_avatar = sender.avatar_url || 'https://via.placeholder.com/40';
        const sender_username = sender.username || '未知用户';

        // 构建返回的消息对象
        const newMessage = {
          message_id: message_id,
          group_id: groupId,
          sender_id: userId,
          message: message,
          created_at: created_at.toISOString(),
          sender_avatar: sender_avatar,
          sender_username: sender_username
        };

        // 通过 Socket.io 向该群内的所有用户发送新消息
        io.to(`group_${groupId}`).emit('new_group_message', newMessage);


        // 返回新创建的消息
        return res.status(200).send();
      });
    });
  });
});



// 启动 HTTP 服务器（同时支持 Express 和 Socket.io）
httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});