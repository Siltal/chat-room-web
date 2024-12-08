<template>
  <div>
    <div class="header">
      <h2>群组</h2>
      <button class="group-button" @click="openCreateGroupDialog">创建群组</button>
    </div>
    <div v-for="group in groups" :key="group.group_id" @click="selectGroup(group.group_id)" class="group-item">
      <div class="group-info">
        <div class="group-name">
          <span>{{ group.group_name }}</span>
        </div>
        <div class="group-description">
          <p>{{ group.group_description || '暂无描述' }}</p>
        </div>
      </div>
    </div>
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>创建新群组</h3>
          <button class="close-button" @click="closeCreateGroupDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>群名称:</label>
            <input type="text" v-model="newGroupName" placeholder="输入群名称" />
          </div>
          <div class="form-item">
            <label>群描述:</label>
            <input type="text" v-model="newGroupDesc" placeholder="输入群描述" />
          </div>
          <div class="form-item">
            <span>选择成员:</span>
            <div class="members-list">
              <div v-for="contact in users" :key="contact.user_id" class="member-item">
                <label class="custom-checkbox">
                  <input type="checkbox" :value="contact.user_id" v-model="selectedMembers" />

                  <div class="avatar-container">
                    <img :src="getAvatarUrl(contact.avatar_url)" alt="Avatar" class="avatar" />
                  </div>
                  <span class="username">{{ contact.username }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeCreateGroupDialog">取消</button>
          <button @click="createGroup">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GroupChatList',
  data(){
    return{
      showDialog: false,
      newGroupName: '',
      newGroupDesc: '',
      selectedMembers: [],
      groups: [],
      users: [],


    }
  },

  mounted() {
    this.fetchGroups();
    this.fetchUsers();
  },
  methods: {
    getAvatarUrl(avatarPath) {
      return `${avatarPath || 'https://via.placeholder.com/40'} `;
    },
    getGroupName(groupId) {
      const group = this.groups.find(g => g.group_id === groupId);
      return group ? group.group_name : '未知群组'; // 如果未找到，返回默认值
    },
    selectGroup(groupId) {
      console.log(this.getGroupName(groupId));
      this.$emit('select-group', groupId,this.getGroupName(groupId)); // 触发事件并传递选中的群组ID
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    async fetchGroups() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/groupchats`, {
          headers: {
            Authorization: token,
          },
        });
        this.groups = response.data.groups;
      } catch (error) {
        console.error('获取群组列表失败', error);
      }
    },
    async fetchUsers() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/api/contacts`, {
          headers: {
            Authorization: token,
          },
        });
        this.users = response.data.users; // 假设返回 { users: [{id, username}, ...] }
      } catch (error) {
        console.error('获取用户列表失败', error);
      }
    },
    openCreateGroupDialog() {
      this.showDialog = true;
    },
    closeCreateGroupDialog() {
      this.showDialog = false;
      this.newGroupName = '';
      this.selectedMembers = [];
    },
    async createGroup() {
      if (!this.newGroupName.trim()) {
        alert('群名称不能为空');
        return;
      }
      if (this.selectedMembers.length === 0) {
        alert('请选择至少一名成员');
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.post(
          `/api/initGroup`,
          {
            group_name: this.newGroupName,
            group_description: this.newGroupDesc,
            group_members: this.selectedMembers,
          },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        this.fetchGroups();
        this.closeCreateGroupDialog();
      } catch (error) {
        console.error('创建群组失败', error);
      }
    },
  },
};
</script>
<style scoped>
.group-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.group-item:hover {
  background-color: #f5f5f5;
}

.group-info {
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: 16px;
  font-weight: bold;
}

.group-description {
  font-size: 14px;
  color: #777;
  margin: 5px 0;
}

.joined-at {
  font-size: 12px;
  color: #aaa;
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}



.form-item label {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-item input[type="text"] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
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
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-container {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 400px;
  border-radius: 8px;
  overflow: hidden;
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


.members-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
}

.member-item {
  display: flex;

  align-items: center;
  margin-bottom: 8px;
}

.member-item label {
  display: flex;
  flex-direction: row;
  align-items: center;

}

.custom-checkbox {
  width: 100%;
}

.custom-checkbox input {
  margin: 10px;
  border: 1px solid red;
}

.username {
  justify-content: center;
}
.group-button {
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.group-button:hover {
  background-color: #1565c0;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>
