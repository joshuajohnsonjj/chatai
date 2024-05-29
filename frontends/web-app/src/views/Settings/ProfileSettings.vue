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
                            <v-avatar
                                icon="mdi-account-circle"
                                size="80"
                                class="mr-4"
                                style="font-size: 3rem"
                            ></v-avatar>

                            <div class="w-100">
                                <label for="upload">
                                    <div
                                        class="bg-surface py-4 rounded dashed-border button-hover"
                                        style="height: 120px"
                                    >
                                        <div class="d-flex justify-center">
                                            <v-icon icon="mdi-cloud-upload-outline" size="x-large"></v-icon>
                                        </div>
                                        <p class="text-body-1 font-weight-bold text-center text-primary">
                                            Click to upload
                                        </p>
                                        <p class="text-body-2 text-center text-primary">
                                            JPG or PNG file formats accepted
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        id="upload"
                                        ref="uploadInput"
                                        style="display: none"
                                        accept="image/jpg, image/jpeg, image/png"
                                        @change="selectFile"
                                    />
                                </label>

                                <div class="d-flex justify-end mt-4">
                                    <v-btn variant="plain" color="secondary" min-width="200">Cancel</v-btn>
                                    <v-btn color="blue" variant="tonal" min-width="200">save</v-btn>
                                </div>
                            </div>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <div class="modal-content">
                <!-- The component imported from `vue-picture-cropper` plugin -->
                <VuePictureCropper
                    :boxStyle="{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f8f8f8',
                        margin: 'auto',
                    }"
                    :img="pic"
                    :options="{
                        viewMode: 1,
                        dragMode: 'crop',
                        aspectRatio: 16 / 9,
                    }"
                    @ready="ready"
                />
            </div>

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
                            <v-btn variant="plain" color="secondary" min-width="200">Cancel</v-btn>
                            <v-btn color="blue" variant="tonal" min-width="200">save</v-btn>
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
                        <ThemeSelector :dark-mode="true" style="display: inline-block" />
                        <ThemeSelector :dark-mode="false" style="display: inline-block" />

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
    import { onMounted, reactive, ref } from 'vue';
    import VuePictureCropper, { cropper } from 'vue-picture-cropper';
    import { useUserStore } from '../../stores/user';
    import { storeToRefs } from 'pinia';

    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const isShowModal = ref<boolean>(false);
    const uploadInput = ref<HTMLInputElement | null>(null);
    const pic = ref<string>('');
    const result = reactive({
        dataURL: '',
        blobURL: '',
    });

    const profileDetails = ref({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    });

    const password = ref({
        new: '',
        current: '',
    });

    const notifications = ref({
        usage: true,
        newsletter: true,
    });

    onMounted(() => {
        profileDetails.value = {
            firstName: userData.value?.firstName ?? '',
            lastName: userData.value?.lastName ?? '',
            email: userData.value?.email ?? '',
            phoneNumber: userData.value?.phoneNumber ?? '',
        };
    });

    const selectFile = (e: Event) => {
        // Reset last selection and results
        pic.value = '';
        result.dataURL = '';
        result.blobURL = '';

        // Get selected files
        const { files } = e.target as HTMLInputElement;
        if (!files || !files.length) return;

        // Convert to dataURL and pass to the cropper component
        const file = files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Update the picture source of the `img` prop
            pic.value = String(reader.result);

            // Show the modal
            isShowModal.value = true;

            // Clear selected files of input element
            if (!uploadInput.value) return;
            uploadInput.value.value = '';
        };
    };

    const getResult = async () => {
        if (!cropper) return;
        const base64 = cropper.getDataURL();
        const blob: Blob | null = await cropper.getBlob();
        if (!blob) return;

        const file = await cropper.getFile({
            fileName: 'test',
        });

        console.log({ base64, blob, file });
        result.dataURL = base64;
        result.blobURL = URL.createObjectURL(blob);
        isShowModal.value = false;
    };

    const clear = () => {
        if (!cropper) return;
        cropper.clear();
    };

    const reset = () => {
        if (!cropper) return;
        cropper.reset();
    };
</script>

<style scoped>
    .dashed-border {
        border: 1px dashed rgb(var(--v-theme-border-color));
    }
</style>
