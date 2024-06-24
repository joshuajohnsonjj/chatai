<template>
    <v-row class="py-4">
        <v-col cols="3">
            <div class="d-flex justify-start">
                <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${sourceType}.png`" size="80"></v-avatar>
                <div class="ml-4 mt-5">
                    <div class="text-primary text-h5 font-weight-medium">{{ formatStringStartCase(sourceType) }}</div>
                    <div class="text-secondary font-weight-light text-body-1">Note taking</div>
                </div>
            </div>
        </v-col>

        <v-col cols="7">
            <div class="ml-4 mt-2">
                <div class="text-primary text-body-1 font-weight-bold">{{ title }}</div>
                <div class="text-primary text-body-2">
                    {{ maxStrLenToElipse(body) }}
                </div>
                <div class="d-flex justify-start">
                    <div class="text-secondary text-caption mr-1">Authored by: Joshua Johnson</div>
                    <v-icon icon="mdi-circle-small" color="secondary" style="font-size: 19px"></v-icon>
                    <div class="text-secondary text-caption ml-1">
                        Authored on: {{ moment(timestamp).format('M/D/YYYY HH:MM a') }}
                    </div>
                </div>
            </div>
        </v-col>

        <v-col cols="2">
            <v-btn variant="tonal" color="info" class="mb-1" @click="viewDetail">view details</v-btn>
            <v-btn variant="tonal" color="blue" @click="openSource">open source</v-btn>
        </v-col>
    </v-row>

    <HorizontalLine />
</template>

<script lang="ts" setup>
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../../constants';
    import { useRouter } from 'vue-router';
    import { useSearchStore } from '../../stores/search';
    import { RouteName } from '../../types/router';
    import moment from 'moment';
    import { maxStrLenToElipse, formatStringStartCase } from '../../utility';

    const searchStore = useSearchStore();
    const router = useRouter();

    const props = defineProps<{
        id: string;
        sourceType: string;
        timestamp: number;
        title: string;
        body: string;
        url: string;
    }>();

    function viewDetail() {
        searchStore.selectSearchResult(props.id);
        router.push({ name: RouteName.SEARCH_RESULT, params: { resultId: props.id } });
    }

    function openSource() {
        window.open(props.url, '_blank')!.focus();
    }
</script>
