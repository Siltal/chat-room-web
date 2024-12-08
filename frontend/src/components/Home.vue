<!-- src/views/Home.vue -->
<template>
  <div class="home-container">
    <div class="content">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <button class="button register-button" @click="goToRegister">
        注册
      </button>
      <button class="button login-button" @click="goToLogin">
        登录
      </button>
    </div>
  </div>
</template>


<script>
export default {
  name: 'Home',
  methods: {
    goToRegister() {
      this.$router.push({ name: 'Register' });
    },
    goToLogin() {
      this.$router.push({ name: 'Login' });
    },
  },
};
</script>

<style scoped>
.home-container {
  background-image: url('@/assets/background.jpg');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  /* 可选：添加背景色使内容更易读 */
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo {
  max-width: 200px;
  margin-bottom: 40px;
}

.button {
  margin: 10px 0;
  width: 200px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.register-button {
  background-color: #1976d2;
  /* Material Design Primary Color */
  color: white;
}

.register-button:hover {
  background-color: #1565c0;
}

.login-button {
  background-color: #424242;
  /* Material Design Secondary Color */
  color: white;
}

.login-button:hover {
  background-color: #333333;
}
</style>