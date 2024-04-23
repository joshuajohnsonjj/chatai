<template>
    <div class="bg-surface rounded pa-4 mt-2">
        <div class="d-flex justify-space-between">
            <div class="d-flex justify-start mb-4">
                <v-avatar image="@/assets/avatar.jpg" size="49"></v-avatar>
                <div class="ml-2">
                    <p class="text-paragraph text-primary font-weight-medium">Earl Thomas</p>
                    <p class="text-caption text-secondary">ethomas@company.com</p>
                </div>
            </div>

            <div class="bg-success rounded align-self-start text-caption px-2">Free</div>
        </div>

        <v-btn variant="outlined" class="text-caption w-100">Upgrade to Pro</v-btn>
    </div>
</template>