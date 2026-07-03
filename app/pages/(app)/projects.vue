<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const client = useZenStackClient();
const { setHeader, setPrimaryAction, resetHeader } = useAppHeader();

const { data: user, error: userError } = await useFetch("/api/me", {
    headers: useRequestHeaders(["cookie"]),
});

const {
    data: projects,
    error: projectsError,
    refresh: refreshProjects,
} = await useAsyncData(
    "projects",
    () =>
        client.project.findMany({
            where: { archivedAt: null },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                identifier: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    { default: () => [] },
);

const createProjectOpen = ref(false);
const createProjectLoading = ref(false);
const createProjectError = ref("");

const createProjectSchema = z.object({
    name: z.string().trim().min(1, "Project name is required"),
    identifier: z
        .string()
        .trim()
        .min(2, "Identifier must be at least 2 characters")
        .max(10, "Identifier must be at most 10 characters")
        .regex(
            /^[A-Za-z0-9_-]+$/,
            "Use letters, numbers, hyphens, or underscores",
        ),
    description: z.string().trim().optional(),
});

type CreateProjectSchema = z.output<typeof createProjectSchema>;

const createProjectState = reactive<CreateProjectSchema>({
    name: "",
    identifier: "",
    description: "",
});

function resetCreateProjectForm() {
    createProjectState.name = "";
    createProjectState.identifier = "";
    createProjectState.description = "";
    createProjectError.value = "";
}

function closeCreateProjectDrawer() {
    createProjectOpen.value = false;
}

function openCreateProjectDrawer() {
    createProjectOpen.value = true;
}

function getFetchErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "statusMessage" in error) {
        const statusMessage = (error as { statusMessage?: unknown })
            .statusMessage;
        if (typeof statusMessage === "string") return statusMessage;
    }

    return error instanceof Error ? error.message : "Unable to create project.";
}

async function createProject(event: FormSubmitEvent<CreateProjectSchema>) {
    createProjectError.value = "";
    createProjectLoading.value = true;

    try {
        if (!user.value) {
            throw new Error("User profile has not loaded yet.");
        }

        await client.project.create({
            data: {
                name: event.data.name,
                identifier: event.data.identifier.toUpperCase(),
                description: event.data.description || undefined,
                createdById: user.value.id,
                leadId: user.value.id,
                members: {
                    create: {
                        userId: user.value.id,
                        role: "ADMIN",
                    },
                },
            },
            select: {
                id: true,
                name: true,
                identifier: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await refreshProjects();
        createProjectOpen.value = false;
        resetCreateProjectForm();
    } catch (error) {
        createProjectError.value = getFetchErrorMessage(error);
    } finally {
        createProjectLoading.value = false;
    }
}

setHeader({
    breadcrumbs: [{ label: "Projects", to: "/projects" }],
});
setPrimaryAction(
    {
        label: "New project",
        icon: "i-lucide-plus",
    },
    openCreateProjectDrawer,
);
onUnmounted(resetHeader);
</script>

<template>
    <UContainer class="space-y-6 py-6">
        <UAlert
            v-if="userError"
            color="error"
            icon="i-lucide-alert-circle"
            title="Unable to load your profile"
            :description="userError.statusMessage ?? 'Try signing in again.'"
        />

        <UAlert
            v-else-if="projectsError"
            color="error"
            icon="i-lucide-alert-circle"
            title="Unable to load projects"
            :description="
                projectsError.statusMessage ?? 'Try refreshing the page.'
            "
        />

        <template v-else>
            <div class="space-y-1">
                <p class="text-sm text-muted">Welcome back</p>
                <h1 class="text-2xl font-semibold text-highlighted">
                    {{ user?.name }}
                </h1>
                <p class="text-sm text-muted">{{ user?.email }}</p>
            </div>

            <AppSidePanel
                v-model:open="createProjectOpen"
                title="New project"
                description="Create a project to organize issues, workflow states, and boards."
                @update:open="
                    (open) => {
                        if (!open) resetCreateProjectForm();
                    }
                "
            >
                <UAlert
                    v-if="createProjectError"
                    color="error"
                    icon="i-lucide-alert-circle"
                    title="Unable to create project"
                    :description="createProjectError"
                    class="mb-4"
                />

                <UForm
                    id="create-project-form"
                    :schema="createProjectSchema"
                    :state="createProjectState"
                    class="space-y-4"
                    @submit="createProject"
                >
                    <UFormField label="Project name" name="name" required>
                        <UInput
                            v-model="createProjectState.name"
                            placeholder="Website redesign"
                            class="w-full"
                            autofocus
                        />
                    </UFormField>

                    <UFormField
                        label="Identifier"
                        name="identifier"
                        description="Short key used in issue numbers, like WEB-1."
                        required
                    >
                        <UInput
                            v-model="createProjectState.identifier"
                            placeholder="WEB"
                            class="w-full"
                            @blur="
                                createProjectState.identifier =
                                    createProjectState.identifier.toUpperCase()
                            "
                        />
                    </UFormField>

                    <UFormField label="Description" name="description">
                        <UTextarea
                            v-model="createProjectState.description"
                            placeholder="Optional project context"
                            :rows="4"
                            class="w-full"
                        />
                    </UFormField>
                </UForm>

                <template #footer>
                    <div class="flex justify-between gap-2">
                        <UButton
                            type="button"
                            color="neutral"
                            variant="outline"
                            label="Cancel"
                            @click="closeCreateProjectDrawer"
                        />
                        <UButton
                            type="submit"
                            form="create-project-form"
                            label="Create project"
                            icon="i-lucide-plus"
                            :loading="createProjectLoading"
                        />
                    </div>
                </template>
            </AppSidePanel>

            <UEmpty
                v-if="projects.length === 0"
                icon="i-lucide-folder-kanban"
                title="No projects yet"
                description="Create your first project to start shaping issues, workflow states, and boards."
            />

            <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <UPageCard
                    v-for="project in projects"
                    :key="project.id"
                    :title="project.name"
                    :description="project.description ?? 'No description yet.'"
                >
                    <template #footer>
                        <UBadge color="neutral" variant="subtle">
                            {{ project.identifier }}
                        </UBadge>
                    </template>
                </UPageCard>
            </div>
        </template>
    </UContainer>
</template>
