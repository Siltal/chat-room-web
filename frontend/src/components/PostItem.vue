<template>
  <div class="post-item">
    <div class="header">
      <div class="user-info">
        <img 
        class="avatar" 
        :src="post.avatar_url || 'https://via.placeholder.com/40'" 
        alt="Avatar" 
        @error="onAvatarError" 
      />
      <strong class="username">{{ post.username }}</strong>
      </div>

      <span class="timestamp">{{ formattedDate }}</span>
    </div>
    <div class="content">
      <p>{{ post.content }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostItem',
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formattedDate() {
      const date = new Date(this.post.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    },
  },
};
</script>

<style scoped>
.post-item {
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  
}
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}
.username{
  color: #000000; 
}
.timestamp {
  color: #888;
  font-size: 12px;
}

.content {
  margin-top: 8px;
  font-size: 18pt;
}
</style>
