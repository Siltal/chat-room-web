<template>
  <div :class="messageClasses">
    <img :src="(message.sender_avatar) || defaultAvatar" alt="头像" class="avatar" />
    <div class="message-content">
      <div class="message-header">
        <span class="nickname">{{ message.sender_name }}</span>
        <span class="timestamp">{{ formattedTime }}</span>
      </div>
      <div class="message-text">
        {{ message.message }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true,
    },
    currentUserId: {
      type: Number,
      required: true,
    },
  },
  computed: {
    isSender() {
      return this.message.sender_id == this.currentUserId
    },
    messageClasses() {
      return {
        'message-item': true,
        'message-sender': this.isSender,
        'message-receiver': !this.isSender,
      };
    },
    formattedTime() {
      // 格式化发送时间，例如：'12:30 PM'
      const date = new Date(this.message.created_at);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    defaultAvatar() {
      // 默认头像的 URL，可以根据需要更改
      return 'https://via.placeholder.com/40';
    },
  },
};
</script>
<style scoped>
.message-item {
  display: flex;
  margin: 10px 0;
  align-items: flex-start;
}

.message-sender {
  flex-direction: row-reverse; /* 发送者的消息在右边 */
}

.message-receiver {
  flex-direction: row; /* 接收者的消息在左边 */
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 10px;
}

.message-content {
  max-width: 70%;
  background-color: #f1f0f0;
  padding: 10px;
  border-radius: 10px;
  position: relative;
}

.message-sender .message-content {
  background-color: #dcf8c6; /* 发送者的消息颜色 */
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.nickname {
  font-weight: bold;
}

.timestamp {
  font-size: 0.8em;
  color: #999;
}

.message-text {
  word-wrap: break-word;
}
</style>
