<script setup lang="ts">
defineProps<{
  users: Array<{ id: string; name: string; avatar_url: string | null }>;
  max?: number;
}>();

const max = 3;
</script>

<template>
  <div class="flex -space-x-2">
    <template v-for="(user, i) in users.slice(0, max)" :key="user.id">
      <UTooltip :text="user.name">
        <UAvatar
          :src="user.avatar_url ?? undefined"
          :alt="user.name"
          size="xs"
          class="ring-2 ring-(--ui-bg)"
        />
      </UTooltip>
    </template>
    <div
      v-if="users.length > max"
      class="flex items-center justify-center w-6 h-6 rounded-full bg-(--ui-border) text-[10px] font-medium text-(--ui-text-muted) ring-2 ring-(--ui-bg)"
    >
      +{{ users.length - max }}
    </div>
  </div>
</template>
