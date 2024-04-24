<template>
    <v-text-field rows="1" placeholder="Ask me something..." variant="outlined" class="message-input" v-model="textField">
        <v-btn
            class="bg-blue rounded send-btn"
            variant="tonal"
            icon="mdi-arrow-up"
            @click="
                chatStore.sendMessage(textField);
                textField = '';
                scrollToBottom();
            "
        ></v-btn>
    </v-text-field>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useChatStore } from '../../stores/chat';
import last from 'lodash/last';

const chatStore = useChatStore();

const textField = ref<string>();

const scrollToBottom = () => {
    last(document.getElementById('chat-scroll')!.children)!.scrollIntoView(false);
}

</script>

<style scoped>
.message-input {
    position: absolute;
    bottom: 20px;
    width: 95%;
}

.send-btn {
    width: 37px !important; 
    height: 37px !important; 
    position: absolute; 
    right: 0.75rem;
}
</style>