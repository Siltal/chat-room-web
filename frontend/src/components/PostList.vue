<template>
  <div class="post-list">
    <PostItem
      v-for="post in posts"
      :key="post.post_id"
      :post="post"
    />
  </div>
</template>

<script>
import PostItem from './PostItem.vue';

export default {
  name: 'PostList',
  components: {
    PostItem,
  },
  props: {
    posts: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
.post-list {
  display: flex;
  flex-direction: column;
}
</style>
