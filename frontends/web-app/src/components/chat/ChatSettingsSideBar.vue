<template>
    <div id="chat-settings-container" class="pt-6 pl-6 bg-surface">
        <div class="text-primary text-h5 font-weight-medium">Configuration</div>
        <div class="text-secondary text-caption">
            Configure settings for this chat. By default, chats adhere to your global chat settings configuration.
        </div>

        <div class="d-flex justify-start mt-8">
            <div class="text-primary text-body-1 font-weight-medium">Creativity</div>

            <v-tooltip :text="ChatConfigurationTooltips.creativity" location="top" max-width="300">
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

            <v-tooltip :text="ChatConfigurationTooltips.confidence" location="top" max-width="300">
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
            <div class="text-primary text-body-1 font-weight-medium">Tone</div>

            <v-tooltip :text="ChatConfigurationTooltips.tone" location="top" max-width="300">
                <template v-slot:activator="{ props }">
                    <sup v-bind="props">
                        <v-icon icon="mdi-information-outline" size="x-small" color="primary"></v-icon>
                    </sup>
                </template>
            </v-tooltip>
        </div>
        <v-select
            :items="[ChatResponseTone.CASUAL, ChatResponseTone.DEFAULT, ChatResponseTone.PROFESSIONAL]"
            density="compact"
            v-model="tone"
        ></v-select>

        <div class="d-flex justify-start mt-5">
            <div class="text-primary text-body-1 font-weight-medium">Base Instructions</div>

            <v-tooltip :text="ChatConfigurationTooltips.basePrompt" location="top" max-width="300">
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

        <v-btn variant="text" color="success" class="w-100 mt-8" @click="onApply" :loading="isLoading.chatUpdate"
            >Apply changes</v-btn
        >
        <v-btn variant="text" color="secondary" class="w-100 mt-4" @click="$router.push($route.path)">cancel</v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { onBeforeMount, ref } from 'vue';
    import { ChatConfigurationTooltips } from '../../constants/chatConfigurationTooltips';
    import { ChatResponseTone } from '../../types/chat-store';
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../../stores/chat';
    import { useRoute, useRouter } from 'vue-router';
    import { useUserStore } from '../../stores/user';

    const chatStore = useChatStore();
    const { selectedChat, isLoading } = storeToRefs(chatStore);
    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const router = useRouter();
    const route = useRoute();

    const creativity = ref<number | null>(
        selectedChat.value?.chatCreativity ?? userData.value?.settings.chatCreativity ?? null,
    );
    const confidence = ref<number | null>(
        selectedChat.value?.chatMinConfidence ?? userData.value?.settings.chatMinConfidence ?? null,
    );
    const tone = ref<ChatResponseTone | null>(
        selectedChat.value?.chatTone ?? userData.value?.settings.chatTone ?? null,
    );
    const instructions = ref<string>(
        selectedChat.value?.baseInstructions ?? userData.value?.settings.baseInstructions ?? '',
    );

    onBeforeMount(async () => {
        if (!selectedChat.value) {
            router.push(route.path);
        }
    });

    const onApply = async () => {
        await chatStore.updateChat(selectedChat.value!.id, {
            chatCreativity: creativity.value as number,
            chatMinConfidence: confidence.value as number,
            chatTone: tone.value as ChatResponseTone,
            baseInstructions: instructions.value,
        });
    };
</script>

<style scoped>
    #chat-settings-container {
        margin-top: 5rem;
        height: 85vh;
        width: 250px;
        z-index: 100;
        margin-left: 1rem;
        border-left: 1px solid rgb(var(--v-theme-border-color));
        border-top: 1px solid rgb(var(--v-theme-border-color));
    }
</style>
