<script lang="ts" setup>
    import { ref } from 'vue';

    const selected = ref('All');
</script>

<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.go(-1)"
        ></v-btn>
        <p class="text-h5 text-primary my-5">Add Data Source Integration</p>
        <div class="d-flex justify-space-between">
            <v-text-field
                clearable
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                placeholder="Search integrations..."
            ></v-text-field>
            <div class="w-50 border rounded ml-4 px-4 py-2 d-flex justify-space-between">
                <div class="button-hover" :class="{ selected: selected === 'All' }" @click="selected = 'All'">
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">All</p>
                </div>
                <div
                    class="button-hover"
                    :class="{ selected: selected === 'Communication' }"
                    @click="selected = 'Communication'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Communication
                    </p>
                </div>
                <div
                    class="button-hover"
                    :class="{ selected: selected === 'Project Mgmt' }"
                    @click="selected = 'Project Mgmt'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Project Mgmt
                    </p>
                </div>
                <div
                    class="button-hover"
                    :class="{ selected: selected === 'Note Taking' }"
                    @click="selected = 'Note Taking'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Note Taking
                    </p>
                </div>
                <div class="button-hover" :class="{ selected: selected === 'Other' }" @click="selected = 'Other'">
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">Other</p>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap mt-6">
            <div v-for="n in 20" :key="n" class="ma-2 pa-6 border rounded">
                <div class="d-flex justify-start">
                    <v-avatar image="@/assets/notion.png" size="45"></v-avatar>
                    <div class="ml-4">
                        <p class="text-h6 text-primary">Notion</p>
                        <p class="text-caption text-secondary">Note Taking</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .border {
        border: 1px solid rgb(var(--v-theme-border-color));
    }

    .selected {
        background-color: rgb(var(--v-theme-background));
    }
</style>
