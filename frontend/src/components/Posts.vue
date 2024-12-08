<template>
  <div class="post">
    <div class="header">
      <h2>动态</h2>
      <button class="post-button" @click="openPostsDialog">发布动态</button>
    </div>
    <!-- 动态列表 -->
    <PostList :posts="posts" />

    <!-- 发布动态的对话框 -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>发布动态</h3>
          <button class="close-button" @click="closePostsDialog">×</button>
        </div>
        <div class="dialog-body">
          <textarea v-model="newPostsContent" placeholder="写点什么吧..." rows="5"></textarea>
        </div>
        <div class="dialog-footer">
          <button @click="closePostsDialog">取消</button>
          <button @click="postPosts">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import PostList from './PostList.vue';
import { jwtDecode  } from 'jwt-decode';



export default {
  name: 'Posts',
  components: {
    PostList,
  },
  data() {
    return {
      posts: [],
      showDialog: false,
      newPostsContent: '',
      username:'',
      userId:''
    };
  },
  mounted() {
    this.fetchActivities();
  },
  methods: {
    async fetchActivities() {
      try {
        const token = localStorage.getItem('auth_token');

        
  
        const response = await axios.get(`/api/posts`, {
          headers: {
            Authorization: token,
          },
        });
        this.posts = response.data.posts;
      } catch (error) {
        console.error('获取动态失败', error);
      }
    },
    openPostsDialog() {
      this.showDialog = true;
    },
    closePostsDialog() {
      this.showDialog = false;
      this.newPostsContent = '';
    },
    async postPosts() {
      if (!this.newPostsContent.trim()) {
        alert('内容不能为空');
        return;
      }
      try {
        const token = localStorage.getItem('auth_token');

        if (token) {
          const decodedToken = jwtDecode (token);
          this.username = decodedToken.username;  // 假设 token 中有 username 字段
          this.userId = decodedToken.userId;      // 假设 token 中有 userId 字段
          console.log(this.userId);
          console.log(this.username);
          
        }
        const response = await axios.post(
          `/api/posts`,
          { 
            userId:  this.userId ,
            content: this.newPostsContent 
          },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        // 发布成功后，刷新动态列表
        console.log(response.data.post);
        console.log(this.post);
        
        
        this.posts.unshift(response.data.post);
        this.closePostsDialog();
      } catch (error) {
        console.error('发布动态失败', error);
      }
    },
  },
};
</script>

<style scoped>
.post {
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-button {
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.post-button:hover {
  background-color: #1565c0;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background-color: white;
  width: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
}

.dialog-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.dialog-body {
  padding: 16px;
}

.dialog-body textarea {
  width: 100%;
  resize: none;
  font-size: 16px;
  padding: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.dialog-footer button {
  padding: 8px 16px;
  margin-left: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer button:first-child {
  background-color: #ccc;
}

.dialog-footer button:last-child {
  background-color: #1976d2;
  color: white;
}

.dialog-footer button:last-child:hover {
  background-color: #1565c0;
}
</style>
