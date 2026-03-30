import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  lang: 'zh-CN',
  theme: plumeTheme({
    // theme config...
  }),
  bundler: viteBundler(),
  pagePatterns: [
  	"!README.md"
  ]
})
