import { defineThemeConfig } from 'vuepress-theme-plume'
import navbar from './navbar'

export default defineThemeConfig({
  // Theme Config
  profile: {
    name: 'Shanoa Ice',
    description: '19 y.o. college student.',
  },
  social: [
    { icon: 'github', link: 'https://github.com/shanoaice' },
  ],
  navbar,
  collections: [
    {
      type: 'post',
      dir: 'content',
      link: '/blog/',
      title: '博客',
    },
  ],
  footer: {
    message: 'Maintained with &hearts; for the web.',
    copyright: 'Copyright © 2026 Shanoa Ice',
  },
})
