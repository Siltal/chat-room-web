<template>
  <div>
    <h2>私聊</h2>
    <div 
      v-for="chat in privatechats" 
      :key="chat.chat_id" 
      @click="selectChat(chat.chat_id)" 
      class="chat-item"
    >
      <div class="avatar-container">
        <img 
          class="avatar" 
          :src="chat.other_user_avatar || 'https://via.placeholder.com/40'"
          alt="Avatar" 
          @error="onAvatarError"
        />
      </div>
      <div class="chat-info">
        <div class="user-info">
          <span class="user-name">{{ chat.other_user_name }}</span>
        </div>
        <div class="last-message">
          <p>{{ chat.last_message || '暂无消息' }}</p>
        </div>
        <div class="last-message-time">
          <span>{{ formatDate(chat.last_message_time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivateChatList',
  props: {
    privatechats: Array,
  },
  methods: {
    selectChat(chatId) {
      this.$emit('select-chat', chatId); 
    },
    onAvatarError(event) {
      event.target.src = 'default-avatar.png';
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  },
};
</script>

<style scoped>
/* 调整整个聊天项的布局 */
.chat-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* 鼠标悬停效果 */
.chat-item:hover {
  background-color: #f5f5f5;
}

/* 头像容器，固定大小 */
.avatar-container {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 头像样式，确保头像不超过容器大小 */
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* 聊天信息的容器，垂直排列 */
.chat-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* 用户名样式 */
.user-info {
  font-size: 16px;
  font-weight: bold;
}

/* 最后消息的样式 */
.last-message {
  font-size: 14px;
  color: #777;
  margin: 5px 0;
}

/* 最后消息时间样式 */
.last-message-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 5px;
}
</style>
