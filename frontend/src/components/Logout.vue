<template>
  <li class="logout-button" @click="logout">
    登出
  </li>
</template>

<script>
export default {
  name: 'Logout',
  methods: {
    logout() {
      localStorage.removeItem('auth_token');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.logout-button {
  padding: 15px;
  cursor: pointer;
  color: #ff4d4f; 
  border-top: 1px solid #ccc;
}

.logout-button:hover {
  background-color: #ffe6e6;
}
</style>
