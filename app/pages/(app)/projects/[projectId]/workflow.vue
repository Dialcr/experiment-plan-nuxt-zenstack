<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProjectResponse } from "~~/server/lib/project";
import type { StateResponse } from "~~/server/lib/state";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(
  `project-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}`),
);

const { data: states, refresh: refreshStates } = await useAsyncData<StateResponse[]>(
  `states-${projectId}-workflow`,
  () => serverFetch(`/api/projects/${projectId}/states`),
  { default: () => [] },
);

const saving = ref(false);
const error = ref("");
const showForm = ref(false);
const editingState = ref<{ id: string; name: string; color: string; group: string } | null>(null);
const reordering = ref(false);

const stateSchema = z.object({
  name: z.string().trim().min(1, "State name is required"),
  slug: z.string().trim().min(1, "Slug is required").regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores"),
  color: z.string().trim().min(1, "Color is required"),
  group: z.enum(["BACKLOG", "UNSTARTED", "STARTED", "COMPLETED", "CANCELLED"]),
});

type StateForm = z.output<typeof stateSchema>;

const formState = reactive<StateForm>({
  name: "",
  slug: "",
  color: "#3b82f6",
  group: "UNSTARTED",
});

const stateColors = ["#d9d9d9", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function openCreate() {
  editingState.value = null;
  formState.name = "";
  formState.slug = "";
  formState.color = "#3b82f6";
  formState.group = "UNSTARTED";
  showForm.value = true;
}

function openEdit(state: StateResponse) {
  editingState.value = state;
  formState.name = state.name;
  formState.slug = state.slug;
  formState.color = state.color;
  formState.group = state.group;
  showForm.value = true;
}

async function save(event: FormSubmitEvent<StateForm>) {
  saving.value = true;
  error.value = "";
  try {
    if (editingState.value) {
      await serverFetch(`/api/projects/${projectId}/states/${editingState.value.id}`, {
        method: "PATCH",
        body: event.data,
      });
    } else {
      await serverFetch(`/api/projects/${projectId}/states`, {
        method: "POST",
        body: event.data,
      });
    }
    showForm.value = false;
    editingState.value = null;
    await refreshStates();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to save state";
  } finally {
    saving.value = false;
  }
}

async function remove(stateId: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/states/${stateId}`, { method: "DELETE" });
    await refreshStates();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete state";
  }
}

async function setDefault(stateId: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/states/${stateId}/default`, { method: "POST" });
    await refreshStates();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to set default state";
  }
}

async function moveUp(index: number) {
  if (index === 0) return;
  const newOrder = [...states.value];
  [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
  await reorder(newOrder);
}

async function moveDown(index: number) {
  if (index === states.value.length - 1) return;
  const newOrder = [...states.value];
  [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
  await reorder(newOrder);
}

async function reorder(newOrder: StateResponse[]) {
  reordering.value = true;
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/states/reorder`, {
      method: "POST",
      body: { state_ids: newOrder.map((s) => s.id) },
    });
    await refreshStates();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to reorder states";
  } finally {
    reordering.value = false;
  }
}

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      setHeader({
        breadcrumbs: [
          { label: "Projects", to: "/projects" },
          { label: proj.name, to: `/projects/${projectId}` },
          { label: "Workflow", to: `/projects/${projectId}/workflow` },
        ],
      });
    }
  },
  { immediate: true },
);

onUnmounted(resetHeader);
</script>

<template>
  <UContainer class="py-6 max-w-2xl">
    <ProjectSubNav :project-id="projectId" :project-name="project?.name ?? 'Loading...'" />

    <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :description="error" class="mb-6" />

    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Workflow states</h3>
      <UButton icon="i-lucide-plus" label="New state" size="sm" @click="openCreate" />
    </div>

    <UCard v-if="showForm" class="mb-4">
      <UForm :schema="stateSchema" :state="formState" class="space-y-4" @submit="save">
        <UFormField label="Name" name="name" required>
          <UInput v-model="formState.name" class="w-full" autofocus />
        </UFormField>
        <UFormField label="Slug" name="slug" required>
          <UInput v-model="formState.slug" class="w-full" placeholder="e.g., in_progress" />
        </UFormField>
        <UFormField label="Group" name="group" required>
          <USelect
            v-model="formState.group"
            :items="[
              { label: 'Backlog', value: 'BACKLOG' },
              { label: 'Unstarted', value: 'UNSTARTED' },
              { label: 'Started', value: 'STARTED' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]"
            value-attribute="value"
          />
        </UFormField>
        <UFormField label="Color">
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="c in stateColors"
              :key="c"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :class="formState.color === c ? 'border-(--ui-primary) scale-110' : 'border-transparent'"
              :style="{ backgroundColor: c }"
              @click="formState.color = c"
            />
          </div>
        </UFormField>
        <div class="flex gap-2">
          <UButton type="submit" :label="editingState ? 'Update' : 'Create'" :loading="saving" />
          <UButton color="neutral" variant="outline" label="Cancel" @click="showForm = false" />
        </div>
      </UForm>
    </UCard>

    <UCard :ui="{ body: 'p-0' }">
      <div
        v-for="(state, i) in states"
        :key="state.id"
        class="flex items-center gap-3 px-4 py-3 border-b border-(--ui-border) last:border-b-0"
      >
        <div class="flex flex-col gap-0.5">
          <UButton
            icon="i-lucide-chevron-up"
            size="2xs"
            color="neutral"
            variant="ghost"
            :disabled="i === 0 || reordering"
            @click="moveUp(i)"
          />
          <UButton
            icon="i-lucide-chevron-down"
            size="2xs"
            color="neutral"
            variant="ghost"
            :disabled="i === states.length - 1 || reordering"
            @click="moveDown(i)"
          />
        </div>
        <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: state.color }" />
        <div class="flex-1 min-w-0">
          <span class="text-sm font-medium">{{ state.name }}</span>
          <UBadge v-if="state.is_default" size="xs" color="success" variant="subtle" class="ml-2">Default</UBadge>
          <span class="text-xs text-(--ui-text-muted) ml-2">{{ state.group }}</span>
        </div>
        <span class="text-xs text-(--ui-text-muted)">{{ state.issue_count ?? 0 }} issues</span>
        <UButton
          v-if="!state.is_default"
          size="2xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-star"
          label="Set default"
          @click="setDefault(state.id)"
        />
        <UButton icon="i-lucide-pencil" size="2xs" color="neutral" variant="ghost" @click="openEdit(state)" />
        <UButton icon="i-lucide-trash-2" size="2xs" color="error" variant="ghost" @click="remove(state.id)" />
      </div>
      <div v-if="states.length === 0" class="px-4 py-8 text-center text-sm text-(--ui-text-muted)">
        No states yet
      </div>
    </UCard>
  </UContainer>
</template>
