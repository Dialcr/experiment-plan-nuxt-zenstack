<script setup lang="ts">
import type { IssueResponse } from "~~/server/lib/issue";

const props = withDefaults(
  defineProps<{
    column: {
      id: string;
      name: string;
      slug: string;
      color: string;
      group: string;
      is_default: boolean;
      issues: IssueResponse[];
      issue_count: number;
    };
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  issueClick: [issue: IssueResponse];
  drop: [issueId: string, stateId: string];
}>();

const dropTarget = ref(false);

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dropTarget.value = true;
}

function onDragLeave() {
  dropTarget.value = false;
}

function onDrop(event: DragEvent) {
  dropTarget.value = false;
  const issueId = event.dataTransfer?.getData("text/plain");
  if (issueId) {
    emit("drop", issueId, props.column.id);
  }
}
</script>

<template>
  <div
    class="kanban-column flex flex-col min-w-72 w-80 bg-(--ui-bg-elevated) rounded-xl border border-(--ui-border) max-h-full"
    :class="{ 'ring-2 ring-(--ui-primary)': dropTarget }"
    @dragover="!disabled && onDragOver($event)"
    @dragleave="!disabled && onDragLeave()"
    @drop="!disabled && onDrop($event)"
  >
    <div class="flex items-center gap-2 px-3 py-3 border-b border-(--ui-border)">
      <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: column.color }" />
      <span class="text-sm font-semibold">{{ column.name }}</span>
      <UBadge size="xs" color="neutral" variant="subtle" class="ml-auto">{{ column.issue_count }}</UBadge>
    </div>
    <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-24">
      <div v-if="column.issues.length === 0" class="flex items-center justify-center h-24 text-xs text-(--ui-text-muted)">
        Drop issues here
      </div>
      <IssueCard
        v-for="issue in column.issues"
        :key="issue.id"
        :issue="issue"
        :disabled="disabled"
        @click="emit('issueClick', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  transition: box-shadow 0.15s ease;
}
</style>
