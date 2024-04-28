<template>
    <div v-if="!userType">
        <div
            style="max-width: 400px; margin-top: 20vh"
            class="text-h4 text-primary mx-auto text-center font-weight-medium mb-8"
        >
            How would you like to use Apoio?
        </div>
        <div class="d-flex justify-center">
            <div
                class="bg-surface pa-12 rounded grow-hover mr-4"
                style="min-width: 301px"
                @click="userType = UserType.INDIVIDUAL"
            >
                <v-icon icon="mdi-account" color="secondary" class="mx-auto w-100" style="font-size: 5rem"></v-icon>
                <div class="text-secondary text-h6 mt-4 w-100 text-center">Use for myself</div>
            </div>
            <div
                class="bg-surface pa-12 rounded grow-hover"
                style="min-width: 301px"
                @click="userType = UserType.ORGANIZATION_MEMBER"
            >
                <v-icon
                    icon="mdi-office-building"
                    color="secondary"
                    class="mx-auto w-100"
                    style="font-size: 5rem"
                ></v-icon>
                <div class="text-secondary text-h6 mt-4 w-100 text-center">Create organization</div>
            </div>
        </div>
    </div>
    <v-container v-else class="pt-12">
        <div style="max-width: 400px" class="text-h4 text-primary mx-auto text-center font-weight-medium mb-8">
            Choose a plan to begin
        </div>
        <div class="d-flex justify-center mt-8">
            <PlanDetail
                v-for="plan in plans"
                :key="plan.name"
                :name="plan.name"
                :description="plan.description"
                :price="plan.price"
                :features="plan.features"
                @selected="(name: string) => (selectedPlan = name)"
            />
        </div>
        <div class="d-flex justify-end">
            <div class="text-h6 text-primary mr-2" style="line-height: 55px">Monthly</div>
            <v-switch hide-details color="blue" inset></v-switch>
            <div class="text-h6 text-primary ml-2" style="line-height: 55px">Anually</div>
            <v-btn color="success" variant="tonal" class="text-caption rounded pa-0 mt-2 ml-2 mr-8">Save 12%</v-btn>
        </div>
        <div class="d-flex justify-center">
            <v-btn v-if="!!selectedPlan" style="width: 300px" color="blue" variant="tonal" @click="$router.push('/')"
                >continue</v-btn
            >
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { UserType } from '../types/user-store';

    // TODO: put plan in query string so back button will work
    const userType = ref<UserType | null>(null);
    const selectedPlan = ref<string | null>(null);

    const plans = [
        {
            name: 'Starter',
            description: 'A free plan to get you started',
            price: 0,
            features: [
                {
                    text: 'Up to 2 data source connections',
                    enabled: true,
                },
                {
                    text: 'Weekly data synchronizations',
                    enabled: true,
                },
                {
                    text: 'Unlimited AI chat messages',
                    enabled: true,
                },
                {
                    text: 'Unlimited data queries',
                    enabled: true,
                },
                {
                    text: '8GB data storage',
                    enabled: true,
                },
                {
                    text: 'Ad-free experience',
                    enabled: false,
                },
                {
                    text: 'Chrome extension',
                    enabled: false,
                },
                {
                    text: '3rd-party messenger integrations',
                    enabled: false,
                },
            ],
        },
        {
            name: 'Essentials',
            description: 'The ideal plan for most users',
            price: 7.99,
            features: [
                {
                    text: 'Up to 4 integration connections',
                    enabled: true,
                },
                {
                    text: 'Daily data synchronizations',
                    enabled: true,
                },
                {
                    text: 'Unlimited AI chat messages',
                    enabled: true,
                },
                {
                    text: 'Unlimited data queries',
                    enabled: true,
                },
                {
                    text: '100GB data storage',
                    enabled: true,
                },
                {
                    text: 'Ad-free experience',
                    enabled: true,
                },
                {
                    text: 'Chrome extension',
                    enabled: false,
                },
                {
                    text: '3rd-party messenger integrations',
                    enabled: false,
                },
            ],
        },
        {
            name: 'Unlimited',
            description: 'Our most capable plan for power users',
            price: 12.99,
            features: [
                {
                    text: 'Unlimited integration connections',
                    enabled: true,
                },
                {
                    text: 'Real-time data synchronizations',
                    enabled: true,
                },
                {
                    text: 'Unlimited AI chat messages',
                    enabled: true,
                },
                {
                    text: 'Unlimited data queries',
                    enabled: true,
                },
                {
                    text: '1TB data storage',
                    enabled: true,
                },
                {
                    text: 'Ad-free experience',
                    enabled: true,
                },
                {
                    text: 'Chrome extension',
                    enabled: true,
                },
                {
                    text: '3rd-party messenger integrations',
                    enabled: true,
                },
            ],
        },
    ];
</script>
