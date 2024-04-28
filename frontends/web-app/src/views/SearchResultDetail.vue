<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.go(-1)"
        ></v-btn>

        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex justify-space-between">
            <div class="d-flex justify-start">
                <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${'NOTION'}.png`" size="80"></v-avatar>
                <div class="ml-4">
                    <p class="text-h5 text-primary font-weight-medium mb-1">Seller Financing Platform</p>
                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-outline" color="secondary"></v-icon>
                            Linked since: {{ moment('4/12/24 11:15 AM').format('M/D/YYYY H:MM A') }}
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
                    @click="openSource"
                >
                    View in notion
                </v-btn>
                <v-btn class="w-100" color="warning" prepend-icon="mdi-trash-can" variant="tonal">
                    Remove content
                </v-btn>
            </div>
        </div>

        <div style="height: 60vh; overflow-y: scroll">
            <div class="bg-background pa-6 rounded">
                <div class="bg-surface-bright py-2 px-4 rounded d-flex justify-space-between">
                    <div class="font-weight-medium text-h6 text-primary pt-1">Content preview</div>
                    <v-btn variant="text" class="text-caption">Copy to clipboard</v-btn>
                </div>
                <div class="pa-6 text-body-1 text-primary">
                    Features
                    <ul>
                        <li>No need to hire a lawyer, all legal/title etc handled</li>
                        <li>No/Low closing costs</li>
                        <li>We provide “Lender-grade” underwriting tools to seller</li>
                        <li>Loan servicing</li>
                        <li>payments</li>
                        <li>escrow</li>
                        <li>default protection?</li>
                        <li>Secondary market?</li>
                        <li>B2B play</li>
                        <li>Large developers, etc</li>
                        <li>
                            Longer play - as we market to sophisticated sellers, creating SAP/Oracle integration will be
                            an important selling point
                        </li>
                        <li>
                            Think through other relevant ERPs - may want to research which ones are commonly used by
                            real estate companies
                        </li>
                        <li>Short term - integrating to something like Quickbooks</li>

                        <li>B2B play</li>
                        <li>Large developers, etc</li>
                        <li>
                            Longer play - as we market to sophisticated sellers, creating SAP/Oracle integration will be
                            an important selling point
                        </li>
                        <li>
                            Think through other relevant ERPs - may want to research which ones are commonly used by
                            real estate companies
                        </li>
                        <li>Short term - integrating to something like Quickbooks</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import moment from 'moment';

    function openSource() {
        const url =
            'https://www.notion.so/Seller-financing-platform-16fb35ef252f4b05b44786df36c16d91?pvs=4#5983b7088475403ebf61506fd0e82eb9';
        window.open(url, '_blank')!.focus();
    }
</script>
