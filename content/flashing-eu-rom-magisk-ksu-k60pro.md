+++
title = 'Redmi K60 Pro 折腾全过程'
date = 2023-06-12
+++

最近正值 618 大促，自己的旧手机续航已经逐渐下滑，华为的 HarmonyOS 虽然日用非常棒，但是折腾空间太小。一番搜索后，我购入了红米的 K60 Pro. 在长达 7 天的等待后，一切折腾终于可以开始了。本文记录了一下给这台机子刷入 MIUI EU ROM 并安装 KernelSU, Magisk 和 LSPosed 的全过程，整体过程应该不针对红米 K60 Pro，但其他机型请务必参考网上的其他教程，防止刷成砖 ;-)

## 解锁 Bootloader

一定记得手机到手以后要立刻绑定设备，步骤如下：
1. 打开设置，我的设备 > 全部参数与信息，然后持续点击 MIUI 版本的小框直到提示“你已处于开发者模式”。
2. 转到 更多设置 > 开发者模式 > 设备解锁状态
3. 点击绑定账号，然后使用你的小米账号登录。如果没有小米账号，你需要注册一个。  
   Tips: 注册小米账号后务必设置一个密码，否则后面会很麻烦。
4. 然后，去小米官网下载[解锁工具](https://www.miui.com/unlock/index.html)，连接上你的手机，然后使用你的小米账号登录。它应当会要求你使用手机验证码验证身份，请记得勾选让它下次不要再要求手机验证码的选项，否则后续会比较麻烦。登陆完成后，它应该会自动安装设备驱动并且检测到你的手机。如果没有，请点击右上角的齿轮图标，并在弹出的界面中点击安装驱动。
5. 等待七天后，先使用小米自带的备份工具（我的设备 > 备份与还原）备份所有数据至电脑或者U盘，后续的解锁和刷入 ROM 都会要**抹除全部数据**。
6. 如果已经登录了 Google 账号，请先退出账号以去除谷歌锁，这样在安装 MIUI EU 后可以先跳过需要代理的激活过程。
7. 重启手机，按住音量下键以进入 fastboot，随后将手机连接至电脑，打开小米解锁工具，此时它应该会正常检测到你的手机，点击解锁，完成后，手机应该会自动重启，Redmi 界面顶端应该会显示一个小小的打开的锁头，表示 bootloader 已经解锁成功。

## 刷入 TWRP

Custom Recovery 对于玩机来说是非常重要的东西，它能在身边没有电脑的情况下完成刷机，也能刷入 ADB Sideload ZIP 和自定义内核等。对于红米 K60 Pro 来说，目前只有 TWRP Recovery 可用（不过似乎 Github 上已有 K60 Pro 的 Device Tree，有兴趣的玩家也许可以尝试自己编译 OrangeFox 等其他 Custom Recovery 固件）。对于其他设备，先前往[小米固件下载](https://xiaomifirmwareupdater.com/)确定自己设备的代号（对于 K60 Pro 来说，代号是 Socrates）。然后，在[这里](https://sourceforge.net/projects/recovery-for-xiaomi-devices/files/)根据自己设备的代号下载最新的 Custom Recovery 映像。

1. 保持与电脑的连接，再次重启手机至 fastboot 模式，确保自己已经有 fastboot 工具。如果没有，可以去 [Android Developer](https://developer.android.com/tools/releases/platform-tools) 下载最新的 SDK Platform Tool.
2. 然后，根据 Xiaomi EU Community 的[这篇帖子](https://xiaomi.eu/community/threads/installing-a-custom-recovery.67841/)确定自己的分区表格式并刷入 Recovery.
3. 对于红米 K60 Pro 来说，它的处理器为骁龙 8 Gen 2，属于有独立的 `recovery_a` 和 `recovery_b` 分区的类型。
4. 此时，应该使用 `fastboot flash recovery_ab recovery.img` 刷入 Custom Recovery 映像。将 `recovery.img` 替换为下载得到的 Custom Recovery 的文件名。如果你的 SDK Platform Tool 不在 PATH 里，请 `cd` 至 SDK Platform Tool 的文件夹并使用 `./fastboot` 代替 `fastboot`. 同时也不要忘记把 Custom Recovery 映像文件也复制到 SDK Platform Tool 的安装文件夹下。
5. 如果你决定接下来使用卡刷刷入 MIUI EU，那么请使用 `fastboot reboot recovery` 重启至 Recovery. 如果你希望使用线刷刷入 MIUI EU，那么无需重启。

## 刷入 MIUI EU

MIUI EU 是由小米欧洲社区基于 MIUI 中国版 ROM 和 MIUI 国际版 ROM 修改而来的 ROM，移除了大部分广告和可能侵犯隐私的追踪功能，但保留了大量国内版的隐私保护功能。

MIUI EU 目前只公开提供骁龙版小米手机的 ROM，如果你使用的是天玑处理器，那么你需要在 Patreon 中捐助才能获得最新版的 ROM（不过我现在不知道他们到底还有没有在开发最新版的天玑 ROM）。当然，你也可以跳过刷入 MIUI EU 这一步并直接使用本地化更好的中国版 MIUI。

首先，访问 [Xiaomi EU Community](https://xiaomi.eu/community) 以获取最新版的 MIUI EU ROM。这一步需要国外 IP，国内 IP 访问此网站会被 403。

然后，拔下你手机的 SIM 卡，以便在刷入 ROM 后跳过需要代理的谷歌激活过程。

### 卡刷流程

1. 进入 TWRP 后，点击擦除，并滑动滑块确认抹除全部数据。
2. 数据抹除完毕后，将下载好的 ROM 包复制到手机的内置存储中。
3. 复制完毕后，点击安装，选中复制好的 ROM 包，然后滑动滑块确认安装。
4. 刷机完毕后，在弹出的界面中点击“系统”。手机将自动重启至安装好的系统中。

此后通过卡刷刷入更新包时都无需再擦除数据，但每次刷机后 Magisk（如果选择使用的话，KernelSU）都会失效，需要重新安装。不必担心，Magisk 和 KernelSU 的数据不会因此丢失，你只需要重新走一遍安装流程，所有设置、超级用户权限和模块都会保留。

### 线刷流程

1. 用你喜欢的压缩软件解压下载到的 ROM 包（建议使用7-zip）
2. 确保仍处在 fastboot 界面，双击 `windows_fastboot_first_install_with_data_wipe.bat` 开始刷入
3. 刷写完毕后手机将会自动重启进入安装好的系统中。

此后通过线刷更新系统时请使用不会抹除数据的 `windows_fastboot_update_rome.bat` 来刷入新系统。如果你不是使用 Windows 刷入的，请选择对应系统的脚本来执行（例如 `linux_*.sh`, `macos_*.sh`）

## 跳过谷歌激活

MIUI EU 系统自带全部的谷歌套件，因此正常的激活流程中需要登录谷歌账号才能正常设置手机，但是对于会参考本篇教程的多数人而言，一个能直连谷歌的网络环境并不存在，好在谷歌激活是可以通过并不困难的方法跳过的。

首先，请确保你在刷入 MIUI EU 之前已经退出谷歌账号的登录。如果没有进行这一步就擦除了手机数据，那么你将会被“谷歌锁”，此时谷歌激活是不可跳过的，你需要想办法获取一个可以直连谷歌的网络环境，如国外电话卡漫游数据，或者开一个配置过代理的热点。由于篇幅原因此处不多赘述，有需要的读者可以上网自行搜索方法。

如果你已经登出谷歌账号，那么最简单的跳过激活的方式就是拔出手机的 SIM 卡。此时进入系统并正常配置，到要求连接网络的界面时在左下角会有一个离线跳过配置的按钮，点击即可跳过谷歌激活。这样就可以进入系统配置完代理软件后再登录谷歌账号并完成最后的设置了。

## 刷入 KernelSU（可选）

KernelSU 是较为新兴的 Root 方式，其原理是通过刷入修改过的自定义内核来提供 Root 权限的接口，同时具有较为高级和细粒度的权限控制能力，能够限制获取 Root 权限的应用的行为，防止恶意利用。

对于红米 K60 Pro 来说，由于它是较新的手机，支持谷歌的 GKI 标准，KernelSU 有为其提供的通用内核包可以直接刷入。过程如下：

1. 首先，打开设置 > 我的设备 > 全部参数与信息，查看自己设备的 Android 内核版本。然后，根据 [KernelSU 的官方指南](https://kernelsu.org/zh_CN/guide/installation.html#kmi) 判断自己的 KMI，对于我的红米 K60 Pro 来说，它的 KMI 是 5.15-android13-8
2. 前往 KernelSU 的 [Release 页面](https://github.com/tiann/KernelSU/releases) 下载 KernelSU APK 文件和对应 KMI 的 AnyKernel ZIP 文件。对于我的红米 K60 Pro 来说，它支持的 AnyKernel ZIP 应该是 `AnyKernel3-android13-5.15.74_2022-05.zip`, `AnyKernel3-android13-5.15.78_2022-05.zip` 和 `AnyKernel3-android13-5.15.94_2022-05.zip`. 任选其一下载即可。
3. 将这两个文件复制到手机上，安装 KernelSU 的 APK 并打开应用。如果显示未安装，那么你的设备应当是符合 GKI 标准的，可以通过正常方式刷入。如果显示不支持，那么你需要根据[官方指南](https://kernelsu.org/zh_CN/guide/how-to-integrate-for-non-gki.html)中的方式自行编译 KernelSU，或者你也可以选择后文的 Magisk 来获取 Root 并修改系统.
4. 重启至 Recovery 并刷入先前已复制到手机上的 AnyKernel ZIP 文件。刷写完成后，重启手机。恭喜你，你已经安装好了 KernelSU. Enjoy!

不同于 Magisk，KernelSU 并不会响应应用程序的 Root 权限请求，它的默认行为是拒绝。如果需要给予应用程序对应的权限，请手动在 KernelSU App 中启用。

同时，KernelSU 兼容多数不依赖 Zygisk 的 Magisk 模块，可以直接在模块页面中刷入并启用。对于一些依赖 Zygisk 的模块来说，也可以刷入 [Zygisk on KernelSU](https://github.com/Dr-TSNG/ZygiskOnKernelSU/releases) 来解决。

新版的 KernelSU 在实装 App Profile 功能后对模块的作用域有了更严格的限制，这有助于防止一些模块影响到不应被修改的应用的功能，但对于没有特别适配 KernelSU 的 Magisk 模块来说，它们可能无法正常工作。如果需要保持最大的兼容性，请在 KernelSU 的设置界面（主界面右上角的小齿轮图标）中关闭“默认卸载模块”，并在不应受到影响的应用无法正常工作时再选中该应用，点击应用配置界面中的“自定义”并启用“卸载模块”开关以消除模块的影响。注意：要使改变生效，请重启你的手机。

如果你非常担心兼容性问题，KernelSU 也可以与 Magisk 共存，由 KernelSU 提供 Root 权限，Magisk 提供模块功能。下文有提到注意事项。

## 刷入 Magisk（可选）

Magisk 是较为传统的获取 Root 的方式之一，具有模块功能，可以以 system-less 的方式修改系统分区并提供各种功能。

Magisk 的工作原理是通过修改系统的 Initial Ramdisk 将自己添加到系统的启动过程当中。这之中并不涉及到修改内核，因此 Magisk 可以与 KernelSU 共存。当然，Magisk 的模块系统使用的 magic mount 与 KernelSU 模块使用的 overlayfs 有冲突，因此当 Magisk 生效时 KernelSU 会自动禁用所有的模块功能，这时所有的模块都应该刷入到 Magisk 中。另外，为了防止 Root 权限混乱（因为即使安装了 KernelSU，Magisk 也会拦截应用的 Root 权限请求并展示对话框），请在 Magisk App 的设置中将 “Root 权限”一项设为 `仅 ADB` 或 `已禁用`.

对于红米 K60 Pro 来说，它的 Ramdisk 并不像比较常见的设备那样被保存在 `boot` 分区中，而是存放在单独的 `init_boot` 分区中。这使得同时刷入 KernelSU 和 Magisk 变得相当容易，步骤如下：

1. 解压系统 ROM 的线刷包（如果是 MIUI 中国版，请在 [Xiaomi Firmware Updater](https://xiaomifirmwareupdater.com/) 网站中下载对应版本的线刷包，记得选择 Region 为 `China` 的包。如果你是在海外购入的小米手机——对于红米 K60 Pro 来说这一情形不存在，因为该型号并未在海外发售——请选择对应购入地区的 ROM 包。如果是先前刷入的 MIUI EU，那么直接解压先前刷入的压缩包即可），并在 `images` 目录中的 `init_boot.img` 拷贝至手机上。
2. 前往 [Magisk 官网](https://github.com/topjohnwu/Magisk/releases/latest) 下载并安装最新的 Magisk 管理器 App. [Magisk Delta](https://github.com/HuskyDG/magisk-files/blob/main/intro.md) 理论上应该也能以同样的方式工作，并且有更好的隐蔽性，但并非所有模块都能完全兼容 Magisk Delta，你需要自行判断是否要安装 Delta 版还是官方版。
3. 打开 Magisk 管理器应用，点击主界面上的 Install / 安装 按钮。点击“选择并修补一个文件”，然后选中先前拷贝至手机上的 `init_boot.img`。修补完成后，将生成的新文件拷贝至电脑上（文件名应该类似 `magisk-*.img`）
4. 重启手机至 Fastboot 模式并连接至电脑。
5. 在存放修补过的 `init_boot.img` 的目录中，输入如下命令：
   ```sh
   fastboot flash init_boot_ab <magisk patched image>

   # 或者，如果你想保留手机的 B 槽位作为不启用 Magisk 修复 bootloop 的安全模式，使用如下命令以保证只刷入 A 槽位
   fastboot flash init_boot_a <magisk patched image>
   ```
6. 重启手机。此时，再次打开 Magisk 管理器应用。你应该会在“当前”一栏中看见现在安装的 Magisk 版本。恭喜你，你已经成功安装了 Magisk!

如果你的手机不是红米 K60 Pro，请自行上网查阅资料，或者你也可以使用 [Fastboot Enhance](https://github.com/libxzr/FastbootEnhance/releases) / TWRP 查看你手机的分区表。如果它拥有独立的 `init_boot` 分区，那么大概率可以使用相同的安装流程。如果它只具有 `boot` 分区且你还是想要让 Magisk 与 KernelSU 共存，那么你需要事先检查好你手机型号所使用的内核压缩格式，下载对应的 KernelSU 内核 img 文件（而不是 AnyKernel 包）并使用 Magisk 应用修补它，然后再通过 fastboot 刷入。具体流程请参阅 [Magisk 安装文档](https://topjohnwu.github.io/Magisk/install.html) 和 [KernelSU 安装文档](https://kernelsu.org/zh_CN/guide/installation.html).

## 安装 Xposed 框架

Xposed 框架拥有悠久的历史，可以允许用户安装自定义插件并在不修改与重编译目标应用的源码的情况下改变它的行为。KernelSU 和 Magisk 都支持安装 Xposed。

现在主要较为活跃的现代化 Xposed 框架实现为 LSPosed 与 Dreamland. Dreamland 的开发者已经表示近期不会非常活跃，且兼容性也稍差于 LSPosed，因此 LSPosed 应该是较为推荐的选择。

### 使用 KernelSU 模块系统

1. KernelSU 并不自带 Zygisk，但 LSPosed / Dreamland 都需要 Zygisk 才能工作，因此你需要首先安装 [Zygisk on KernelSU](https://github.com/Dr-TSNG/ZygiskOnKernelSU/releases) 才能使 LSPosed 和许多其他 Magisk 模块正常工作。
2. 从前述链接中下载 Zygisk on KernelSU 并在 KernelSU 管理器应用中刷入。重启手机。
3. 从 [LSPosed官方发布页面](https://github.com/LSPosed/LSPosed/releases) 中下载最新的 LSPosed 模块。请务必下载包名中带有 `zygisk` 字样的压缩包。Riru 理论上也能在 KernelSU 中运行，但其已经终止维护，故不推荐使用。
4. 刷入刚才下载好的 LSPosed 模块，再次重启设备。
5. 这样就安装好了。新版本的 LSPosed 默认会创建一条通知用来访问寄生的 LSPosed 管理器。解锁手机，下拉通知栏即可看到。
6. （额外步骤）默认的 Zygisk 可以很简单的被正常应用所检测到，也可能因此会拒绝你做一些敏感操作，甚至封禁你的账号（如 QQ）。如果你不希望这种情况发生，那么请前往 [Shamiko 发布页面](https://github.com/LSPosed/LSPosed.github.io/releases) 下载 Shamiko 模块并启用。请务必下载最新版本，较旧的 Shamiko 不支持 KernelSU. *注意：理论上启用 Shamiko 即可使 Zygisk 不会被检测到，而且目前暂未有公开的方法能够直接检测 Zygisk 的存在。但是，一些其他的迹象也可能会使 KernelSU/Zygisk/Xposed 被检测到（例如设置 SELinux 执行状态为 permissive 等）。这些检测手段无法被 Shamiko 堵上。*

### 使用 Magisk 模块系统

1. Magisk 自带 Zygisk，但并未默认启用。打开 Magisk 管理器应用，点击左上角的小齿轮打开设置。向下滑动找到 Zygisk 的开关并启用。Magisk 会自动要求你重启手机，跟随它的指示。
2. 从上文中的链接里下载 LSPosed 模块并在 Magisk 管理器的模块页面刷入。重启手机。
3. 安装完毕！
4. 上文中步骤 6 的 Shamiko 模块同样适用于 Magisk。按照指示下载模块，刷入并重启手机即可。

## 安装 MIUI EU 本地化模块（仅适用于刷入了 MIUI EU 系统的手机）

MIUI EU 移除了许多不需要的功能，但也移除了一些对于国人来说相当有用的功能，例如：钱包应用，可以提供 NFC 公交卡和门卡模拟，短信识别，电话黄页等等各种功能。请参考以下链接以安装该模块（鸣谢：MinaMichita）：

[MIUI EU 欧洲版 本地化 Magisk 模块](https://blog.minamigo.moe/archives/184)

这个模块经过测试可以在 KernelSU 上安装，但请务必**关闭默认卸载模块**这一功能（在 KernelSU 管理应用右上角的小齿轮里打开设置），否则所有功能都无法正常工作！！！

### 已知问题

- 在我的红米 K60 Pro 上，使用 Magisk 安装该模块会导致相机应用和所有调用相机 API 的应用无法连接到摄像头（奇怪的是人脸识别似乎直接调用了硬件，因而不受影响）
- 使用 KernelSU 安装此模块不会产生问题，即使不为相机应用卸载模块此模块的更改。原因未知，但不失为一种解决方法。
