<template>
    <div id="messageInputContainer" class="rounded" :class="{ 'active-border': isHovering }">
        <div
            v-if="$route.name === RouteName.MESSAGES"
            id="gradientTopper"
            ref="gradient"
            :class="{ 'z-100': !!replyingInThreadId }"
        ></div>

        <v-hover v-model="isHovering">
            <template v-slot:default="{ isHovering, props }">
                <v-textarea
                    placeholder="Ask me anything..."
                    density="compact"
                    no-resize
                    auto-grow
                    rows="2"
                    max-rows="5"
                    variant="solo"
                    flat
                    class="messageInput"
                    v-bind="props"
                    v-model="textField"
                    ref="textArea"
                    @input="onInput"
                ></v-textarea>
            </template>
        </v-hover>

        <v-btn id="sendBtn" class="bg-blue rounded" variant="tonal" icon="mdi-arrow-up" @click="sendMessage"></v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { ref, nextTick } from 'vue';
    import { useChatStore } from '../../stores/chat';
    import { useGoTo } from 'vuetify';
    import { RouteName } from '../../types/router';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import { useUserStore } from '../../stores/user';

    const emit = defineEmits(['replyModeExited', 'inputHeightChanged']);

    const chatStore = useChatStore();
    const { replyingInThreadId, selectedChat } = storeToRefs(chatStore);

    const userStore = useUserStore();

    const goTo = useGoTo();

    const route = useRoute();
    const router = useRouter();

    const textField = ref<string>('');
    const isHovering = ref(false);
    const textArea = ref<HTMLElement | null>(null);
    const gradient = ref<HTMLElement | null>(null);

    const scrollToBottom = () => {
        goTo('#bottom-of-chat-scroll', {
            container: '#chat-scroll',
            duration: 0,
        });
    };

    const onInput = async () => {
        await nextTick();

        if (!gradient.value || textArea.value) {
            return;
        }

        const newHeight = textArea.value!.clientHeight;
        if (newHeight < 70) {
            gradient.value!.style.bottom = '4.05rem';
            emit('inputHeightChanged', 0);
        } else if (newHeight < 95) {
            gradient.value!.style.bottom = '5.54rem';
            emit('inputHeightChanged', 1.5);
        } else if (newHeight < 120) {
            gradient.value!.style.bottom = '7.1rem';
            emit('inputHeightChanged', 3);
        } else {
            gradient.value!.style.bottom = '8.51rem';
            emit('inputHeightChanged', 4.5);
        }
    };

    const sendMessage = async () => {
        if (!textField.value.length) {
            return;
        }

        if (route.name === RouteName.MESSAGES) {
            chatStore.sendMessage(textField.value);
        } else {
            await chatStore.createNewChat(userStore.userEntityId);
            router.push({
                name: RouteName.MESSAGES,
                params: { chatId: selectedChat.value!.id },
                query: { create: 'true' },
            });
            chatStore.sendMessage(textField.value);
        }

        textField.value = '';
        scrollToBottom();
    };

    document.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        } else if (e.key == 'Escape') {
            emit('replyModeExited');
        }
    };
</script>

<style scoped>
    #messageInputContainer {
        position: relative;
        min-height: 4rem;
        z-index: 100;
        border: 1px solid rgb(var(--v-theme-border-color));
    }

    .active-border {
        border: 1px solid rgb(var(--v-theme-primary)) !important;
    }

    #gradientTopper {
        width: 805px;
        left: -4px;
        right: 0;
        margin: auto;
        height: 50px;
        bottom: 4.05rem;
        position: absolute;
        pointer-events: none;
        background: none;
        background: linear-gradient(0deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 0) 100%);
    }

    .messageInput {
        width: 725px;
    }

    #sendBtn {
        width: 37px !important;
        height: 37px !important;
        position: absolute;
        right: 0.75rem;
        bottom: 0.75rem;
    }
</style>
