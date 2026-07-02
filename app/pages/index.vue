<script setup lang="ts">
import { Button, Card } from "frappe-ui";
</script>

<template>
    <main
        class="flex min-h-screen items-center justify-center bg-surface-gray-1 px-4 py-10"
    >
        <Card
            class="w-full max-w-xl text-center"
            title="Frappe UI auth form playground"
            subtitle="Try a simple pair of login and signup pages built with Frappe UI components."
        >
            <div class="flex justify-center gap-2">
                <Button route="/login">Log in</Button>
                <Button route="/signup" variant="solid" theme="blue">
                    Create account
                </Button>
            </div>
        </Card>
    </main>
</template>
