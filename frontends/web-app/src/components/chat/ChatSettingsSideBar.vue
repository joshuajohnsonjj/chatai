<template>
    <div id="chat-settings-container" class="pt-6 pl-6">
        <div class="text-primary text-h5 font-weight-medium">Configuration</div>
        <div class="text-secondary text-caption">
            Configure settings for this chat. By default, chats adhere to your global chat settings configuration.
        </div>

        <div class="d-flex justify-start mt-8">
            <div class="text-primary text-body-1 font-weight-medium">Creativity</div>

            <v-tooltip text="How much it sticks to the data" location="top" max-width="300">
                <template v-slot:activator="{ props }">
                    <sup v-bind="props">
                        <v-icon icon="mdi-information-outline" size="x-small" color="primary"></v-icon>
                    </sup>
                </template>
            </v-tooltip>

            <div class="ml-auto mr-4 text-primary text-body-1 font-weight-medium">{{ creativity }}</div>
        </div>
        <v-slider color="info" min="1" max="9" step="1" v-model="creativity"></v-slider>

        <div class="d-flex justify-start mt-4">
            <div class="text-primary text-body-1 font-weight-medium">Min Confidence</div>

            <v-tooltip text="How much it sticks to the data" location="top" max-width="300">
                <template v-slot:activator="{ props }">
                    <sup v-bind="props">
                        <v-icon icon="mdi-information-outline" size="x-small" color="primary"></v-icon>
                    </sup>
                </template>
            </v-tooltip>

            <div class="ml-auto mr-4 text-primary text-body-1 font-weight-medium">{{ confidence }}</div>
        </div>
        <v-slider color="info" min="1" max="9" step="1" v-model="confidence"></v-slider>

        <div class="d-flex justify-start mt-4">
            <div class="text-primary text-body-1 font-weight-medium">Verbosity</div>

            <v-tooltip text="How much it sticks to the data" location="top" max-width="300">
                <template v-slot:activator="{ props }">
                    <sup v-bind="props">
                        <v-icon icon="mdi-information-outline" size="x-small" color="primary"></v-icon>
                    </sup>
                </template>
            </v-tooltip>

            <div class="ml-auto mr-4 text-primary text-body-1 font-weight-medium">{{ verbosity }}</div>
        </div>
        <v-slider color="info" min="1" max="9" step="1" v-model="verbosity"></v-slider>

        <div class="d-flex justify-start mt-4">
            <div class="text-primary text-body-1 font-weight-medium">Base Instructions</div>

            <v-tooltip text="How much it sticks to the data" location="top" max-width="300">
                <template v-slot:activator="{ props }">
                    <sup v-bind="props">
                        <v-icon icon="mdi-information-outline" size="x-small" color="primary"></v-icon>
                    </sup>
                </template>
            </v-tooltip>
        </div>
        <v-textarea
            row-height="30"
            rows="3"
            variant="filled"
            shaped
            no-resize
            counter
            max-chars="240"
            v-model="instructions"
        >
        </v-textarea>
        <div class="text-primary text-caption text-right">{{ instructions.length }}/240</div>

        <v-btn variant="text" color="success" class="w-100 mt-8" :disabled="true">Apply changes</v-btn>
        <v-btn variant="text" color="warning" class="w-100 mt-4">Archive chat</v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    const creativity = ref<number>(3);
    const confidence = ref<number>(8);
    const verbosity = ref<number>(6);
    const instructions = ref<string>('Responses should be in formed like blah blah blah...');
</script>

<style scoped>
    #chat-settings-container {
        margin-top: 5rem;
        height: 85vh;
        width: 250px;
        margin-left: 1rem;
        border-left: 1px solid rgb(var(--v-theme-border-color));
    }
</style>
