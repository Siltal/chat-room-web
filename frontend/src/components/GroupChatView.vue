<template>
  <div class="chat-container">
    <div class="header">
      <button @click="goBack" class="back-button">&lt;</button>
      <h3>群组：{{ groupName || '加载中...' }}</h3>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="messages-container" ref="messagesContainer">
      <MessageItem 
        v-for="message in messages" 
        :key="message.message_id" 
        :message="message"
        :current-user-id="currentUserId" 
        is-group="true"  
      />
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
import {jwtDecode} from 'jwt-decode'; // 确保导入方式正确
import MessageItem from './MessageItem.vue'; // 导入消息组件

export default {
  name: 'GroupChatView',
  components: {
    MessageItem,
  },
  props: {
    groupId: {
      type: Number,
      required: true
    },
    groupName: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      groupInfo: { group_name: '' }, 
      messages: [],
      newMessage: '',
      currentUserId: null,
      username: '',
      error: null,
      socket: null,
    };
  },
  watch: {
    // 监听 groupId 变化，重新加载群聊信息
    groupId(newGroupId) {
      this.fetchMessages(newGroupId);
      this.joinGroupRoom(newGroupId);
    }
  },
  created() {
    this.initializeUser();
  },
  mounted() {
    if (this.currentUserId) {
      this.initializeSocket();
      this.fetchMessages(this.groupId);
      this.joinGroupRoom(this.groupId);
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
          this.currentUserId = decodedToken.userId || decodedToken.user_id || null; 
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

      this.socket = io(`/`, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('已连接到 Socket.io 服务器');
        this.joinGroupRoom(this.groupId);
      });

      // 接收新群消息事件
      this.socket.on('new_group_message', (message) => {
        if (message.group_id == this.groupId) {
          this.messages.push(message);
          this.scrollToBottom();
        }
      });

      this.socket.on('disconnect', () => {
        console.log('与 Socket.io 服务器断开连接');
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket.io 连接错误:', err);
        this.error = '无法连接到实时消息服务。';
      });
    },
    joinGroupRoom(groupId) {
      if (this.socket && this.socket.connected) {
        this.socket.emit('join_group', { groupId });
        console.log(`已加入群组房间: ${groupId}`);
      }
    },
    goBack() {
      this.$emit('back-to-group-list');
    },
    async fetchMessages(groupId) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/groups/${groupId}`, {
          headers: {
            Authorization: `${token}`,
          },
        });
        this.messages = response.data.messages;

        // 从第一条消息中推断群名（若后台消息包含group_name信息）
        // 如果后端没返回群名，可单独调用获取群信息的API
        if (this.messages.length > 0) {
          // 假设message里有sender_username，或者需另外接口获得群名
          // 这里简单示例，从返回数据获取group_name字段，如无请根据实际情况修改
          // 例如：this.groupInfo.group_name = this.messages[0].group_name || '未知群组';
          // 如果接口中未返回group_name，需要额外的API获取群信息
          this.groupInfo.group_name = this.messages[0].group_name || '群聊';
        } else {
          this.groupInfo.group_name = '群聊';
        }

        this.error = null;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('获取群消息失败', error);
        this.error = '无法加载群消息，请稍后重试。';
      }
    },
    async sendMessage() {
      if (!this.newMessage.trim()) return;

      try {
        const token = localStorage.getItem('auth_token');
        await axios.post(`/api/groups/${this.groupId}/messages`, {
          message: this.newMessage,
        }, {
          headers: {
            Authorization: `${token}`,
          },
        });

        this.error = null;
        this.newMessage = ''; 
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('发送群消息失败', error);
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
  width: 100%;
}

.header {
  flex: 0 0 auto;
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
}

.messages-container {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9; 
}
.input-container {
  flex: 0 0 auto;
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
