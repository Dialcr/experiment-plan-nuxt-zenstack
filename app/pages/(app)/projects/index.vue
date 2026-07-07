<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <ProjectsListView v-if="route.path === '/projects'" />
  <NuxtPage v-else />
</template>
