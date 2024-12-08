<template>
  <div class="group">

    <!-- 群组列表，可以根据需求替换为自己的组件 -->
    <GroupChatList 
      v-if="!selectedGroupId" 
      @select-group="handleSelectGroup"
    />
    <GroupChatView 
      v-else 
      :groupId="selectedGroupId" 
      :groupName="selectedGroupName"
      @back-to-group-list="handleBackToChats"
    />

    <!-- 创建群组的对话框 -->

  </div>
</template>

<script>
import GroupChatList from './GroupChatList.vue'; // 请根据实际情况导入您的群组列表组件
import GroupChatView from './GroupChatView.vue';

export default {
  name: 'Group',
  components: {
    GroupChatList,
    GroupChatView
  },
  data() {
    return {
      selectedGroupId:null,
      selectedGroupName:null
    };
  },

  methods: {


    handleSelectGroup(groupId,groupName) {
      this.selectedGroupId= groupId;
      this.selectedGroupName= groupName;
      
    },
    handleBackToChats() {      
      this.selectedGroupId = null;
      this.selectedGroupName= null;

    }
  },
};
</script>

<style scoped>
.group {
  height: 100%;
  position: relative;
}







</style>
