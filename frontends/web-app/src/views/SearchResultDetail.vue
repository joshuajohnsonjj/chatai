<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.push({ name: RouteName.SEARCH })"
        ></v-btn>

        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex justify-space-between">
            <div class="d-flex justify-start">
                <v-avatar
                    :image="`${BASE_S3_DATASOURCE_LOGO_URL}${selectedSearchResult?.dataSourceType}.png`"
                    size="80"
                ></v-avatar>
                <div class="ml-4">
                    <p class="text-h5 text-primary font-weight-medium mb-1">
                        {{ selectedSearchResult?.title }}
                    </p>
                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-outline" color="secondary"></v-icon>
                            Authored on: {{ moment(selectedSearchResult?.createdAt).format('M/D/YYYY H:MM A') }}
                        </p>
                    </div>
                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-account-outline" color="secondary"></v-icon>
                            Authored by: Joshua Johnson
                        </p>
                    </div>
                </div>
            </div>

            <div style="max-width: 250px">
                <v-btn
                    class="w-100 mb-2"
                    color="blue"
                    prepend-icon="mdi-open-in-new"
                    variant="tonal"
                    :disabled="!selectedSearchResult?.url"
                    @click="openSource"
                >
                    View in {{ formatStringStartCase(selectedSearchResult?.dataSourceType ?? '') }}
                </v-btn>

                <v-btn
                    class="w-100"
                    color="warning"
                    prepend-icon="mdi-trash-can"
                    variant="tonal"
                    :loading="isLoading.deleteResult"
                    @click="isConfirmDelete = true"
                >
                    Remove content
                </v-btn>
            </div>
        </div>

        <v-row class="d-flex justify-start mb-3">
            <div
                v-for="topic in uniq(selectedSearchResult?.annotations)"
                :key="topic"
                class="d-flex justify-start rounded bg-background py-2 pl-2 pr-5 ml-2 relative"
            >
                <v-icon icon="mdi-tag" size="x-small"></v-icon>
                <div class="text-primary text-caption ml-1">
                    {{ maxStrLenToElipse(prettyPrintTopicValue(topic), 55) }}
                </div>
            </div>
        </v-row>

        <div style="height: 57vh; overflow-y: scroll">
            <div class="bg-background pa-6 rounded">
                <div class="bg-surface-bright py-2 px-4 rounded d-flex justify-space-between">
                    <div class="font-weight-medium text-h6 text-primary pt-1">Content excerpt</div>
                    <v-btn variant="text" class="text-caption" @click="copyToClipboard">Copy to clipboard</v-btn>
                </div>
                <div
                    id="content-preview"
                    class="pa-6 text-body-1 text-primary"
                    v-html="markdown(selectedSearchResult?.text ?? '')"
                ></div>
            </div>
        </div>
    </div>

    <ConfirmModal
        v-if="isConfirmDelete"
        :max-width="400"
        title="Confrim content deletion"
        sub-title="Unless your integration settings are updated to exclude this content, it may be re-indexed in the future"
        button-theme="warning"
        @close-modal="isConfirmDelete = false"
        @confirmed="onDeleteConfirmed"
    />
</template>

<script lang="ts" setup>
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import moment from 'moment';
    import { useToast } from 'vue-toastification';
    import { useSearchStore } from '../stores/search';
    import { storeToRefs } from 'pinia';
    import { markdown } from '../utility/markdown';
    import { onBeforeMount, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { RouteName } from '../types/router';
    import { formatStringStartCase, prettyPrintTopicValue, maxStrLenToElipse } from '../utility';
    import uniq from 'lodash/uniq';

    const searchStore = useSearchStore();
    const { selectedSearchResult, isLoading } = storeToRefs(searchStore);

    const toast = useToast();
    const route = useRoute();
    const router = useRouter();

    const isConfirmDelete = ref(false);

    onBeforeMount(async () => {
        if (!selectedSearchResult.value) {
            await searchStore.loadSearchResult(route.params.resultId as string);
        }

        if (!selectedSearchResult.value) {
            router.push({ name: RouteName.SEARCH });
        }
    });

    const openSource = () => {
        window.open(selectedSearchResult.value?.url, '_blank')!.focus();
    };

    const copyToClipboard = () => {
        const copyText = document.getElementById('content-preview')!.innerText;
        navigator.clipboard.writeText(copyText);
        toast.success('Content coppied to clipboard!');
    };

    const onDeleteConfirmed = async () => {
        await searchStore.deleteSearchResult(route.params.resultId as string);
        toast.success('Content deleted');
        router.push({ name: RouteName.SEARCH });
    };
</script>

<!-- Unscoped for v-html message rendering -->
<style>
    #content-preview > ul,
    #content-preview > ol {
        padding-left: 1.25rem;
    }
</style>
