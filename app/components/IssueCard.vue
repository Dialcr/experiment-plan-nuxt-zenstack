<script setup lang="ts">
import type { IssueResponse } from "~~/server/lib/issue";

const props = defineProps<{
  issue: IssueResponse;
}>();

const emit = defineEmits<{
  click: [issue: IssueResponse];
  dragStart: [issue: IssueResponse, event: DragEvent];
}>();

function onDragStart(event: DragEvent) {
  event.dataTransfer?.setData("text/plain", props.issue.id);
  emit("dragStart", props.issue, event);
}

function priorityColor(priority: string) {
  switch (priority) {
    case "URGENT": return "text-red-500";
    case "HIGH": return "text-orange-500";
    case "MEDIUM": return "text-yellow-500";
    case "LOW": return "text-blue-500";
    default: return "text-(--ui-text-muted)";
  }
}

function priorityIcon(priority: string) {
  switch (priority) {
    case "URGENT": return "i-lucide-arrow-up-circle";
    case "HIGH": return "i-lucide-arrow-up";
    case "MEDIUM": return "i-lucide-arrow-right";
    case "LOW": return "i-lucide-arrow-down";
    default: return "i-lucide-minus";
  }
}
</script>

<template>
  <UCard
    class="issue-card cursor-pointer hover:shadow-md transition-shadow"
    :ui="{ body: 'p-3 space-y-2', root: 'rounded-lg' }"
    draggable="true"
    @dragstart="onDragStart"
    @click="emit('click', issue)"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-xs font-mono text-(--ui-text-muted)">{{ issue.key }}</span>
      <UIcon :name="priorityIcon(issue.priority)" :class="priorityColor(issue.priority)" class="size-4 shrink-0" />
    </div>
    <p class="text-sm font-medium leading-snug">{{ issue.title }}</p>
    <div class="flex flex-wrap gap-1">
      <LabelBadge v-for="label in issue.labels" :key="label.id" :name="label.name" :color="label.color" />
    </div>
    <div class="flex items-center justify-between pt-1">
      <UserAvatarGroup v-if="issue.assignees.length" :users="issue.assignees" />
      <div v-else />
      <div class="flex items-center gap-2 text-(--ui-text-muted)">
        <span v-if="issue.comment_count > 0" class="flex items-center gap-0.5 text-xs">
          <UIcon name="i-lucide-message-circle" class="size-3" />
          {{ issue.comment_count }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.issue-card {
  transition: box-shadow 0.15s ease, opacity 0.15s ease;
}
.issue-card:active {
  opacity: 0.8;
}
</style>
