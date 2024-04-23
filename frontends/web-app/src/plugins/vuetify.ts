/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
// import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';

// custom themes
const darkTheme = {
    dark: true,
    colors: {
        background: '#131718',
        surface: '#222627',
        'surface-bright': '#3E4243',
        primary: '#E8E8E8',
        secondary: '#777D81',
        success: '#49FD8E',
        info: '#8D55EA',
        warning: '#D84C0F',
        error: '#CE1C',
        blue: '#3D90F0',
        gray: '#404447',
        pink: '#A479A0',
        'gradient-purple': '#292536',
        'gradient-blue': '#1D2F51',
        'border-color': '#70777A',
    },
};

// TODO: light theme

export default createVuetify({
    theme: {
        defaultTheme: 'darkTheme',
        themes: {
            darkTheme,
        },
    },
});
