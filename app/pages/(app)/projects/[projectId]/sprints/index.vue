<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SprintResponse } from "~~/server/lib/sprint";
import type { ProjectResponse } from "~~/server/lib/project";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(
  `project-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}`),
);

const { data: sprints, refresh: refreshSprints } = await useAsyncData<
  SprintResponse[]
>(
  `sprints-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/sprints`),
  { default: () => [] },
);

const showForm = ref(false);
const editingSprint = ref<SprintResponse | null>(null);
const saving = ref(false);
const error = ref("");

const sprintSchema = z.object({
  name: z.string().trim().min(1, "Sprint name is required"),
  description: z.string().trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type SprintForm = z.output<typeof sprintSchema>;

const formState = reactive<SprintForm>({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
});

function openCreate() {
  editingSprint.value = null;
  formState.name = "";
  formState.description = "";
  formState.start_date = "";
  formState.end_date = "";
  showForm.value = true;
}

function openEdit(sprint: SprintResponse) {
  editingSprint.value = sprint;
  formState.name = sprint.name;
  formState.description = sprint.description ?? "";
  formState.start_date = sprint.start_date?.split("T")[0] ?? "";
  formState.end_date = sprint.end_date?.split("T")[0] ?? "";
  showForm.value = true;
}

async function save(event: FormSubmitEvent<SprintForm>) {
  saving.value = true;
  error.value = "";
  try {
    const body: Record<string, unknown> = {
      name: event.data.name,
      description: event.data.description || null,
    };
    if (event.data.start_date)
      body.start_date = new Date(event.data.start_date).toISOString();
    if (event.data.end_date)
      body.end_date = new Date(event.data.end_date).toISOString();

    if (editingSprint.value) {
      await serverFetch(
        `/api/projects/${projectId}/sprints/${editingSprint.value.id}`,
        {
          method: "PATCH",
          body,
        },
      );
    } else {
      await serverFetch(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        body,
      });
    }
    showForm.value = false;
    editingSprint.value = null;
    await refreshSprints();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to save sprint";
  } finally {
    saving.value = false;
  }
}

async function remove(sprintId: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    });
    await refreshSprints();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete sprint";
  }
}

async function updateStatus(
  sprintId: string,
  status: "PLANNED" | "ACTIVE" | "COMPLETED",
) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
      method: "PATCH",
      body: { status },
    });
    await refreshSprints();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to update sprint";
  }
}

const groupedSprints = computed(() => {
  return {
    ACTIVE: sprints.value.filter((s) => s.status === "ACTIVE"),
    PLANNED: sprints.value.filter((s) => s.status === "PLANNED"),
    COMPLETED: sprints.value.filter((s) => s.status === "COMPLETED"),
  };
});

function statusIcon(status: string) {
  switch (status) {
    case "ACTIVE":
      return "i-lucide-play-circle";
    case "PLANNED":
      return "i-lucide-calendar";
    case "COMPLETED":
      return "i-lucide-check-circle";
    default:
      return "i-lucide-circle";
  }
}

const deletingId = ref<string | null>(null);

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      setHeader({
        breadcrumbs: [
          { label: "Projects", to: "/projects" },
          { label: proj.name, to: `/projects/${projectId}` },
          { label: "Sprints", to: `/projects/${projectId}/sprints` },
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

    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Sprints</h3>
      <UButton
        icon="i-lucide-plus"
        label="New sprint"
        size="sm"
        @click="openCreate"
      />
    </div>

    <UCard v-if="showForm" class="mb-4">
      <UForm
        :schema="sprintSchema"
        :state="formState"
        class="space-y-4"
        @submit="save"
      >
        <UFormField label="Sprint name" name="name" required>
          <UInput
            v-model="formState.name"
            class="w-full"
            autofocus
            placeholder="Sprint 1"
          />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="formState.description" :rows="2" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start date" name="start_date">
            <UInput v-model="formState.start_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="End date" name="end_date">
            <UInput v-model="formState.end_date" type="date" class="w-full" />
          </UFormField>
        </div>
        <div class="flex gap-2">
          <UButton
            type="submit"
            :label="editingSprint ? 'Update' : 'Create'"
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

    <template v-if="sprints.length === 0 && !showForm">
      <UEmpty
        icon="i-lucide-iteration-ccw"
        title="No sprints yet"
        description="Create a sprint to start planning your iterations."
      />
    </template>

    <template v-for="(group, key) in groupedSprints" :key="key">
      <div v-if="group.length > 0" class="mb-6">
        <h4
          class="text-sm font-semibold text-(--ui-text-muted) uppercase tracking-wider mb-3 flex items-center gap-2"
        >
          <UIcon :name="statusIcon(key)" class="size-4" />
          {{
            key === "ACTIVE"
              ? "Active"
              : key === "PLANNED"
                ? "Upcoming"
                : "Completed"
          }}
          <UBadge size="xs" color="neutral" variant="subtle">{{
            group.length
          }}</UBadge>
        </h4>
        <div class="space-y-2">
          <UCard
            v-for="sprint in group"
            :key="sprint.id"
            :ui="{ body: 'p-4' }"
            class="cursor-pointer hover:bg-(--ui-bg-elevated) transition-colors"
            @click="navigateTo(`/projects/${projectId}/sprints/${sprint.id}`)"
          >
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ sprint.name }}</span>
                  <UBadge
                    v-if="sprint.status === 'ACTIVE'"
                    size="xs"
                    color="success"
                    variant="subtle"
                    >Active</UBadge
                  >
                </div>
                <p
                  v-if="sprint.description"
                  class="text-xs text-(--ui-text-muted) truncate mt-0.5"
                >
                  {{ sprint.description }}
                </p>
                <div
                  class="flex items-center gap-3 mt-1.5 text-xs text-(--ui-text-muted)"
                >
                  <span>{{ sprint.issue_count }} issues</span>
                  <span v-if="sprint.start_date">{{
                    new Date(sprint.start_date).toLocaleDateString()
                  }}</span>
                  <span v-if="sprint.start_date && sprint.end_date"
                    >&ndash;</span
                  >
                  <span v-if="sprint.end_date">{{
                    new Date(sprint.end_date).toLocaleDateString()
                  }}</span>
                </div>
              </div>
              <UDropdownMenu
                :items="
                  [
                    sprint.status === 'PLANNED'
                      ? {
                          label: 'Start sprint',
                          icon: 'i-lucide-play',
                          onSelect: () => updateStatus(sprint.id, 'ACTIVE'),
                        }
                      : null,
                    sprint.status === 'ACTIVE'
                      ? {
                          label: 'Complete sprint',
                          icon: 'i-lucide-check',
                          onSelect: () => updateStatus(sprint.id, 'COMPLETED'),
                        }
                      : null,
                    sprint.status === 'COMPLETED'
                      ? {
                          label: 'Reopen sprint',
                          icon: 'i-lucide-rotate-ccw',
                          onSelect: () => updateStatus(sprint.id, 'ACTIVE'),
                        }
                      : null,
                    { type: 'separator' } as any,
                    {
                      label: 'Edit',
                      icon: 'i-lucide-pencil',
                      onSelect: (e: Event) => {
                        e.stopPropagation();
                        openEdit(sprint);
                      },
                    },
                    {
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      color: 'error' as any,
                      onSelect: async (e: Event) => {
                        e.stopPropagation();
                        deletingId = sprint.id;
                        await remove(sprint.id);
                      },
                    },
                  ].filter(Boolean) as any[]
                "
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-more-horizontal"
                  size="2xs"
                  color="neutral"
                  variant="ghost"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
