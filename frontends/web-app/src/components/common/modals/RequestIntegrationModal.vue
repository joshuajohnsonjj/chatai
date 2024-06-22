<template>
    <div class="d-flex justify-center dialog-container" v-if="isOpen">
        <div
            class="align-self-center bg-surface rounded dialog-modal shadow pa-8"
            :style="maxWidth ? `max-width: ${maxWidth}` : ''"
        >
            <v-btn
                variant="plain"
                icon="mdi-close"
                style="position: absolute; top: 5px; right: 5px"
                @click="$emit('modalChange', false)"
            ></v-btn>

            <div class="text-primary text-center text-h5 mb-2">Request new integration</div>
            <div class="text-primary text-center text-body-2 mb-12">
                Our team is constantly adding new integrations and we'd love to hear what you'd like to see next
            </div>

            <div class="text-primary text-caption font-weight-bold">Website address</div>
            <v-text-field
                variant="outlined"
                hide-details
                v-model="input"
                placeholder="https://domain.com"
                @click:append-inner="input = ''"
            ></v-text-field>

            <v-btn class="w-100 mt-6" color="blue" variant="tonal">submit</v-btn>
        </div>
    </div>
    <FullScreenBackgroundBlur v-if="isOpen" @click="$emit('modalChange', false)" />
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    const input = ref<string>('');

    defineProps<{
        maxWidth?: string;
        isOpen: boolean;
    }>();

    defineEmits(['modalChange']);
</script>

<style scoped>
    .dialog-container {
        position: absolute;
        width: 100%;
        left: 0;
        height: 100%;
        top: 0;
    }

    .dialog-modal {
        z-index: 100;
        position: relative;
    }
</style>
