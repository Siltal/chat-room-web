<!-- src/components/Login.vue -->
<template>
  <div class="home-container">
    <div class="content">
      
      <form @submit.prevent="login" class="auth-form">
        <h2>登录</h2>
        <div class="input-group">
          <label for="username">用户名：</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="input-group">
          <label for="password">密码：</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <button type="submit" class="button login-button">登录</button>
        <p class="switch-link">
          没有账号？
          <a @click.prevent="goToRegister">立即注册</a>
        </p>
      </form>
      
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post(`/api/login`, {
          username: this.username,
          password: this.password
        });
        const token = response.data.token;
        localStorage.setItem('auth_token', token);  
        this.$router.push('/dashboard');
      } catch (error) {
        this.errorMessage = `error.response ? ${error.response.data.message} ?`;
      }
    },
    goToRegister() {
      this.$router.push('/register');
    }
  }
};
</script>

<style scoped>
/* 与 Home.vue 一致的样式 */
.home-container {
  background-image: url('@/assets/background.jpg');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.auth-form {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 8px;
  width: 320px;
  box-sizing: border-box;
}

.auth-form h2 {
  margin-bottom: 20px;
  color: #333;
}

.input-group {
  width: 100%;
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

.input-group input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  border-radius: 4px;
}

.login-button {
  background-color: #1976d2;
  color: white;
  border: none;
}

.switch-link {
  margin-top: 20px;
  color: #555;
}

.switch-link a {
  color: #1976d2;
  text-decoration: none;
  cursor: pointer;
}

.switch-link a:hover {
  text-decoration: underline;
}

.error {
  color: red;
}
</style>
