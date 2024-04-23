<script lang="ts" setup>
    //
</script>

<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6" style="position: relative;">
        <div v-if="$route.name === 'chats'">
            <p class="text-h4 font-weight-medium w-100 text-center text-primary pt-14">
                Start Conversation
            </p>
            <p class="text-caption w-100 text-secondary text-center">
                Gain valuable insights related to your data. Ask me anything.
            </p>
    
            <div class="d-flex justify-space-between mt-14">
                <NewChatInfoBlock 
                    color="info"
                    icon="mdi-text"
                    title="Examples"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
                <NewChatInfoBlock 
                    color="success"
                    title="Capabilities"
                    icon="mdi-rocket-launch-outline"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
                <NewChatInfoBlock 
                    color="warning"
                    title="Limitations"
                    icon="mdi-head-alert-outline"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
            </div>
        </div>
        
        <div v-else>
            <div class="w-100 bg-surface header-container">
                <div class="d-flex justify-space-between">
                    <p class="text-h4 font-weight-medium text-primary pt-6 pb-4 pl-6">
                        Special Project
                    </p>
                    <div class="pr-6 pt-4">
                        <v-btn variant="plain" icon="mdi-star-outline"></v-btn>
                        <v-btn variant="plain" icon="mdi-dots-horizontal"></v-btn>
                    </div>
                </div>
            </div>
        </div>

        <v-text-field rows="1" placeholder="Ask me something..." variant="outlined" class="message-input">
            <div class="py-2 px-3 bg-blue rounded" style="position: absolute; right: 1rem">
                <v-icon icon="mdi-arrow-up"></v-icon>
            </div>
        </v-text-field>
    </div>
</template>

<style scoped>
.message-input {
    position: absolute;
    bottom: 20px;
    width: 95%;
}

.header-container {
    position: absolute;
    left: 0;
    border-radius: 24px 24px 0 0;
    border-bottom: 1px solid rgb(var(--v-theme-border-color));
}
</style>
