<script setup lang="ts">
import type { IssueResponse } from "~~/server/lib/issue";
import type { ProjectResponse } from "~~/server/lib/project";
import type { MemberResponse } from "~~/server/lib/member";
import type { StateResponse } from "~~/server/lib/state";
import type { LabelResponse } from "~~/server/lib/label";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(
  `project-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}`),
);

const { data: members } = await useAsyncData<MemberResponse[]>(
  `members-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/members`),
  { default: () => [] },
);

const filters = reactive({
  state_id: "",
  assignee_id: "",
  priority: "",
  search: "",
});

const queryString = computed(() => {
  const params = new URLSearchParams();
  if (filters.state_id && filters.state_id !== "ALL")
    params.set("state_id", filters.state_id);
  if (filters.assignee_id && filters.assignee_id !== "ALL")
    params.set("assignee_id", filters.assignee_id);
  if (filters.priority && filters.priority !== "ALL")
    params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
});

const { data: issues, refresh: refreshIssues } = await useAsyncData<
  IssueResponse[]
>(
  `issues-${projectId}-backlog`,
  () => serverFetch(`/api/projects/${projectId}/issues${queryString.value}`),
  { default: () => [], watch: [queryString] },
);

const { data: states } = await useAsyncData<StateResponse[]>(
  `states-${projectId}-backlog`,
  () => serverFetch(`/api/projects/${projectId}/states`),
  { default: () => [] },
);

const { data: labels } = await useAsyncData<LabelResponse[]>(
  `labels-${projectId}`,
  () => serverFetch(`/api/projects/${projectId}/labels`),
  { default: () => [] },
);

const allStates = computed(() => [
  { id: "ALL", name: "All states" },
  ...states.value,
]);
const selectedIssue = ref<IssueResponse | null>(null);
const issueDrawerOpen = ref(false);
const createIssueOpen = ref(false);
const creatingIssue = ref(false);
const createError = ref("");

const newIssue = reactive({
  title: "",
  description: "",
  priority: "NONE",
  state_id: "",
});

async function createIssue() {
  if (!newIssue.title.trim()) return;
  creatingIssue.value = true;
  createError.value = "";
  try {
    const defaultStateId =
      newIssue.state_id ||
      states.value.find((s) => s.is_default)?.id ||
      states.value[0]?.id;
    if (!defaultStateId) throw new Error("No workflow state found");
    await serverFetch(`/api/projects/${projectId}/issues`, {
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
    newIssue.state_id = "";
    createIssueOpen.value = false;
    await refreshIssues();
  } catch (e: any) {
    createError.value =
      e?.statusMessage ?? e?.message ?? "Failed to create issue";
  } finally {
    creatingIssue.value = false;
  }
}

function openIssue(issue: IssueResponse) {
  selectedIssue.value = issue;
  issueDrawerOpen.value = true;
}

function priorityIcon(p: string) {
  switch (p) {
    case "URGENT":
      return "i-lucide-arrow-up-circle";
    case "HIGH":
      return "i-lucide-arrow-up";
    case "MEDIUM":
      return "i-lucide-arrow-right";
    case "LOW":
      return "i-lucide-arrow-down";
    default:
      return "i-lucide-minus";
  }
}
function priorityColor(p: string) {
  switch (p) {
    case "URGENT":
      return "text-red-500";
    case "HIGH":
      return "text-orange-500";
    case "MEDIUM":
      return "text-yellow-500";
    case "LOW":
      return "text-blue-500";
    default:
      return "";
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
          { label: "Backlog", to: `/projects/${projectId}/backlog` },
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

    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div class="flex items-center gap-3 flex-wrap">
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
            ...members.map((m) => ({
              label: m.name,
              value: m.user_id,
            })),
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

    <UCard :ui="{ body: 'p-0' }">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-(--ui-border) text-left text-xs text-(--ui-text-muted) uppercase tracking-wider"
          >
            <th class="px-4 py-3 font-medium w-24">Key</th>
            <th class="px-4 py-3 font-medium">Title</th>
            <th class="px-4 py-3 font-medium w-28">Priority</th>
            <th class="px-4 py-3 font-medium w-36">State</th>
            <th class="px-4 py-3 font-medium w-36">Assignees</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="issue in issues"
            :key="issue.id"
            class="border-b border-(--ui-border) hover:bg-(--ui-bg-elevated) cursor-pointer transition-colors"
            @click="openIssue(issue)"
          >
            <td class="px-4 py-3 font-mono text-xs text-(--ui-text-muted)">
              {{ issue.key }}
            </td>
            <td class="px-4 py-3 font-medium">{{ issue.title }}</td>
            <td class="px-4 py-3">
              <span
                :class="priorityColor(issue.priority)"
                class="flex items-center gap-1 text-xs"
              >
                <UIcon :name="priorityIcon(issue.priority)" class="size-3.5" />
                {{ issue.priority === "NONE" ? "-" : issue.priority }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block w-2 h-2 rounded-full mr-1.5"
                :style="{
                  backgroundColor: states.find((s) => s.id === issue.state_id)
                    ?.color,
                }"
              />
              {{ states.find((s) => s.id === issue.state_id)?.name ?? "-" }}
            </td>
            <td class="px-4 py-3">
              <UserAvatarGroup
                v-if="issue.assignees.length"
                :users="issue.assignees"
              />
              <span v-else class="text-xs text-(--ui-text-muted)"
                >Unassigned</span
              >
            </td>
          </tr>
          <tr v-if="issues.length === 0">
            <td
              colspan="5"
              class="px-4 py-12 text-center text-sm text-(--ui-text-muted)"
            >
              No issues found
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <IssueDrawer
      v-model:open="issueDrawerOpen"
      :issue="selectedIssue"
      :states="states as any"
      :members="members"
      :labels="labels"
      :project-id="projectId"
      @saved="refreshIssues()"
      @deleted="refreshIssues()"
      @close="selectedIssue = null"
    />

    <AppSidePanel
      v-model:open="createIssueOpen"
      title="New issue"
      description="Create a new issue for this project."
      @update:open="
        (open) => {
          if (!open) {
            newIssue.title = '';
            newIssue.description = '';
            newIssue.priority = 'NONE';
            newIssue.state_id = '';
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
            autofocus
          />
        </UFormField>
        <UFormField label="Description">
          <UTextarea
            v-model="newIssue.description"
            placeholder="Describe the issue..."
            :rows="4"
          />
        </UFormField>
        <UFormField label="State">
          <USelect
            v-model="newIssue.state_id"
            :items="states.map((s) => ({ label: s.name, value: s.id }))"
            value-attribute="value"
            placeholder="Select state"
          />
        </UFormField>
        <UFormField label="Priority">
          <USelect
            v-model="newIssue.priority"
            :items="[
              { label: 'None', value: 'NONE' },
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Urgent', value: 'URGENT' },
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
  </UContainer>
</template>
