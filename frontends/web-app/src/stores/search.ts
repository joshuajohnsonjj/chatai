import { defineStore } from 'pinia';
import { ref } from 'vue';
import remove from 'lodash/remove';

export const useSearchStore = defineStore('search', () => {
    const activeQueryParams = ref([]);

    const addQueryParam = (param) => activeQueryParams.value.push(param);
    const removeQueryParam = (value) => remove(activeQueryParams.value, (param) => param.value === value);

    return {
        activeQueryParams,
        addQueryParam,
        removeQueryParam,
    };
});
