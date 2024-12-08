<template>
  <div>
    <h2>消息列表</h2>
    <!-- 显示用户的消息 -->
     
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Messages',
  data() {
    return {
      messages: [],
    };
  },
  mounted() {
    this.fetchMessages();
  },
  methods: {
    async fetchMessages() {
      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl =import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${apiUrl}/api/messages`, {
          headers: {
            Authorization: token,
          },
        });
        this.messages = response.data.messages;
      } catch (error) {
        console.error('获取消息失败', error);
      }
    },
  },
};
</script>

<style scoped>
/* 添加样式 */
</style>
