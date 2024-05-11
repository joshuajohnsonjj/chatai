<template>
    <div style="max-width: 800px">
        <div id="gradientTopper"></div>
        <v-text-field
            style="max-width: 800px"
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
        max-width: 800px;
        height: 50px;
        top: -70px;
        position: relative;
        background: none;
        background: linear-gradient(0deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 0) 100%);
    }

    .message-input {
        position: absolute;
        bottom: 20px;
        width: 95%;
        z-index: 100;
    }

    .send-btn {
        width: 37px !important;
        height: 37px !important;
        position: absolute;
        right: 0.75rem;
    }
</style>
