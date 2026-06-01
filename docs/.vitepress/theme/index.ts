import DefaultTheme from 'vitepress/theme';
import ReactDemo from './ReactDemo.vue';
import type { Theme } from 'vitepress';

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ReactDemo', ReactDemo);
  },
};

export default theme;
