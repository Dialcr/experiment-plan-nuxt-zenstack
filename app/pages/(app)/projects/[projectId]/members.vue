<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProjectResponse } from "~~/server/lib/project";
import type { MemberResponse } from "~~/server/lib/member";

const route = useRoute();
const projectId = route.params.projectId as string;

const { setHeader, resetHeader } = useAppHeader();

const { data: project } = await useAsyncData<ProjectResponse>(`project-${projectId}`, () =>
  serverFetch(`/api/projects/${projectId}`),
);

const { data: members, refresh: refreshMembers } = await useAsyncData<MemberResponse[]>(
  `members-${projectId}-page`,
  () => serverFetch(`/api/projects/${projectId}/members`),
  { default: () => [] },
);

const saving = ref(false);
const error = ref("");
const showForm = ref(false);
const editingMember = ref<{ user_id: string; role: string } | null>(null);

const memberSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

const roleForm = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

type MemberForm = z.output<typeof memberSchema>;

const formState = reactive<MemberForm>({
  user_id: "",
  role: "MEMBER",
});

async function save(event: FormSubmitEvent<MemberForm>) {
  saving.value = true;
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: event.data,
    });
    showForm.value = false;
    formState.user_id = "";
    formState.role = "MEMBER";
    await refreshMembers();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to add member";
  } finally {
    saving.value = false;
  }
}

async function updateRole(userId: string, role: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: { role },
    });
    await refreshMembers();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to update member";
  }
}

async function toggleActive(userId: string, current: boolean) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: { is_active: !current },
    });
    await refreshMembers();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to update member";
  }
}

async function removeMember(userId: string) {
  error.value = "";
  try {
    await serverFetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    });
    await refreshMembers();
  } catch (e: any) {
    error.value = e?.statusMessage ?? e?.message ?? "Failed to remove member";
  }
}

const roleColors: Record<string, string> = {
  ADMIN: "text-red-500",
  MEMBER: "text-blue-500",
  VIEWER: "text-(--ui-text-muted)",
};

watch(
  () => project.value,
  (proj) => {
    if (proj) {
      setHeader({
        breadcrumbs: [
          { label: "Projects", to: "/projects" },
          { label: proj.name, to: `/projects/${projectId}` },
          { label: "Members", to: `/projects/${projectId}/members` },
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
      <h3 class="text-lg font-semibold">Members</h3>
      <UButton
        icon="i-lucide-user-plus"
        label="Add member"
        size="sm"
        @click="showForm = !showForm"
      />
    </div>

    <UCard v-if="showForm" class="mb-4">
      <UForm
        :schema="memberSchema"
        :state="formState"
        class="space-y-4"
        @submit="save"
      >
        <UFormField label="User ID" name="user_id" required>
          <UInput
            v-model="formState.user_id"
            class="w-full"
            placeholder="Supabase user ID"
          />
        </UFormField>
        <UFormField label="Role" name="role">
          <USelect
            v-model="formState.role"
            :items="[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Member', value: 'MEMBER' },
              { label: 'Viewer', value: 'VIEWER' },
            ]"
            value-attribute="value"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton type="submit" label="Add" :loading="saving" />
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
        v-for="member in members"
        :key="member.user_id"
        class="flex items-center gap-3 px-4 py-3 border-b border-(--ui-border) last:border-b-0"
      >
        <UAvatar
          :src="member.avatar_url ?? undefined"
          :alt="member.name"
          size="sm"
        />
        <div class="flex-1 min-w-0">
          <span class="text-sm font-medium block truncate">{{
            member.name
          }}</span>
          <span class="text-xs text-(--ui-text-muted) block truncate">{{
            member.email
          }}</span>
        </div>
        <UBadge
          v-if="!member.is_active"
          size="xs"
          color="warning"
          variant="subtle"
          class="shrink-0"
        >
          Inactive
        </UBadge>
        <USelect
          :model-value="member.role"
          :items="[
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Member', value: 'MEMBER' },
            { label: 'Viewer', value: 'VIEWER' },
          ]"
          value-attribute="value"
          class="w-28"
          @update:model-value="(v: string) => updateRole(member.user_id, v)"
        />
        <UButton
          :icon="member.is_active ? 'i-lucide-user-x' : 'i-lucide-user-check'"
          size="2xs"
          :color="member.is_active ? 'warning' : 'success'"
          variant="ghost"
          :label="member.is_active ? 'Deactivate' : 'Activate'"
          @click="toggleActive(member.user_id, member.is_active)"
        />
        <UButton
          icon="i-lucide-user-minus"
          size="2xs"
          color="error"
          variant="ghost"
          label="Remove"
          @click="removeMember(member.user_id)"
        />
      </div>
      <div
        v-if="members.length === 0"
        class="px-4 py-8 text-center text-sm text-(--ui-text-muted)"
      >
        No members yet
      </div>
    </UCard>
  </UContainer>
</template>
