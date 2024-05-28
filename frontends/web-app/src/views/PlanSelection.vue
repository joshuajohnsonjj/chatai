<template>
    <div v-if="!$route.query.userType">
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
                @click="$router.push(`?userType=${UserType.INDIVIDUAL}`)"
            >
                <v-icon icon="mdi-account" color="secondary" class="mx-auto w-100" style="font-size: 5rem"></v-icon>
                <div class="text-secondary text-h6 mt-4 w-100 text-center">Use for myself</div>
            </div>
            <div
                class="bg-surface pa-12 rounded grow-hover"
                style="min-width: 301px"
                @click="$router.push(`?userType=${UserType.ORGANIZATION_MEMBER}`)"
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
                v-for="plan in IndividualAccountPlans"
                :key="plan.name"
                :name="plan.name"
                :description="plan.description"
                :price="isAnnual ? plan.annualPrice : plan.price"
                :isAnnual="isAnnual"
                :features="plan.features"
                :is-selected="selectedPlan === plan.name"
                @selected="(name: string) => (selectedPlan = name)"
            />
        </div>

        <div class="d-flex justify-space-between">
            <div class="d-flex justify-start">
                <div class="pt-2 ml-4 text-primary text-body-1 link button-hover">
                    View full plan comparisons
                    <v-icon icon="mdi-arrow-right" class="pl-2"></v-icon>
                </div>
                
            </div>
            <div class="d-flex justify-end">
                <div class="text-h6 text-primary mr-2" style="line-height: 55px">Monthly</div>
                <v-switch hide-details color="blue" inset v-model="isAnnual"></v-switch>
                <div class="text-h6 text-primary ml-2" style="line-height: 55px">Anually</div>
                <v-btn color="success" variant="tonal" class="text-caption rounded pa-0 mt-2 ml-2 mr-8">Save 20%</v-btn>
            </div>
        </div>

        <div class="d-flex justify-center">
            <v-btn
                v-if="!!selectedPlan"
                style="width: 300px"
                color="blue"
                variant="tonal"
                @click="$router.push({ name: RouteName.CHAT })"
                >continue</v-btn
            >
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { UserType } from '../types/user-store';
    import { RouteName } from '../types/router';
    import { IndividualAccountPlans } from '../constants/plans';

    const selectedPlan = ref<string | null>(null);
    const isAnnual = ref(false);
</script>
