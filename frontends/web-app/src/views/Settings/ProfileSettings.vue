<template>
    <div class="bg-surface w-100 h-100 rounded-xl">
        <div class="w-100 bottom-border-primary px-6 py-6 pb-4">
            <p class="text-h4 font-weight-medium text-primary">Profile</p>
            <p class="text-body-1 text-primary">Update your profile</p>
        </div>

        <div style="max-height: 82.5vh; overflow-y: scroll">
            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Profile photo</div>
                    <div class="text-body-2 text-secondary">This image will be displayed on your profile.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <div class="d-flex">
                            <v-avatar v-if="userImage" :image="userImage" size="80" class="mr-4"></v-avatar>
                            <v-avatar
                                v-else
                                icon="mdi-account-circle"
                                size="80"
                                class="mr-4"
                                style="font-size: 3rem"
                            ></v-avatar>

                            <div class="w-100">
                                <PhotoPicker
                                    @image-cropped="
                                        (fileBase64Url: string, type: string) => setImage(fileBase64Url, type)
                                    "
                                />

                                <div class="d-flex justify-end mt-4">
                                    <v-btn
                                        variant="plain"
                                        color="secondary"
                                        min-width="200"
                                        :disabled="!userImageChaged"
                                        @click="resetUserImage"
                                    >
                                        Cancel
                                    </v-btn>
                                    <v-btn
                                        color="blue"
                                        variant="tonal"
                                        min-width="200"
                                        :disabled="!userImageChaged"
                                        :loading="isLoading.imageUpload"
                                        @click="saveUserImage"
                                    >
                                        save
                                    </v-btn>
                                </div>
                            </div>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Profile details</div>
                    <div class="text-body-2 text-secondary">Update your personal details here.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <div class="d-flex justify-space-between">
                            <div class="w-50 mr-2">
                                <div class="text-body-2 text-primary">First name</div>
                                <v-text-field
                                    prepend-inner-icon="mdi-account"
                                    density="compact"
                                    variant="outlined"
                                    v-model="profileDetails.firstName"
                                    placeholder="John"
                                ></v-text-field>
                            </div>
                            <div class="w-50 ml-2">
                                <div class="text-body-2 text-primary">Last name</div>
                                <v-text-field
                                    density="compact"
                                    prepend-inner-icon="mdi-account"
                                    variant="outlined"
                                    v-model="profileDetails.lastName"
                                    placeholder="Doe"
                                ></v-text-field>
                            </div>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Email</div>
                            <v-text-field
                                prepend-inner-icon="mdi-email"
                                density="compact"
                                variant="outlined"
                                type="email"
                                v-model="profileDetails.email"
                                placeholder="john.doe@domain.com"
                            ></v-text-field>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Phone number</div>
                            <v-text-field
                                prepend-inner-icon="mdi-phone"
                                density="compact"
                                variant="outlined"
                                type="phone"
                                v-model="profileDetails.phoneNumber"
                                placeholder="+1 (999) 999 - 9999"
                            ></v-text-field>
                        </div>

                        <div class="d-flex justify-end mt-4">
                            <v-btn
                                variant="plain"
                                color="secondary"
                                min-width="200"
                                :disabled="!profileDetailsChanged"
                                @click="resetProfileDetails"
                            >
                                Cancel
                            </v-btn>
                            <v-btn
                                color="blue"
                                variant="tonal"
                                min-width="200"
                                :disabled="!profileDetailsChanged"
                                @click="saveProfileDetails"
                            >
                                save
                            </v-btn>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Security</div>
                    <div class="text-body-2 text-secondary">Update authentication and security preferences here.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Current password</div>
                            <v-text-field
                                prepend-inner-icon="mdi-lock"
                                density="compact"
                                variant="outlined"
                                type="password"
                                placeholder="***************"
                                v-model="password.current"
                            ></v-text-field>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">New password</div>
                            <v-text-field
                                prepend-inner-icon="mdi-lock"
                                density="compact"
                                variant="outlined"
                                type="password"
                                placeholder="***************"
                                v-model="password.new"
                            ></v-text-field>
                        </div>

                        <div class="d-flex justify-end mt-4">
                            <v-btn variant="plain" color="secondary" min-width="200">Cancel</v-btn>
                            <v-btn color="blue" variant="tonal" min-width="200">save</v-btn>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Communication</div>
                    <div class="text-body-2 text-secondary">Manage how and when we contact you.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <v-row>
                            <v-col cols="4">
                                <div class="text-primary text-body-1" style="line-height: 3.2rem">
                                    Newsletter emails
                                </div>
                            </v-col>
                            <v-col cols="4">
                                <v-switch
                                    v-model="notifications.newsletter"
                                    color="info"
                                    :label="notifications.newsletter ? 'Enabled' : 'Disabled'"
                                ></v-switch>
                            </v-col>
                        </v-row>

                        <v-row>
                            <v-col cols="4">
                                <div class="text-primary text-body-1" style="line-height: 3.2rem">
                                    Usage notifications
                                </div>
                            </v-col>
                            <v-col cols="4">
                                <v-switch
                                    v-model="notifications.usage"
                                    color="info"
                                    :label="notifications.usage ? 'Enabled' : 'Disabled'"
                                ></v-switch>
                            </v-col>
                        </v-row>

                        <div class="d-flex justify-end mt-4">
                            <v-btn variant="plain" color="secondary" min-width="200">Cancel</v-btn>
                            <v-btn color="blue" variant="tonal" min-width="200">save</v-btn>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Appearance</div>
                    <div class="text-body-2 text-secondary">Update aesthetic preferences.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <ThemeSelector :dark-mode="true" :is-selected="darkMode" @click="darkMode = true" />
                        <ThemeSelector :dark-mode="false" :is-selected="!darkMode" @click="darkMode = false" />

                        <div class="d-flex justify-end mt-4">
                            <v-btn variant="plain" color="secondary" min-width="200">Cancel</v-btn>
                            <v-btn color="blue" variant="tonal" min-width="200">save</v-btn>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { useUserStore } from '../../stores/user';
    import { storeToRefs } from 'pinia';
    import { SETTINGS_STORAGE_KEY } from '../../constants';
    import { useToast } from 'vue-toastification';

    const userStore = useUserStore();
    const { userData, isLoading } = storeToRefs(userStore);

    const toast = useToast();

    const userImage = ref('');
    const userImageType = ref('');

    const userImageChaged = computed(() => userImage.value !== userData.value?.photoUrl);

    const profileDetails = ref({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    });

    const profileDetailsChanged = computed(
        () =>
            profileDetails.value.firstName !== userData.value?.firstName ||
            profileDetails.value.lastName !== userData.value?.lastName ||
            profileDetails.value.email !== userData.value?.email ||
            (profileDetails.value.phoneNumber !== userData.value?.phoneNumber && !!profileDetails.value.phoneNumber),
    );

    const password = ref({
        new: '',
        current: '',
    });

    const notifications = ref({
        usage: true,
        newsletter: true,
    });

    const darkMode = ref(true);

    onMounted(() => {
        resetProfileDetails();

        userImage.value = userData.value?.photoUrl ?? '';

        darkMode.value = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')?.darkMode !== '0';
    });

    const setImage = (fileBase64Url: string, type: string) => {
        userImage.value = fileBase64Url;
        userImageType.value = type;
    };

    const resetProfileDetails = () => {
        profileDetails.value = {
            firstName: userData.value?.firstName ?? '',
            lastName: userData.value?.lastName ?? '',
            email: userData.value?.email ?? '',
            phoneNumber: userData.value?.phoneNumber ?? '',
        };
    };

    const saveProfileDetails = () => {};

    const resetUserImage = () => {
        userImage.value = userData.value?.photoUrl ?? '';
        userImageType.value = '';
    };

    const saveUserImage = async () => {
        if (!userImage.value.length || !userImageType.value.length) {
            return toast.warning('No image chosen.');
        }

        const { success } = await userStore.setNewProfileImage(userImage.value, userImageType.value);

        if (success) {
            toast.success('Profile image update succeeded!');
        }
    };
</script>
