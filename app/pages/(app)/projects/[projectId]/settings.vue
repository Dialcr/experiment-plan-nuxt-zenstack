<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project, refresh: refreshProject } = await useAsyncData(
  `project-${projectId}`,
  () => $fetch(`/api/projects/${projectId}`),
);

const saving = ref(false);
const deleting = ref(false);
const error = ref("");
const deleteConfirmOpen = ref(false);

const updateSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().trim().optional(),
});

type UpdateSchema = z.output<typeof updateSchema>;

const formState = reactive<UpdateSchema>({
  name: "",
  description: "",
});

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      formState.name = proj.name;
      formState.description = proj.description ?? "";
    }
  },
  { immediate: true },
);

async function save(event: FormSubmitEvent<UpdateSchema>) {
  saving.value = true;
  error.value = "";
  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: event.data,
    });
    await refreshProject();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to update project";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  deleting.value = true;
  error.value = "";
  try {
    await $fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    await navigateTo("/projects");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete project";
  } finally {
    deleting.value = false;
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
          { label: "Settings", to: `/projects/${projectId}/settings` },
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

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Project settings</h3>
      </template>

      <UForm :schema="updateSchema" :state="formState" class="space-y-4" @submit="save">
        <UFormField label="Project name" name="name" required>
          <UInput v-model="formState.name" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="formState.description" :rows="3" class="w-full" />
        </UFormField>

        <div class="flex items-center gap-2 text-xs text-(--ui-text-muted)">
          <span>Identifier: {{ project?.identifier }}</span>
          <span>Created: {{ project?.created_at ? new Date(project.created_at).toLocaleDateString() : '-' }}</span>
        </div>

        <UButton type="submit" label="Save changes" icon="i-lucide-save" :loading="saving" :disabled="saving" />
      </UForm>
    </UCard>

    <UCard class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold text-red-500">Danger zone</h3>
      </template>
      <p class="text-sm text-(--ui-text-muted) mb-4">
        Deleting a project removes all its data permanently. This action cannot be undone.
      </p>
      <UButton
        color="error"
        variant="outline"
        icon="i-lucide-trash-2"
        label="Delete project"
        :loading="deleting"
        @click="deleteConfirmOpen = true"
      />
    </UCard>

    <ConfirmDialog
      v-model:open="deleteConfirmOpen"
      title="Delete project?"
      description="This will permanently delete the project, including all issues, states, labels, and comments."
      confirm-label="Delete"
      color="error"
      @confirm="remove"
    />
  </UContainer>
</template>
