<template>
    <div style="width: 150px; display: inline-block" class="grow-hover mr-6">
        <div class="container mr-4 relative" :class="{ dark: darkMode, light: !darkMode }">
            <div class="sub-container absolute pa-4" :class="{ dark: darkMode, light: !darkMode }">
                <div class="text text-body-1 font-weight-bold" :class="{ dark: darkMode, light: !darkMode }">Aa</div>
            </div>

            <div v-if="isSelected" class="selected-badge">
                <v-icon icon="mdi-check-bold" size="x-small" color="success"></v-icon>
            </div>
        </div>

        <div class="text-primary text-body-1 text-center mt-4">{{ darkMode ? 'Dark mode' : 'Light mode' }}</div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        darkMode: boolean;
        isSelected: boolean;
    }>();
</script>

<style scoped>
    .container {
        width: 150px;
        height: 90px;
        border-radius: 1rem;
    }

    .container.dark {
        background-color: rgb(var(--v-theme-surface));
    }

    .container.light {
        background-color: rgb(var(--v-theme-border-color));
    }

    .sub-container {
        bottom: 0;
        right: 0;
        width: 80%;
        height: 70%;
        border-radius: 1rem 0 1rem 0;
    }

    .sub-container.dark {
        background-color: rgb(var(--v-theme-background));
        border-top: 1px solid rgb(var(--v-theme-border-color));
        border-left: 1px solid rgb(var(--v-theme-border-color));
    }

    .sub-container.light {
        background-color: white;
        border-top: 1px solid black;
        border-left: 1px solid black;
    }

    .text.dark {
        color: rgb(var(--v-theme-primary));
    }

    .text.light {
        color: black;
    }

    .selected-badge {
        background: rgba(var(--v-theme-success), 0.25);
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 3px 6px;
        border-radius: 50%;
        font-size: 12px;
    }
</style>
