<script setup lang="ts">
import type { IssueResponse, UserView, LabelView } from "~/server/lib/issue";

const props = defineProps<{
  issue: IssueResponse | null;
  states: Array<{ id: string; name: string; color: string; group: string }>;
  members: Array<{ user_id: string; name: string; role: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  projectId: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
  deleted: [];
}>();

const open = defineModel<boolean>("open", { default: false });

const saving = ref(false);
const deleting = ref(false);
const error = ref("");
const showDeleteConfirm = ref(false);

const editState = reactive({
  title: "",
  description: "",
  priority: "NONE",
  state_id: "",
});

const selectedLabelIds = ref<string[]>([]);
const selectedAssigneeIds = ref<string[]>([]);
const newComment = ref("");
const postingComment = ref(false);

watch(
  () => props.issue,
  (issue) => {
    if (issue) {
      editState.title = issue.title;
      editState.description = issue.description ?? "";
      editState.priority = issue.priority;
      editState.state_id = issue.state_id;
      selectedLabelIds.value = issue.labels.map((l) => l.id);
      selectedAssigneeIds.value = issue.assignees.map((a) => a.id);
    }
  },
  { immediate: true },
);

async function save() {
  if (!props.issue) return;
  saving.value = true;
  error.value = "";
  try {
    await $fetch(`/api/projects/${props.projectId}/issues/${props.issue.id}`, {
      method: "PATCH",
      body: {
        title: editState.title,
        description: editState.description || null,
        priority: editState.priority,
        state_id: editState.state_id,
        label_ids: selectedLabelIds.value,
        assignee_ids: selectedAssigneeIds.value,
      },
    });
    emit("saved");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to save issue";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.issue) return;
  deleting.value = true;
  error.value = "";
  try {
    await $fetch(`/api/projects/${props.projectId}/issues/${props.issue.id}`, {
      method: "DELETE",
    });
    showDeleteConfirm.value = false;
    open.value = false;
    emit("deleted");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to delete issue";
  } finally {
    deleting.value = false;
  }
}

async function postComment() {
  if (!newComment.value.trim() || !props.issue) return;
  postingComment.value = true;
  try {
    await $fetch(`/api/projects/${props.projectId}/issues/${props.issue.id}/comments`, {
      method: "POST",
      body: { body: newComment.value.trim() },
    });
    newComment.value = "";
    emit("saved");
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to post comment";
  } finally {
    postingComment.value = false;
  }
}
</script>

<template>
  <AppSidePanel
    v-model:open="open"
    :title="issue ? issue.key : 'Issue'"
    :description="issue?.title"
    content-class="w-full sm:max-w-lg"
    @update:open="(v: boolean) => { if (!v) emit('close'); }"
  >
    <template v-if="!issue">
      <div class="flex items-center justify-center h-32 text-sm text-(--ui-text-muted)">
        Select an issue
      </div>
    </template>

    <template v-else>
      <UAlert v-if="error" color="error" icon="i-lucide-alert-circle" :description="error" class="mb-4" />

      <div class="space-y-5">
        <UFormField label="Title">
          <UInput v-model="editState.title" class="w-full" />
        </UFormField>

        <UFormField label="Description">
          <UTextarea v-model="editState.description" :rows="4" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="State">
            <USelect
              v-model="editState.state_id"
              :items="states.map((s) => ({ label: s.name, value: s.id }))"
              value-attribute="value"
            />
          </UFormField>

          <UFormField label="Priority">
            <USelect
              v-model="editState.priority"
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

        <UFormField label="Assignees">
          <USelect
            v-model="selectedAssigneeIds"
            :items="members.map((m) => ({ label: m.name, value: m.user_id }))"
            value-attribute="value"
            multiple
            class="w-full"
          />
        </UFormField>

        <UFormField label="Labels">
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="label in labels"
              :key="label.id"
              size="xs"
              :variant="selectedLabelIds.includes(label.id) ? 'solid' : 'outline'"
              :label="label.name"
              @click="
                selectedLabelIds.includes(label.id)
                  ? selectedLabelIds = selectedLabelIds.filter((id) => id !== label.id)
                  : selectedLabelIds.push(label.id)
              "
            />
          </div>
        </UFormField>

        <div class="flex items-center gap-2 pt-2 border-t border-(--ui-border)">
          <span class="text-xs text-(--ui-text-muted)">
            Created {{ new Date(issue.created_at).toLocaleDateString() }}
          </span>
          <span v-if="issue.completed_at" class="text-xs text-green-500 ml-auto">
            Completed {{ new Date(issue.completed_at).toLocaleDateString() }}
          </span>
        </div>

        <div class="space-y-3 border-t border-(--ui-border) pt-4">
          <h4 class="text-sm font-semibold">
            Comments ({{ issue.comment_count }})
          </h4>
        </div>

        <UForm class="flex gap-2" @submit="postComment">
          <UInput v-model="newComment" placeholder="Add a comment..." class="flex-1" />
          <UButton type="submit" icon="i-lucide-send" :loading="postingComment" size="sm" />
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          v-if="issue"
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          label="Delete"
          @click="showDeleteConfirm = true"
        />
        <UButton
          type="submit"
          color="primary"
          :label="issue ? 'Save changes' : 'Close'"
          :loading="saving"
          :disabled="saving"
          class="ml-auto"
          @click="issue ? save() : emit('close')"
        />
      </div>
    </template>

    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      title="Delete issue?"
      description="This action cannot be undone."
      confirm-label="Delete"
      color="error"
      @confirm="remove"
    />
  </AppSidePanel>
</template>
