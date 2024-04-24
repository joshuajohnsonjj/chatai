<script lang="ts" setup>
    const dataSources = [
        {
            id: 1,
            name: 'Notion',
            logo: '../assets/notion.png',
            isSyncing: false,
            isLiveSync: false,
        },
        {
            id: 2,
            name: 'Slack',
            logo: '../assets/slack.png',
            isSyncing: false,
            isLiveSync: false,
        },
        {
            id: 3,
            name: 'Email',
            logo: null,
            icon: 'mdi-email',
            isSyncing: false,
            isLiveSync: true,
        },
        {
            id: 4,
            name: 'Zoom',
            logo: '../assets/zoom.png',
            isSyncing: false,
            isLiveSync: true,
        },
        {
            id: 5,
            name: 'Jira',
            logo: '../assets/jira.png',
            isSyncing: true,
            isLiveSync: false,
        },
        {
            id: 6,
            name: 'Notion',
            logo: '../assets/notion.png',
            isSyncing: false,
            isLiveSync: false,
        },
        {
            id: 7,
            name: 'Notion',
            logo: '../assets/notion.png',
            isSyncing: false,
            isLiveSync: false,
        },
    ];
</script>

<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <div class="bg-background w-100 pa-6 rounded d-flex justify-start mb-6">
            <v-avatar image="@/assets/companyLogo.jpg" size="60"></v-avatar>
            <div class="ml-4">
                <p class="text-h5 text-primary mb-1">ABC Technology's Data Sources</p>
                <div class="d-flex justify-start">
                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-cloud-outline" color="secondary"></v-icon>
                        7 Data sources
                    </p>
                    <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                        37 GB used
                    </p>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap">
            <div
                v-for="dataSource in dataSources"
                :key="dataSource.id"
                class="bg-background rounded pa-6 ma-2 grow-hover"
                style="min-width: 234px; position: relative"
            >
                <div
                    v-if="dataSource.isLiveSync"
                    class="rounded live-sync text-warning text-caption px-2"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Live sync
                </div>
                <div
                    v-else-if="dataSource.isSyncing"
                    class="rounded syncing text-caption text-info px-2"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Syncing
                </div>
                <div
                    v-else
                    class="rounded sync-now text-caption text-success px-2"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Sync now
                </div>

                <div class="d-flex justify-start mb-4">
                    <v-avatar image="@/assets/zoom.png" size="45"></v-avatar>
                    <p class="text-h6 text-primary ml-4" style="line-height: 45px">{{ dataSource.name }}</p>
                </div>
                <p class="text-caption text-secondary mb-1">
                    <v-icon icon="mdi-clock-outline"></v-icon>
                    Synced yesterday
                </p>
                <p class="text-caption text-secondary">
                    <v-icon icon="mdi-calendar-star"></v-icon>
                    Next Sync: 4/22 11:30PM
                </p>
            </div>
        </div>

        <v-btn
            variant="outlined"
            class="w-100 mx-2 mt-6"
            prepend-icon="mdi-plus"
            @click="$router.push({ name: 'browse-data-sources' })"
            >Add Integration</v-btn
        >
    </div>
</template>

<style scoped>
    .sub-info-line-height {
        line-height: 23px;
    }

    .live-sync {
        background: rgba(var(--v-theme-warning), 0.25);
    }

    .syncing {
        background: rgba(var(--v-theme-info), 0.25);
    }

    .sync-now {
        background: rgba(var(--v-theme-success), 0.25);
    }
</style>
