<script setup lang="ts">
import type { IssueResponse } from "~/server/lib/issue";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, setPrimaryAction, resetHeader } = useAppHeader();

const { data: project, error: projectError, refresh: refreshProject } = await useAsyncData(
  `project-${projectId}`,
  () => $fetch(`/api/projects/${projectId}`),
);

const { data: board, refresh: refreshBoard } = await useAsyncData(
  `board-${projectId}`,
  () => $fetch(`/api/projects/${projectId}/board`),
  { default: () => ({ columns: [] }) },
);

const { data: members } = await useAsyncData(
  `members-${projectId}`,
  () => $fetch(`/api/projects/${projectId}/members`),
  { default: () => [] },
);

const { data: labels } = await useAsyncData(
  `labels-${projectId}`,
  () => $fetch(`/api/projects/${projectId}/labels`),
  { default: () => [] },
);

const createIssueOpen = ref(false);
const selectedIssue = ref<IssueResponse | null>(null);
const issueDrawerOpen = ref(false);

const filters = reactive({
  state_id: "",
  assignee_id: "",
  priority: "",
  search: "",
});

const filteredColumns = computed(() => {
  let cols = board.value.columns;
  if (filters.state_id) cols = cols.filter((c) => c.id === filters.state_id);
  return cols.map((col) => ({
    ...col,
    issues: col.issues.filter((issue) => {
      if (filters.assignee_id && !issue.assignees.some((a) => a.id === filters.assignee_id)) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      if (filters.search && !issue.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    }),
    issue_count: 0,
  }));
});

for (const col of filteredColumns.value) {
  col.issue_count = col.issues.length;
}

function openIssue(issue: IssueResponse) {
  selectedIssue.value = issue;
  issueDrawerOpen.value = true;
}

async function handleDrop(issueId: string, stateId: string) {
  try {
    await $fetch(`/api/projects/${projectId}/issues/${issueId}/move`, {
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
    const defaultStateId = board.value.columns.find((c) => c.is_default)?.id ?? board.value.columns[0]?.id;
    if (!defaultStateId) throw new Error("No workflow state found");
    await $fetch(`/api/projects/${projectId}/issues`, {
      method: "POST",
      body: {
        title: newIssue.title.trim(),
        description: newIssue.description || undefined,
        priority: newIssue.priority,
        state_id: defaultStateId,
      },
    });
    newIssue.title = "";
    newIssue.description = "";
    newIssue.priority = "NONE";
    createIssueOpen.value = false;
    await refreshBoard();
  } catch (e: any) {
    createError.value = e?.statusMessage ?? e?.message ?? "Failed to create issue";
  } finally {
    creatingIssue.value = false;
  }
}

const states = computed(() => board.value.columns.map((c) => ({ id: c.id, name: c.name, color: c.color, group: c.group })));

const allStates = computed(() => [{ id: "", name: "All states", color: "", group: "" }, ...states.value]);

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      setHeader({
        breadcrumbs: [
          { label: "Projects", to: "/projects" },
          { label: proj.name, to: `/projects/${projectId}` },
        ],
      });
    }
  },
  { immediate: true },
);

setPrimaryAction(
  { label: "New issue", icon: "i-lucide-plus" },
  () => { createIssueOpen.value = true; },
);

onUnmounted(resetHeader);
</script>

<template>
  <UContainer class="py-6">
    <UAlert v-if="projectError" color="error" icon="i-lucide-alert-circle" title="Failed to load project" />

    <template v-else>
      <ProjectSubNav :project-id="projectId" :project-name="project?.name ?? 'Loading...'" />

      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <USelect
          v-model="filters.state_id"
          :items="allStates.map((s) => ({ label: s.name, value: s.id }))"
          value-attribute="value"
          placeholder="Filter by state"
          class="w-40"
        />
        <USelect
          v-model="filters.priority"
          :items="[
            { label: 'All priorities', value: '' },
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
          :items="[{ label: 'All assignees', value: '' }, ...members.map((m: any) => ({ label: m.name, value: m.user_id }))]"
          value-attribute="value"
          class="w-44"
        />
        <UInput v-model="filters.search" placeholder="Search issues..." class="w-52" leading>
          <template #leading>
            <UIcon name="i-lucide-search" class="size-4" />
          </template>
        </UInput>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh;">
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
        content-class="w-full sm:max-w-md"
      >
        <UAlert v-if="createError" color="error" icon="i-lucide-alert-circle" :description="createError" class="mb-4" />
        <UForm :schema="newIssueSchema" :state="newIssue" class="space-y-4" @submit="createIssue">
          <UFormField label="Title" name="title" required>
            <UInput v-model="newIssue.title" placeholder="Issue title" class="w-full" autofocus />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="newIssue.description" :rows="3" class="w-full" />
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
        </UForm>
        <template #footer>
          <div class="flex justify-between gap-2">
            <UButton color="neutral" variant="outline" label="Cancel" @click="createIssueOpen = false" />
            <UButton type="submit" form="new-issue-form" label="Create" icon="i-lucide-plus" :loading="creatingIssue" />
          </div>
        </template>
      </AppSidePanel>

      <IssueDrawer
        v-model:open="issueDrawerOpen"
        :issue="selectedIssue"
        :states="states"
        :members="(members as any)"
        :labels="(labels as any)"
        :project-id="projectId"
        @saved="refreshBoard()"
        @deleted="refreshBoard()"
        @close="selectedIssue = null"
      />
    </template>
  </UContainer>
</template>
