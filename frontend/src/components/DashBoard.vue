<template>
  <div class="dashboard">
    <div class="sidebar">
      <ul class="menu">
        <li :class="{ active: activeTab === 'privatechat' }" @click="activeTab = 'privatechat'">私聊</li>
        <li :class="{ active: activeTab === 'groupchat' }" @click="activeTab = 'groupchat'">群聊</li>
        <li :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">动态</li>
        <li :class="{ active: activeTab === 'contact' }" @click="activeTab = 'contact'">联系人</li>
        <li :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">搜索</li>
      </ul>
      <Logout />
    </div>
    <div class="content">
      <component :is="currentComponent"  @chatCreated="handleChatCreated"></component>
    </div>
  </div>
</template>

<script>
import PrivateChat from './PrivateChat.vue';
import GroupChat from './GroupChat.vue';
import Posts from './Posts.vue';
import Search from './Search.vue';
import Logout from './Logout.vue'; 
import Contact from './Contact.vue'; 

export default {
  name: 'Dashboard',
  components: {
    PrivateChat,
    GroupChat,
    Posts,
    Search,
    Contact,
    Logout,
  },
  data() {
    return {
      activeTab: 'privatechat',
    };
  },
  computed: {
    currentComponent() {
      if (this.activeTab === 'privatechat') return 'PrivateChat';
      if (this.activeTab === 'groupchat') return 'GroupChat';
      if (this.activeTab === 'posts') return 'Posts';
      if (this.activeTab === 'search') return 'Search';
      if (this.activeTab === 'contact') return 'Contact';
    },
  },
  methods: {
    handleChatCreated(chatId) {
      this.activeChatId = chatId;       // 设置当前选中的 chat_id
      this.activeTab = 'privatechat';   // 切换到私聊界面
    },
  },
};
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 100px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  padding: 15px;
  cursor: pointer;
}

.menu li.active {
  background-color: #ddd;
}

/* 调整登出按钮的样式，使其与菜单项一致 */
.logout-button {
  padding: 15px;
  cursor: pointer;
  color: #ff4d4f;
  /* 红色表示危险操作 */
  border-top: 1px solid #ccc;
  /* 上边框与其他菜单项区分 */
}

.logout-button:hover {
  background-color: #ffe6e6;
  /* 悬停时的背景色变化 */
}

.content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  height: 100vh;
}
</style>
