<script setup lang="ts">
import * as z from "zod";
import type { IssueResponse } from "~~/server/lib/issue";
import type { SprintResponse } from "~~/server/lib/sprint";
import type { ProjectResponse } from "~~/server/lib/project";
import type { BoardResponse } from "~~/server/lib/board";
import type { MemberResponse } from "~~/server/lib/member";
import type { LabelResponse } from "~~/server/lib/label";

const route = useRoute();
const projectId = route.params.projectId as string;
const sprintId = route.params.sprintId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(
  `project-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}`),
);

const {
  data: sprint,
  error: sprintError,
  refresh: refreshSprint,
} = await useAsyncData<SprintResponse>(`sprint-${sprintId}`, () =>
  serverFetch(`/api/projects/${projectId}/sprints/${sprintId}`),
);

const { data: board, refresh: refreshBoard } =
  await useAsyncData<BoardResponse>(
    `board-sprint-${sprintId}`,
    () => serverFetch(`/api/projects/${projectId}/board?sprint_id=${sprintId}`),
    { default: () => ({ columns: [] }) },
  );

const { data: members } = await useAsyncData<MemberResponse[]>(
  `members-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/members`),
  { default: () => [] },
);

const { data: labels } = await useAsyncData<LabelResponse[]>(
  `labels-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/labels`),
  { default: () => [] },
);

const selectedIssue = ref<IssueResponse | null>(null);
const issueDrawerOpen = ref(false);
const createIssueOpen = ref(false);

const filters = reactive({
  assignee_id: "",
  priority: "",
  search: "",
});

const filteredColumns = computed(() => {
  return board.value.columns.map((col) => {
    const issues = col.issues.filter((issue) => {
      if (
        filters.assignee_id &&
        filters.assignee_id !== "ALL" &&
        !issue.assignees.some((a) => a.id === filters.assignee_id)
      )
        return false;
      if (
        filters.priority &&
        filters.priority !== "ALL" &&
        issue.priority !== filters.priority
      )
        return false;
      if (
        filters.search &&
        !issue.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
    return { ...col, issues, issue_count: issues.length };
  });
});

function openIssue(issue: IssueResponse) {
  selectedIssue.value = issue;
  issueDrawerOpen.value = true;
}

async function handleDrop(issueId: string, stateId: string) {
  try {
    await serverFetch(`/api/projects/${projectId}/issues/${issueId}/move`, {
      method: "POST",
      body: { state_id: stateId },
    });
    await refreshBoard();
  } catch {
    // error will be shown via board refresh failure
  }
}

const newIssue = reactive({ title: "", description: "", priority: "NONE" });
const creatingIssue = ref(false);
const createError = ref("");

const newIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
});

type NewIssueSchema = z.output<typeof newIssueSchema>;

async function createIssue() {
  if (!newIssue.title.trim()) return;
  creatingIssue.value = true;
  createError.value = "";
  try {
    const defaultStateId =
      board.value.columns.find((c) => c.is_default)?.id ??
      board.value.columns[0]?.id;
    if (!defaultStateId) throw new Error("No workflow state found");
    await serverFetch(`/api/projects/${projectId}/issues`, {
      method: "POST",
      body: {
        title: newIssue.title.trim(),
        description: newIssue.description || undefined,
        priority: newIssue.priority,
        state_id: defaultStateId,
        sprint_id: sprintId,
      },
    });
    newIssue.title = "";
    newIssue.description = "";
    newIssue.priority = "NONE";
    createIssueOpen.value = false;
    await refreshBoard();
  } catch (e: any) {
    createError.value =
      e?.statusMessage ?? e?.message ?? "Failed to create issue";
  } finally {
    creatingIssue.value = false;
  }
}

const states = computed(() =>
  board.value.columns.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    group: c.group,
  })),
);

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      setHeader({
        breadcrumbs: [
          { label: "Projects", to: "/projects" },
          { label: proj.name, to: `/projects/${projectId}` },
          { label: "Sprints", to: `/projects/${projectId}/sprints` },
          {
            label: sprint.value?.name ?? "Sprint",
            to: `/projects/${projectId}/sprints/${sprintId}`,
          },
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
    <UAlert
      v-if="sprintError"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load sprint"
      :description="sprintError?.statusMessage ?? sprintError?.message ?? ''"
    />

    <template v-else>
      <ProjectSubNav
        :project-id="projectId"
        :project-name="project?.name ?? 'Loading...'"
      />

      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold">{{ sprint?.name }}</h2>
          <UBadge
            v-if="sprint?.status === 'ACTIVE'"
            color="success"
            variant="subtle"
            >Active</UBadge
          >
          <UBadge
            v-else-if="sprint?.status === 'COMPLETED'"
            color="neutral"
            variant="subtle"
            >Completed</UBadge
          >
          <UBadge v-else color="info" variant="subtle">Planned</UBadge>
        </div>
      </div>

      <div
        v-if="sprint?.description"
        class="text-sm text-(--ui-text-muted) mb-4"
      >
        {{ sprint.description }}
      </div>
      <div class="text-xs text-(--ui-text-muted) mb-4">
        <span v-if="sprint?.start_date">{{
          new Date(sprint.start_date).toLocaleDateString()
        }}</span>
        <span v-if="sprint?.start_date && sprint?.end_date"> &ndash; </span>
        <span v-if="sprint?.end_date">{{
          new Date(sprint.end_date).toLocaleDateString()
        }}</span>
        <span class="ml-3">{{ sprint?.issue_count }} issues</span>
      </div>

      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <USelect
            v-model="filters.priority"
            :items="[
              { label: 'All priorities', value: 'ALL' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
              { label: 'No priority', value: 'NONE' },
            ]"
            value-attribute="value"
            class="w-40"
          />
          <USelect
            v-model="filters.assignee_id"
            :items="[
              { label: 'All assignees', value: 'ALL' },
              ...members.map((m) => ({ label: m.name, value: m.user_id })),
            ]"
            value-attribute="value"
            class="w-44"
          />
          <UInput
            v-model="filters.search"
            placeholder="Search issues..."
            class="w-52"
            leading
          >
            <template #leading>
              <UIcon name="i-lucide-search" class="size-4" />
            </template>
          </UInput>
        </div>
        <UButton
          label="New issue"
          icon="i-lucide-plus"
          @click="createIssueOpen = true"
        />
      </div>

      <div class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh">
        <KanbanColumn
          v-for="col in filteredColumns"
          :key="col.id"
          :column="col"
          @issue-click="openIssue"
          @drop="handleDrop"
        />
      </div>

      <AppSidePanel
        v-model:open="createIssueOpen"
        title="New issue"
        description="Create a new issue for this sprint."
        content-class="w-full sm:max-w-md"
        @update:open="
          (open) => {
            if (!open) {
              newIssue.title = '';
              newIssue.description = '';
              newIssue.priority = 'NONE';
              createError = '';
            }
          }
        "
      >
        <UAlert
          v-if="createError"
          color="error"
          icon="i-lucide-alert-circle"
          :description="createError"
          class="mb-4"
        />
        <div class="space-y-4">
          <UFormField label="Title" required>
            <UInput
              v-model="newIssue.title"
              placeholder="Issue title"
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="newIssue.description"
              :rows="4"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Priority">
            <USelect
              v-model="newIssue.priority"
              :items="[
                { label: 'No priority', value: 'NONE' },
                { label: 'Urgent', value: 'URGENT' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]"
              value-attribute="value"
            />
          </UFormField>
        </div>
        <template #footer>
          <div class="flex justify-between gap-2">
            <UButton
              color="neutral"
              variant="outline"
              label="Cancel"
              @click="createIssueOpen = false"
            />
            <UButton
              label="Create"
              icon="i-lucide-plus"
              :loading="creatingIssue"
              @click="createIssue"
            />
          </div>
        </template>
      </AppSidePanel>

      <IssueDrawer
        v-model:open="issueDrawerOpen"
        :issue="selectedIssue"
        :states="states"
        :members="members"
        :labels="labels"
        :project-id="projectId"
        @saved="refreshBoard()"
        @deleted="refreshBoard()"
        @close="selectedIssue = null"
      />
    </template>
  </UContainer>
</template>
