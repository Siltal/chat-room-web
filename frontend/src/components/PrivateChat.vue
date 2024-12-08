<template>
  <div class="private-chat-parent">
    <PrivateChatList 
      v-if="!selectedChatId" 
      :privatechats="privatechats" 
      @select-chat="handleSelectChat"
    />
    <PrivateChatView 
      v-else 
      :chatId="selectedChatId" 
      @back-to-chats="handleBackToChats"
    />
  </div>
</template>

<script>
import PrivateChatList from './PrivateChatList.vue';
import PrivateChatView from './PrivateChatView.vue';
import axios from 'axios';

export default {
  name: 'PrivateChat',
  components: {
    PrivateChatList,
    PrivateChatView,
  },
  data() {
    return {
      privatechats: [],      // 所有私聊列表
      selectedChatId: null, // 当前选中的聊天ID
    };
  },
  created() {
    this.fetchPrivateChats();
  },
  methods: {
    async fetchPrivateChats() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/privatechats`, {
          headers: {
            Authorization: `${token}`,
          },
        });
        this.privatechats = response.data.privatechats;
        // console.log(this.privatechats);
      } catch (error) {
        console.error('获取私聊列表失败', error);
      }
    },
    handleSelectChat(chatId) {
      this.selectedChatId = chatId;
    },
    handleBackToChats() {
      this.selectedChatId = null;
      this.fetchPrivateChats();
    }
  },
};
</script>

<style scoped>
.private-chat-parent {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
