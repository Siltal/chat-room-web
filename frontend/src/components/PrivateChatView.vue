<template>
  <div class="chat-container">
    <div class="header">
      <button @click="goBack" class="back-button">&lt;</button>
      <h3>正在与 {{ chatInfo.other_user_name || '加载中...' }} 聊天</h3>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="messages-container" ref="messagesContainer">
      <MessageItem v-for="message in messages" :key="message.message_id" :message="message"
        :current-user-id="currentUserId" />
    </div>

    <div class="input-container">
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="输入消息" class="message-input" />
      <button @click="sendMessage" class="send-button">发送</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode'; // 使用默认导入
import MessageItem from './MessageItem.vue'; // 导入 MessageItem 组件

export default {
  name: 'PrivateChatView',
  components: {
    MessageItem, // 注册组件
  },
  props: {
    chatId: {
      type: Number, // 根据您的后端定义的类型调整
      required: true
    },
  },
  data() {
    return {
      chatInfo: { other_user_name: '' }, // 初始化 other_user_name
      messages: [],
      newMessage: '',
      currentUserId: null, // 初始为 null，稍后通过解码 JWT 设置
      username: '',
      error: null, // 用于显示错误消息
      socket: null, // Socket.io 客户端实例
    };
  },
  watch: {
    // 监听 chatId 的变化，重新加载聊天信息
    chatId(newChatId) {
      this.fetchMessages(newChatId);
      this.joinChatRoom(newChatId);
    }
  },
  created() {
    // 组件创建时解码 JWT 并加载当前用户信息
    this.initializeUser();
  },
  mounted() {
    if (this.currentUserId) {
      this.initializeSocket();
      this.fetchMessages(this.chatId);
      this.joinChatRoom(this.chatId);
    }
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    initializeUser() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          this.username = decodedToken.username || '';
          this.currentUserId = decodedToken.userId || decodedToken.user_id || null; // 根据您的 JWT 结构调整字段名
          // console.log('当前用户ID:', this.currentUserId);
          // console.log('当前用户名:', this.username);
        } catch (error) {
          console.error('解析令牌失败', error);
          this.error = '无法解析用户信息，请重新登录。';
        }
      } else {
        this.error = '未找到认证令牌，请登录。';
      }
    },
    initializeSocket() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.error = '未找到认证令牌，请登录。';
        return;
      }

      // 连接到 Socket.io 服务器，传递 Token 进行身份验证
      this.socket = io(`/`, {
        auth: {
          token: token, // 通过 auth 选项传递 Token
        },
        transports: ['websocket'], // 强制使用 WebSocket，避免轮询问题
      });

      // 当连接成功时，加入聊天房间
      this.socket.on('connect', () => {
        console.log('已连接到 Socket.io 服务器');
        this.joinChatRoom(this.chatId);
      });

      // 监听新消息事件
      this.socket.on('new_message', (message) => {
        // console.log(message.chat_id);
        // console.log(this.chatId);

        if (message.chat_id == this.chatId) { // 确保消息属于当前聊天会话
          this.messages.push(message);
          this.scrollToBottom();
        }
      });

      // 处理断开连接
      this.socket.on('disconnect', () => {
        console.log('与 Socket.io 服务器断开连接');
      });

      // 处理连接错误
      this.socket.on('connect_error', (err) => {
        console.error('Socket.io 连接错误:', err);
        this.error = '无法连接到实时消息服务。';
      });
    },
    joinChatRoom(chatId) {
      if (this.socket && this.socket.connected) {
        this.socket.emit('join_chat', { chatId });
        console.log(`已加入聊天房间: ${chatId}`);
      }
    },
    goBack() {
      // 触发自定义事件，父组件接收到后进行处理
      this.$emit('back-to-chats');
    },
    async fetchMessages(chatId) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/private_chats/${chatId}`, {
          headers: {
            Authorization: `${token}`,  // 不需要 Bearer
          },
        });
        this.messages = response.data.messages;
        // console.log(this.messages);


        // 提取聊天对象的姓名
        if (this.messages.length > 0) {
          const firstMessage = this.messages[0];

          this.chatInfo.other_user_name = firstMessage.sender_id == this.currentUserId
            ? firstMessage.receiver_username
            : firstMessage.sender_username;
        } else {
          this.chatInfo.other_user_name = '未知用户';
        }

        this.error = null; // 重置错误

        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('获取消息失败', error);
        this.error = '无法加载消息，请稍后重试。';
      }
    },
    async sendMessage() {
      if (!this.newMessage.trim()) return;

      try {

        const token = localStorage.getItem('auth_token');
        const response = await axios.post(`/api/private_chats/${this.chatId}/messages`, {
          message: this.newMessage,
        }, {
          headers: {
            Authorization: `${token}`, // 不需要 Bearer
          },
        });
        this.error = null; // 重置错误

        // 自动滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
        this.newMessage = ''; // 清空输入框

      } catch (error) {
        console.error('发送消息失败', error);
        this.error = '发送消息失败，请稍后重试。';
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  },
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 填满父组件的空间 */
  width: 100%;
  /* 可选，根据需要 */
}

.header {
  flex: 0 0 auto;
  /* 固定高度 */
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.back-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.error-message {
  color: red;
  text-align: center;
  margin: 10px 0;
  flex: 0 0 auto;
  /* 固定高度 */
}

.messages-container {
  flex: 1 1 auto;
  /* 占据所有剩余空间 */
  overflow-y: auto;
  /* 支持垂直滚动 */
  padding: 10px;
  background-color: #f9f9f9;
}

.input-container {
  flex: 0 0 auto;
  /* 固定高度 */
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #ccc;
}

.message-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 20px;
  margin-right: 10px;
}

.send-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #45a049;
}
</style>
