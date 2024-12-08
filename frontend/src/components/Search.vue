<template>
  <div class="search-container">
    <div class="search-header">
      <h2>搜索用户</h2>
    </div>
    
    <div v-if="error" class="search-error-message">
      {{ error }}
    </div>
    
    <div class="users-input-container">
      <input 
        v-model="searchQuery" 
        @keyup.enter="searchUsers" 
        placeholder="输入用户名" 
        class="users-input"
      />
      <button @click="searchUsers" class="users-send-button">搜索</button>
    </div>
    
    <div class="users-list-container">
      <ul>
        <li v-for="user in users" :key="user.user_id" class="user-item">
          <img :src="user.avatar_url || defaultAvatar" alt="头像" class="user-avatar" />
          <span class="user-name">{{ user.username }}</span>
          <button @click="addUser(user.user_id)" class="user-add-button">添加</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SearchUsers',
  data() {
    return {
      searchQuery: '',
      users: [],
      error: null,
      defaultAvatar: 'https://via.placeholder.com/40',
    };
  },
  methods: {
    async searchUsers() {
      if (!this.searchQuery.trim()) {
        this.error = '请输入搜索关键词';
        this.users = [];
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`/api/search`, {
          params: { q: this.searchQuery },
          headers: {
            Authorization: `${token}`,
          },
        });
        this.users = response.data.users;
        // console.log(this.users);
        
        if (response.data.users.length==0){
          this.error = '无此用户，或已经是你的好友';  
        }
      } catch (error) {
        console.error('搜索用户失败:', error);
        this.error = '搜索用户失败，请稍后再试。';
      }
    },
    async addUser(receiver_id) {
      const initialMessage = '我们已经是好友了，一起来聊天吧！';

      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`/api/initContact`, {
          receiver_id: receiver_id,
          message: initialMessage,
        }, {
          headers: {
            Authorization: `${token}`,
          },
        });

        // 假设 API 返回的数据包含 chat_id
        const newChatId = response.data.chat_id;

        // 触发事件，将 newChatId 传递给父组件
        this.$emit('chatCreated', newChatId);

      } catch (error) {
        console.error('添加用户失败:', error);
        this.error = '添加用户失败，请稍后再试。';
      }
    },
    goBack() {
      // 返回到上一页或其他逻辑
      this.$router.back();
    },
  },
};
</script>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 填满父组件的空间 */
  width: 100%; /* 可选，根据需要 */
}

.search-header {
  flex: 0 0 auto; /* 固定高度 */
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}

.search-back-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.search-error-message {
  color: rgb(0, 0, 0);
  text-align: center;
  margin: 10px 0;
  flex: 0 0 auto; /* 固定高度 */
}

.users-list-container {
  flex: 1 1 auto; /* 占据所有剩余空间 */
  overflow-y: auto; /* 支持垂直滚动 */
  padding: 10px;
  background-color: #ffffff;
}

.users-input-container {
  flex: 0 0 auto; /* 固定高度 */
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #ccc;
}

.users-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 20px;
  margin-right: 10px;
}

.users-send-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.users-send-button:hover {
  background-color: #45a049;
}

/* 用户列表项样式 */
.user-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
}

.user-name {
  flex: 1;
}

.user-add-button {
  padding: 5px 10px;
  background-color: #008CBA;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.user-add-button:hover {
  background-color: #007B9E;
}
</style>
