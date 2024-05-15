<template>
    <div class="bg-surface-bright rounded py-2 px-4 d-flex">
        <v-avatar image="@/assets/avatar.jpg" size="32"></v-avatar>
        <p class="ml-4 mt-1 me-auto text-body-1 text-primary">{{ text }}</p>

        <v-btn variant="plain" color="secondary" style="height: 30px; width: 30px">
            <v-icon icon="mdi-square-edit-outline" size="large"></v-icon>
            <v-tooltip text="Edit prompt" activator="parent" location="top"></v-tooltip>
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
    defineProps<{
        text: string;
    }>();
</script>
