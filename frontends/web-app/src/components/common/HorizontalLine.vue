<script lang="ts" setup>
    defineProps<{
        withText?: string;
        parentClass?: string;
    }>();
</script>

<template>
    <div class="w-100" :class="parentClass" style="position: relative">
        <div class="horizantile-line"></div>
        <div v-if="withText" class="line-text-overlay text-center bg-background">{{ withText }}</div>
    </div>
</template>

<style scoped>
    .horizantile-line {
        border-top: 1px solid rgb(var(--v-theme-border-color));
    }

    .line-text-overlay {
        position: absolute;
        left: 45%;
        top: -12px;
        width: 60px;
    }
</style>
