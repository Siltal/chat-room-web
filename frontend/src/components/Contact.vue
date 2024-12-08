<template>
  <div>
    <h2>联系人</h2>
    <ul class="contact-list">
      <li v-for="contact in contacts" :key="contact.user_id" class="contact-item">
        <img :src="getAvatarUrl(contact.avatar_url) " alt="Avatar" class="avatar" />
        <span class="username">{{ contact.username }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Contact',
  data() {
    return {
      contacts: [],
    };
  },
  mounted() {
    this.fetchContacts();
  },
  methods: {
    async fetchContacts() {
      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`/api/contacts`, {
          headers: {
            Authorization: `${token}`, // 确保使用 Bearer 令牌格式
          },
        });
        this.contacts = response.data.users; // 根据您的 JSON 数据结构，应该是 'users' 而不是 'contacts'
      } catch (error) {
        console.error('获取联系人失败', error);
      }
    },
    getAvatarUrl(avatarPath) {
      return `${avatarPath || 'https://via.placeholder.com/40'} `;
    },
  },
};
</script>

<style scoped>
h2 {
  padding-bottom: 10px;;
}

.contact-list {
  display: flex;
  flex-direction: column;
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 300px;
  /* 可根据需要调整宽度 */
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
}

.username {
  font-size: 16px;
  font-weight: 500;
}

.description {
  font-size: 14px;
  color: #666;
}
</style>
