<template>
    <div class="w-100 relative" :class="parentClass">
        <div
            class="horizantile-line"
            :class="`${mr ? 'mr-' + mr : ''} ${ml ? 'ml-' + ml : ''}`"
            :style="`border-width: ${thinkness ?? '1px'}`"
        ></div>
        <div v-if="withText" class="line-text-overlay text-center bg-background">{{ withText }}</div>
    </div>
</template>

<script lang="ts" setup>
    defineProps<{
        withText?: string;
        parentClass?: string;
        thinkness?: string;
        mr?: number;
        ml?: number;
    }>();
</script>

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
