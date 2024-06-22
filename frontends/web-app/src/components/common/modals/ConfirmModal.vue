<template>
    <div class="d-flex justify-center dialog-container">
        <div
            class="align-self-center bg-surface rounded dialog-modal shadow pa-8"
            :style="maxWidth ? `max-width: ${maxWidth}px` : ''"
        >
            <v-btn
                variant="plain"
                icon="mdi-close"
                style="position: absolute; top: 5px; right: -2px"
                @click="$emit('closeModal')"
            ></v-btn>

            <div class="text-primary text-center text-h5 mb-2 mt-2">{{ title }}</div>
            <div class="text-primary text-center text-body-2 mb-4">
                {{ subTitle }}
            </div>

            <div class="d-flex justify-end mt-14">
                <v-btn color="secondary" variant="tonal" @click="$emit('closeModal')">cancel</v-btn>
                <v-btn
                    class="ml-4"
                    :color="buttonTheme ?? 'blue'"
                    variant="tonal"
                    @click="
                        $emit('confirmed');
                        $emit('closeModal');
                    "
                    >confirm</v-btn
                >
            </div>
        </div>
    </div>
    <FullScreenBackgroundBlur @click="$emit('closeModal')" />
</template>

<script lang="ts" setup>
    defineProps<{
        maxWidth?: number;
        title: string;
        subTitle?: number;
        buttonTheme?: string;
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
