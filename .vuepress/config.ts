import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: "Shanoa Ice's Blog",
  description: '19 y.o. college student.',
  theme: plumeTheme({
    plugins: {
      shiki: {
        langAlias: {
          conf: 'ini',
          gentoo: 'bash',
          hosts: 'ini',
        },
      },
    },
  }),
  bundler: viteBundler(),
  pagePatterns: [
    'index.md',
    'content/**/*.md',
    '!README.md',
  ],
})
