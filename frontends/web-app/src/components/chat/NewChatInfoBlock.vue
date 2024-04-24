<script lang="ts" setup>
    defineProps<{
        color: string;
        icon: string;
        title: string;
        content: string[];
    }>();
</script>

<template>
    <div class="rounded-lg container pa-4">
        <div class="d-flex justify-start">
            <div class="badge-container rounded" :class="`bg-${color}`">
                <v-icon :icon="icon"></v-icon>
            </div>
            <p class="text-h5 text-primary pl-4" style="line-height: 40px">{{ title }}</p>
        </div>

        <div v-for="text in content" :key="text" class="bg-surface-bright text-caption text-primary pa-2 rounded mt-4">
            “{{ text }}”
        </div>
    </div>
</template>

<style scoped>
    .container {
        border: 1px solid rgb(var(--v-theme-border-color));
        max-width: 31%;
    }

    .badge-container {
        width: 40px;
        height: 40px;
        text-align: center;
        line-height: 38px;
    }
</style>
