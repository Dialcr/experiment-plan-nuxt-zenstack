<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProjectResponse } from "~~/server/lib/project";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project, refresh: refreshProject } =
  await useAsyncData<ProjectResponse>(`project-${projectId}`, () =>
    serverFetch(`/api/projects/${projectId}`),
  );

const isAdmin = computed(() => project.value?.my_role === "ADMIN");
const isViewer = computed(() => project.value?.my_role === "VIEWER");

const saving = ref(false);
const deleting = ref(false);
const archiving = ref(false);
const error = ref("");
const deleteConfirmOpen = ref(false);
const archiveConfirmOpen = ref(false);

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
    await serverFetch(`/api/projects/${projectId}`, {
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
    await serverFetch(`/api/projects/${projectId}`, { method: "DELETE" });
    deleteConfirmOpen.value = false;
    await navigateTo("/projects");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete project";
    deleteConfirmOpen.value = false;
  } finally {
    deleting.value = false;
  }
}

async function toggleArchive() {
  archiving.value = true;
  error.value = "";
  try {
    const isArchived = !!project.value?.archived_at;
    await serverFetch(`/api/projects/${projectId}/archive`, {
      method: "POST",
      body: { archived: !isArchived },
    });
    archiveConfirmOpen.value = false;
    await refreshProject();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to archive project";
  } finally {
    archiving.value = false;
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
  <UContainer class="py-6">
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

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Project settings</h3>
      </template>

      <UForm
        :schema="updateSchema"
        :state="formState"
        class="space-y-4"
        @submit="save"
      >
        <UFormField label="Project name" name="name" required>
          <UInput v-model="formState.name" class="w-full" :disabled="!isAdmin" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="formState.description" :rows="3" class="w-full" :disabled="!isAdmin" />
        </UFormField>

        <div class="flex items-center gap-2 text-xs text-(--ui-text-muted)">
          <span>Identifier: {{ project?.identifier }}</span>
          <span
            >Created:
            {{
              project?.created_at
                ? new Date(project.created_at).toLocaleDateString()
                : "-"
            }}</span
          >
        </div>

        <UButton
          v-if="isAdmin"
          type="submit"
          label="Save changes"
          icon="i-lucide-save"
          :loading="saving"
          :disabled="saving"
        />
      </UForm>
    </UCard>

    <UCard v-if="isAdmin" class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold">Archive project</h3>
      </template>
      <p class="text-sm text-(--ui-text-muted) mb-4">
        {{
          project?.archived_at
            ? "This project is archived. Unarchive it to make it active again."
            : "Archiving a project marks it as archived. It remains visible but is clearly identified as archived. All data is preserved."
        }}
      </p>
      <UButton
        :color="project?.archived_at ? 'primary' : 'warning'"
        variant="outline"
        :icon="
          project?.archived_at ? 'i-lucide-archive-restore' : 'i-lucide-archive'
        "
        :label="project?.archived_at ? 'Unarchive project' : 'Archive project'"
        :loading="archiving"
        @click="archiveConfirmOpen = true"
      />
    </UCard>

    <UCard v-if="isAdmin" class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold text-red-500">Danger zone</h3>
      </template>
      <p class="text-sm text-(--ui-text-muted) mb-4">
        Deleting a project removes all its data permanently. This action cannot
        be undone.
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
      v-if="archiveConfirmOpen"
      v-model="archiveConfirmOpen"
      :title="project?.archived_at ? 'Unarchive project?' : 'Archive project?'"
      :description="
        project?.archived_at
          ? 'This will make the project active again.'
          : 'The project will be archived. It remains visible but marked as archived. All data is preserved.'
      "
      :confirm-label="project?.archived_at ? 'Unarchive' : 'Archive'"
      :loading="archiving"
      color="warning"
      @confirm="toggleArchive"
    />

    <ConfirmDialog
      v-if="deleteConfirmOpen"
      v-model="deleteConfirmOpen"
      title="Delete project?"
      description="This will permanently delete the project, including all issues, states, labels, and comments."
      confirm-label="Delete"
      :loading="deleting"
      color="error"
      @confirm="remove"
    />
  </UContainer>
</template>
