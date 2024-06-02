<template>
    <label for="upload">
        <div class="bg-surface py-4 rounded dashed-border button-hover" style="height: 120px">
            <div class="d-flex justify-center">
                <v-icon icon="mdi-cloud-upload-outline" size="x-large"></v-icon>
            </div>
            <p class="text-body-1 font-weight-bold text-center text-primary">Click to upload</p>
            <p class="text-body-2 text-center text-primary">JPG, PNG, or GIF file formats accepted</p>
        </div>
        <input
            type="file"
            id="upload"
            ref="uploadInput"
            style="display: none"
            accept="image/jpg, image/jpeg, image/png, image/gif"
            @change="selectFile"
        />
    </label>

    <div v-if="isShowModal" class="d-flex justify-center dialog-container">
        <div class="align-self-center bg-surface rounded dialog-modal shadow px-4 py-2">
            <div class="d-flex justify-center">
                <v-btn variant="plain" color="secondary" @click="clear"> Clear </v-btn>
                <v-btn variant="plain" color="secondary" @click="reset"> Reset </v-btn>
            </div>
            <v-btn
                variant="plain"
                icon="mdi-close"
                style="position: absolute; top: -5px; right: -5px"
                @click="$emit('closeModal')"
            ></v-btn>

            <VuePictureCropper
                :boxStyle="{
                    height: '40vh',
                    backgroundColor: '#f8f8f8',
                    margin: 'auto',
                }"
                :img="pic"
                :options="{
                    viewMode: 1,
                    dragMode: 'crop',
                    aspectRatio: 9 / 9,
                }"
            />

            <div class="d-flex justify-end mt-2">
                <v-btn variant="plain" color="secondary" @click="isShowModal = false"> Cancel </v-btn>

                <v-btn color="blue" variant="tonal" @click="getResult"> Confirm </v-btn>
            </div>
        </div>
    </div>

    <FullScreenBackgroundBlur v-if="isShowModal" @click="isShowModal = false" />
</template>

<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import VuePictureCropper, { cropper } from 'vue-picture-cropper';

    const emit = defineEmits(['imageCropped']);

    const isShowModal = ref<boolean>(false);
    const uploadInput = ref<HTMLInputElement | null>(null);
    const pic = ref<string>('');
    const result = reactive({
        dataURL: '',
        blobURL: '',
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

        emit('imageCropped', base64, file!.type);

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

    .dialog-container {
        position: absolute;
        width: 100%;
        left: 0;
        height: 100%;
        top: 0;
    }

    .dialog-modal {
        z-index: 100;
        position: relative;
    }
</style>
