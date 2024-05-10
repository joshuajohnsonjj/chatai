<template>
    <div class="d-flex justify-center dialog-container">
        <div
            class="align-self-center bg-surface rounded dialog-modal shadow pa-8"
            :style="maxWidth ? `max-width: ${maxWidth}px` : ''"
        >
            <v-btn
                variant="plain"
                icon="mdi-close"
                style="position: absolute; top: 5px; right: 5px"
                @click="$emit('closeModal')"
            ></v-btn>

            <div class="text-primary text-center text-h5 mb-2">{{ title }}</div>
            <div class="text-primary text-center text-body-2 mb-4">
                {{ subTitle }}
            </div>

            <v-btn
                class="w-100 mt-6"
                color="blue"
                variant="tonal"
                @click="
                    $emit('confirmed');
                    $emit('closeModal');
                "
                >confirm</v-btn
            >
            <v-btn class="w-100 mt-6" color="secondary" variant="tonal" @click="$emit('closeModal')">cancel</v-btn>
        </div>
    </div>
    <FullScreenBackgroundBlur @click="$emit('closeModal')" />
</template>

<script lang="ts" setup>
    defineProps<{
        maxWidth?: number;
        title: string;
        subTitle?: number;
    }>();

    defineEmits(['closeModal', 'confirmed']);
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
