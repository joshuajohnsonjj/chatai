<template>
    <div
        class="border-primary rounded ma-4 grow-hover"
        :class="{ selected: name === selectedPlan }"
        @click="
            selectedPlan = name;
            $emit('selected', name);
        "
    >
        <div class="plan-header pa-4 bottom-border-primary bottom-border-primary">
            <div class="text-h5 text-primary font-weight-bold w-100 text-center">{{ name }}</div>
            <div class="text-body-1 text-secondary w-100 text-center">{{ description }}</div>
        </div>
        <div class="px-4 pb-6">
            <div class="d-flex justify-center">
                <div class="text-h4 text-primary font-weight-bold py-6">
                    {{ price === 0 ? 'FREE' : `$${price}` }}
                </div>
                <div class="text-body-1 text-primary font-weight-bold py-6 mt-4" v-if="price > 0">/mo</div>
            </div>
            <div v-for="feature in features" :key="feature.text" class="d-flex justify-start px-6">
                <v-icon v-if="feature.enabled" icon="mdi-check-bold" color="success"></v-icon>
                <v-icon v-else icon="mdi-close-thick" color="secondary"></v-icon>
                <div class="ml-2 text-body-1 text-primary py-1" :class="{ disabled: !feature.enabled }">
                    {{ feature.text }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    defineProps<{
        name: string;
        description: string;
        price: number;
        features: {
            text: string;
            enabled: boolean;
        }[];
    }>();

    defineEmits(['selected']);

    const selectedPlan = ref<string | null>(null);
</script>

<style scoped>
    .disabled {
        color: rgb(var(--v-theme-secondary)) !important;
        text-decoration: line-through;
    }

    .selected {
        border: 2px solid rgb(var(--v-theme-success));
    }

    .selected .plan-header {
        border-bottom: 2px solid rgb(var(--v-theme-success));
    }
</style>
