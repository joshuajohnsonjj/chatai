<template>
    <div v-if="$route.name === RouteName.MESSAGES" id="gradientTopper"></div>
    <div class="bg-surface">
        <v-text-field
            rows="1"
            placeholder="Ask me something..."
            variant="outlined"
            class="message-input"
            v-model="textField"
        >
            <v-btn class="bg-blue rounded send-btn" variant="tonal" icon="mdi-arrow-up" @click="sendMessage"></v-btn>
        </v-text-field>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useChatStore } from '../../stores/chat';
    import { useGoTo } from 'vuetify';
    import { RouteName } from '../../types/router';

    const chatStore = useChatStore();
    const goTo = useGoTo();

    const textField = ref<string>('');

    const scrollToBottom = () => {
        goTo('#bottom-of-chat-scroll', {
            container: '#chat-scroll',
            duration: 0,
        });
    };

    function sendMessage() {
        if (!textField.value.length) {
            return;
        }

        chatStore.sendMessage(textField.value);
        textField.value = '';
        scrollToBottom();
    }

    document.onkeydown = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else if (e.key == 'Escape') {
            chatStore.setReplyMode(null);
        }
    };
</script>

<style scoped>
    #gradientTopper {
        width: 850px;
        left: 0;
        right: 0;
        margin: auto;
        height: 50px;
        bottom: 73px;
        position: absolute;
        background: none;
        background: linear-gradient(0deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 0) 100%);
    }

    .message-input {
        position: absolute;
        bottom: 20px;
        z-index: 100;
        width: 850px;
        left: 0;
        right: 0;
        margin: auto;
    }

    .send-btn {
        width: 37px !important;
        height: 37px !important;
        position: absolute;
        right: 0.75rem;
    }
</style>
