<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProjectResponse } from "~~/server/lib/project";
import type { LabelResponse } from "~~/server/lib/label";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(`project-${projectId}`, () =>
  serverFetch(`/api/projects/${projectId}`),
);

const { data: labels, refresh: refreshLabels } = await useAsyncData<LabelResponse[]>(
  `labels-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/labels`),
  { default: () => [] },
);

const saving = ref(false);
const error = ref("");
const editingLabel = ref<{ id: string; name: string; color: string } | null>(
  null,
);
const showForm = ref(false);

const labelSchema = z.object({
  name: z.string().trim().min(1, "Label name is required"),
  color: z.string().trim().min(1).default("#6366f1"),
});

type LabelFormData = z.output<typeof labelSchema>;

const formState = reactive<LabelFormData>({
  name: "",
  color: "#6366f1",
});

const colors = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
];

function openCreate() {
  editingLabel.value = null;
  formState.name = "";
  formState.color = "#6366f1";
  showForm.value = true;
}

function openEdit(label: { id: string; name: string; color: string }) {
  editingLabel.value = label;
  formState.name = label.name;
  formState.color = label.color;
  showForm.value = true;
}

async function save(event: FormSubmitEvent<LabelFormData>) {
  saving.value = true;
  error.value = "";
  try {
    if (editingLabel.value) {
      await serverFetch(
        `/api/projects/${projectId}/labels/${editingLabel.value.id}`,
        {
          method: "PATCH",
          body: event.data,
        },
      );
    } else {
      await serverFetch(`/api/projects/${projectId}/labels`, {
        method: "POST",
        body: event.data,
      });
    }
    showForm.value = false;
    editingLabel.value = null;
    await refreshLabels();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to save label";
  } finally {
    saving.value = false;
  }
}

async function remove(labelId: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/labels/${labelId}`, {
      method: "DELETE",
    });
    await refreshLabels();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete label";
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
          { label: "Labels", to: `/projects/${projectId}/labels` },
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
    <ProjectSubNav
      :project-id="projectId"
      :project-name="project?.name ?? 'Loading...'"
    />

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :description="error"
      class="mb-6"
    />

    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Labels</h3>
      <UButton
        icon="i-lucide-plus"
        label="New label"
        size="sm"
        @click="openCreate"
      />
    </div>

    <UCard v-if="showForm" class="mb-4">
      <UForm
        :schema="labelSchema"
        :state="formState"
        class="space-y-4"
        @submit="save"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="formState.name" class="w-full" autofocus />
        </UFormField>

        <UFormField label="Color">
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="c in colors"
              :key="c"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :class="
                formState.color === c
                  ? 'border-(--ui-primary) scale-110'
                  : 'border-transparent'
              "
              :style="{ backgroundColor: c }"
              @click="formState.color = c"
            />
          </div>
        </UFormField>

        <div class="flex gap-2">
          <UButton
            type="submit"
            :label="editingLabel ? 'Update' : 'Create'"
            :loading="saving"
          />
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="showForm = false"
          />
        </div>
      </UForm>
    </UCard>

    <UCard :ui="{ body: 'p-0' }">
      <div
        v-for="label in labels"
        :key="label.id"
        class="flex items-center gap-3 px-4 py-3 border-b border-(--ui-border) last:border-b-0"
      >
        <span
          class="w-3 h-3 rounded-full shrink-0"
          :style="{ backgroundColor: label.color }"
        />
        <span class="flex-1 text-sm font-medium">{{ label.name }}</span>
        <UButton
          icon="i-lucide-pencil"
          size="2xs"
          color="neutral"
          variant="ghost"
          @click="openEdit(label)"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="2xs"
          color="error"
          variant="ghost"
          @click="remove(label.id)"
        />
      </div>
      <div
        v-if="labels.length === 0"
        class="px-4 py-8 text-center text-sm text-(--ui-text-muted)"
      >
        No labels yet
      </div>
    </UCard>
  </UContainer>
</template>
