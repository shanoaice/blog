---
title: 修理 niri + DMS 的自启动托盘图标问题
createTime: '2026-01-24'
permalink: /fix-niri-xdg-autostart/
draft: true
---

自我从 KDE Plasma 切换到 niri + DankMaterialShell 之后，我就注意到我的一些登录自启动程序似乎无法正常注册托盘图标，但手动退出再启动对应程序又能正常显示托盘图标。由于这毛病只影响了一部分程序，我就没太在意，只是去 #archlinux-cn 群里问了一嘴，就没继续调查到底是什么造成了这种奇怪的现象。现在终于闲下来有时间研究，我便回头去看了一下群友发来的一些相关信息，打算解决这个问题。

根据群友提供的[链接](https://gitlab.com/fedora/sigs/sway/sway-config-fedora/-/blob/fedora/sway/config.d/95-xdg-desktop-autostart.conf)，似乎 Fedora Sway Spin 有针对这类情况做特殊处理
