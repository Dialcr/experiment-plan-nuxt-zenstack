<script setup lang="ts">
const props = defineProps<{
  projectId: string;
  projectName: string;
}>();

const route = useRoute();

const tabs = [
  { label: "Board", icon: "i-lucide-kanban", to: `/projects/${props.projectId}` },
  { label: "Backlog", icon: "i-lucide-list", to: `/projects/${props.projectId}/backlog` },
  { label: "Sprints", icon: "i-lucide-iteration-ccw", to: `/projects/${props.projectId}/sprints` },
  { label: "Members", icon: "i-lucide-users", to: `/projects/${props.projectId}/members` },
  { label: "Workflow", icon: "i-lucide-workflow", to: `/projects/${props.projectId}/workflow` },
  { label: "Labels", icon: "i-lucide-tags", to: `/projects/${props.projectId}/labels` },
  { label: "Settings", icon: "i-lucide-settings", to: `/projects/${props.projectId}/settings` },
] as const;

const selectedIndex = computed(() => {
  const path = route.path;
  const idx = tabs.findIndex((t) => path.startsWith(t.to));
  return idx === -1 ? 0 : idx;
});

function onSelect(index: number) {
  navigateTo(tabs[index].to);
}
</script>

<template>
  <div class="border-b border-(--ui-border) mb-6">
    <div class="flex items-center gap-4 px-1">
      <h2 class="text-lg font-semibold text-(--ui-text-highlighted) truncate shrink-0">
        {{ projectName }}
      </h2>
      <UTabs :items="tabs" :model-value="selectedIndex" @update:model-value="onSelect" />
    </div>
  </div>
</template>
