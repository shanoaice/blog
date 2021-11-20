+++
title = "The Unorthodox Gentoo Handbook I"
date = 2021-11-21T17:39:00

+++

事先声明：这份安装指南与官方的 Gentoo Handbook 相当不同, 内含大量个人观点 (一般以斜体标出), 并不保证能够覆盖到全部的情况 (相对不关心的部分有: 对较老硬件的支持, 配置和**笔者未遇见过的**边角情况等), 如有任何问题请以官方手册为准. 

本篇为安装篇, 并且尚未完成.

## 开始
首先, 笔者并不建议使用 Gentoo 官方提供的 Installation ISO, 一些原因有：

- Kernel 版本较旧 (5.10 LTS), 可能无法识别较新的硬件 (例子有我的 AX210 网卡)
- WLAN 配置工具不易使用 (只有 `iw`, 无法连接 WPA 加密的无线网络)
- `chroot` 过程较为繁琐
- 缺乏易用的 `fstab` 生成工具

稍稍筛选后, 笔者选定了 Arch Installation ISO 作为安装媒介. 对于不想对着“可怖”的 console 界面分区的读者, 可以额外获取一份 GParted Live ISO 用于分区. 

对于不在乎是否可以简单地重复利用安装 USB 的读者, 可以简单地使用 Rufus 或 Etcher 直接写入 USB (Etcher 支持 Linux, 也可以直接使用 `dd` 写入). ~~一些比较怀旧的读者也可以自行刻录光盘, 毕竟 Arch Installation ISO 也不大.~~

如果希望能够简单地重复利用 USB 设备或者不想为了使用 GParted Live ISO 而写入多次 USB 的读者, 笔者推荐使用 [Ventoy](https://www.ventoy.net/cn/index.html).

接下来, 前往 [Get Gentoo!](https://www.gentoo.org/downloads/#amd64-advanced) 页面获取对应的 stage 3 tarball (本文作者使用的是 **desktop profile | systemd** 的 stage 3 tarball, 如果希望使用 OpenRC 作为 init, 那么接下来的指南中部分 systemd 相关的内容请自行参考 Gentoo Manual 替换为 OpenRC 的等价配置) 并且保存在可以比较容易从 Arch ISO 中访问的位置. 

## 配置网络

进入 Arch ISO 后, 如果使用的是 Ethernet 连接, 则一般无需关心配置, `dhcpcd` 会把工作做好. 笔者从未亲手配置过 (也并不会配置) 静态 IP 的以太网, 所以如果读者有此方面的需求, 请自行查阅资料. 

如果是无线网络, 则可以利用 Arch ISO 提供的 `iwctl` 工具做配置. 首先, 输入 `iwctl` 进入 iwctl shell, 随后 `station list` 列出可用的无线设备. 如果列表为空, 则可以输入 `exit` 退出 iwctl shell 并使用 `rfkill list` 检查无线连接是否被禁用. 

如果看到 Wireless LAN 有 blocked: yes, 说明无线连接被禁用. 

```
0: phy0: Wireless LAN
    Soft blocked: yes
    Hard blocked: yes
```

启用无线连接: 

```bash
rfkill unblock wifi
```

如果 rfkill 并没有看到被禁用的 WLAN 设备, 那么非常可能的情况是设备的无线网卡在内核中并没有驱动 (或者实在是太旧以至于 Arch ISO 的 Kernel 并没有编译针对它的支持), 这时你能做的事不多. 如果你的设备很新 (如笔者自己的 HP Omen 16 AMD 版的 Realtek RTL8852AE 和可能的部分联发科 WiFi6 网卡), 那么也许你可以等上一整子, 寄希望于一段时间后新发布 Arch ISO 的内核包含了对这张网卡的支持. 由于 Arch ISO 缺乏编译驱动 / DKMS 需要的开发工具, 现场编译驱动一般是不现实的. 对于只有外置驱动的设备来说, 由于前述原因, 也难以在 Arch ISO 环境下被驱动起来. 这时唯一的方法就是拿出手机, 用数据线连接上电脑后开启 USB 网络分享 (此种方法类似于带 DHCP 的以太网配置, 无需配置) 以获得网络连接. 

如果 `station list` 列出了 WLAN 设备 (一般是 wlan0), 那么接下来 `station [device] scan` 扫描可用网络, `station [device] connect [SSID]` 连接网络. 如果需要一些额外的指引, iwctl shell 的 `help` 命令会非常有帮助.

### NTP 时间同步

为了防止时间误差过大导致后续可能需要 TLS 连接等的步骤失败, 一般建议在获得网络连接后设置 NTP 时间同步. 由于 Arch ISO 使用的是 systemd 和 timedatectl, 只需一行命令即可设置 NTP：

```sh
timedatectl set-ntp true
```

### 题外话：调节背光亮度

很多时候 Arch ISO 启动后的背光亮度是很暗的. 对于笔记本来说, 在 tty 下功能键调节亮度的功能一般是失效的, 这个时候就得用一些比较原始的方法来控制背光亮度了. 首先, `ls /sys/class/backlight` 查看屏幕的 backlight class, 随后 `cat /sys/class/backlight/[backlight class]/max_brightness` 查看屏幕的最大亮度, 然后按照百分比计算好想要的亮度后执行 `echo [brightness] > /sys/class/backlight/[backlight class]/brightness`.

想亮度拉满也可以直接 `cat /sys/class/backlight/[backlight class]/max_brightness > /sys/class/backlight/[backlight class]/brightness`.

以笔者的 HP Omen 16 AMD 版为例, `ls /sys/class/backlight` 得到的输出是 `amdgpu_bl1` (笔者的笔记本是 AMD Radeon RX6600M 显卡, 一般这个 backlight class 的名称与显卡制造商有关), 那么 `cat /sys/class/backlight/amdgpu_bl1/max_brightness` 得到最高亮度为 255, 按 80% 计算后得出结果 204, 那么 `echo 204 > /sys/class/backlight/amdgpu_bl1/brightness` 即可将亮度调节为 80%.

## 准备磁盘

简单地介绍一下 Linux 常用的文件系统类型：

- E2FS family (ext2/3/4): 最常用的 Linux 文件系统, 日志式, 可靠, 久经考验. (如果不确定到底想用什么文件系统, ext4 永远是最不坏的选择)
- Btrfs: 下一代文件系统, 已经成为多个发行版的默认 (openSUSE 似乎是第一个). 它提供了许多高级功能, 如快照, 通过校验和自我修复,  透明压缩、, 子卷和集成 RAID. 尽管 Gentoo Manual 认为 Btrfs 还尚未为生产工作做好准备, 笔者仍然推荐使用 Btrfs, 毕竟快照功能和透明压缩实在是太好用了 (x
- ZFS: 十分高级的“文件系统” (加 Quote 的原因是 ZFS 的 raw volume 上是可以套娃其他文件系统的), 有着和 Btrfs 类似但更加成熟的功能. 不过, 一般情况下 ZFS 不太会用于桌面环境, *主要原因大概是例如 zpool 跨盘分区之类作为 ZFS 的主要特点的功能对于桌面环境有些 overkill 的意味*(尽管 Btrfs 也有跨盘卷的功能, *但其易用程度明显高于 zpool——相对于一般个人电脑可能会遇到跨盘卷配置的复杂程度*). 
- VFAT/FAT32: 有 4GB 的文件大小上限, 一般只用于 EFI/boot 分区以保证兼容性. 毕竟, 几乎所有相对现代的工具都能读取 VFAT.

Swap 交换分区一般也是必要的, 虽然许多指南推荐 Swap 分区应为 RAM 的两倍, 但对于几乎标配 >=8GB RAM 的现代设备来说, 笔者的拙见是 2x RAM 的 Swap 颇有些高射炮打蚊子的意味, 所以对于 >=8GB RAM 的设备来说, 一般笔者推荐至少配置 8GB 的 Swap, 如果有 hibernation 的需求的话则配置 Swap Size = RAM Size 即可. 不要忘记 `swapon [swap device]` 以启用 swap, 这不仅可以省去稍后生成 fstab 时手写 swap 项的麻烦, 也可以防止 Gentoo 构建时占用内存过多导致 OOM 的问题. 

如果磁盘空间实在是捉襟见肘, 那么可以考虑稍稍缩小 Swap 分区的大小. 如果实在是无法挤出足够的空间, 那么在拥有 >=16GB RAM 的情况下 swapless 配置也并非是无法接受, 此时一般建议配合 zram 来节约内存空间 (可以参考笔者先前的一篇关于配置 zram 的文章). 

有时, 你可能不想单独有一个 swap 分区, 那么 swapfile 也是可以考虑的. 笔者不在此赘述 swapfile 的配置方法, 读者如有兴趣可以参考 ArchWiki 中的相关文档. 

### 分区建议

此处笔者给出一些分区的建议, 仅供参考. 此处仅考虑 GPT+EFI 的配置, 如果有任何 MBR/Legacy BIOS 或 coreboot 的需求请自行查阅文档. 

对于只需要 Linux 单盘单系统用户而言, 如下的分区足以：

- 100~500MB 的 EFI 分区, `vfat` 格式 (必须是 `vfat`), 一般建议稍微大一些以防万一 (但无需太大)
- 合适大小的 Swap 分区 (按照传统一般建议放在磁盘较为靠前的位置, 因为机械硬盘较外圈的磁道速度快, `/boot` 分区同理, SSD 则可以无需担心位置)
- 如果需要使用 `systemd-boot` 等文件系统支持并不齐全的 bootloader 或 **LUKS 全盘加密**的话, 建议单独另开一个 `/boot` 分区 (需要 kernel initramfs), 一般 500MB~1GB 足以 (如果希望保留较多的旧 Kernel 的话则建议大一些), `vfat` 或 `ext2/3` 都行 (`ext4` 一般也能工作, 但不建议)
- 剩余的所有空间都留给系统分区. 

如果需要和 Windows 等其他系统共存的话, 此时你的磁盘一般已经有 EFI 分区了, 所以可以不必担心它. 此时你一般需要从一个 Windows 分区中腾出一些空间. (建议至少为系统分区留下 30GB 和合适大小的 Swap 空间) 这项工作可以使用 Windows 的磁盘管理工具或者 GParted 完成. 随后, 按照上述的方法分区即可. 

假定你现在已经完成分区和 mkfs 的工作, 对于 ext4 分区的配置可以直接跳到下一节, 而对于 Btrfs 分区的配置推荐阅读以下内容. 

### 配置子卷

Btrfs 的几个杀手锏级别的特性之一就是子卷和快照, 而这两个功能一般是配合使用的. Btrfs 的快照一般占用的空间十分小, 究其原因是 Btrfs 的 CoW 特性使得快照和当前卷能够共享不变的数据而只储存变化了的数据. 最常用的 Btrfs 自动化快照工具是 timeshift, 而 timeshift 只能操作具有 Ubuntu 子卷结构的 Btrfs 分区 (即 `@` 子卷作为根挂载点, `@home` 子卷作为家目录挂载点, (可选的) `@tmpfs` 作为 `/tmp` 的挂载点). 这种配置的好处有: 可以选择一并/分开或不创建家目录的快照, 分离的 `@tmpfs` 子卷则可以阻止临时文件被包括在快照中浪费空间, 要配置这种结构的 Btrfs 分区, 先挂载 Btrfs 根子卷:

```sh
mkdir /btrfs-root
mount -v [btrfs device] /btrfs-root
```

随后, 切换入根子卷创建需要的其他子卷:

```sh
btrfs subvolume create @
btrfs subvolume create @home
btrfs subvolume create @tmpfs
# 按需创建其他的子卷, 如果需要使用 swapfile 的配置则建议为其单独创建子卷防止其被包含入快照中
btrfs subvolume create [subvol name]
```

使用以下命令列出子卷:

```
btrfs subvolume list .
```

输出的第一列是子卷的 ID, 最后一列是子卷名称 (即刚才 `btrfs subvolume create` 命令指定的名称), 记住 ID 和它对应的子卷, 稍后会用到 (如果读者是按照本文的顺序创建的子卷, 那么 `@`, `@home` 和 `@tmpfs` 的子卷 ID 应该是 `256`, `257`, `258`)

接下来, 解除挂载:

```sh
umount -vR /btrfs-root
```

## 挂载分区

首先, 创建挂载点:

```sh
mkdir -p /mnt/gentoo
```

对于一般文件系统或者无子卷的 Btrfs 分区而言, 可以直接挂载:

```sh
mount -v [device] /mnt/gentoo
# 如果是 btrfs, 可以指定透明压缩
mount -vo compress-force=zstd [device] /mnt/gentoo
```

如果是带子卷的 Btrfs 分区, 那么可以如此挂载:

```sh
mount -vo compress-force=zstd,subvolid=[@ subvolume id] [device] /mnt/gentoo
mkdir /mnt/gentoo/home
mount -vo compress-force=zstd,subvolid=[@home subvolume id] [device] /mnt/gentoo/home
mkdir /mnt/gentoo/tmp
mount -vo compress-force=zstd,subvolid=[@tmpfs subvolume id] [device] /mnt/gentoo/tmp
# and other subvolumes, etc.
```

注意, 如果启用了 Btrfs 的透明压缩并且决定稍后自行编译内核而不是使用 distribution kernel 的话, 请务必启用内核中对应的压缩方法 (此例中是 Zstandard) 并且确保是编译进内核而不是模块形式.

随后, 挂载 EFI 和 boot 分区 (如有):

```sh
mkdir /mnt/gentoo/efi /mnt/gentoo/boot
mount -v [EFI partition device] /mnt/gentoo/efi
mount -v [boot partition device] /mnt/gentoo/boot # if exists
```

注意, 此处的 EFI 分区配置与 Gentoo 手册中提到的非常不同, 主要区别在于 EFI 分区分开挂载并且内核分开存放. 这对于常用的 GRUB2 配置来说几乎没有区别 (如果没有分离 boot 分区的话), 但如果需要使用 systemd-boot 等可能需要分开存放内核至单独分区的配置而言, initramfs 是必不可少的.

## 安装 stage3 tarball

接下来, 找到先前下载的 stage3 tarball, 切换到新系统的根目录并解压:

```sh
tar xpvf [stage3 tarball location] --xattrs-include='*.*' --numeric-owner
```

### 配置编译选项

启动编辑器, 随后仔细阅读接下来提到的内容:

```sh
nano -w /mnt/gentoo/etc/portage/make.conf
```

#### CFLAGS 和 CXXFLAGS

CFLAGS 和 CXXFLAGS 变量分别定义了GCC C / C++ 编译器的优化选项. 尽管这些选项一般在这里默认被定义过, 但为了性能最大化, 一般需要分别优化每个程序的这些配置.

笔者不会解释所有可能的优化选项. 要了解它们, 请阅读 [GNU 在线手册](https://gcc.gnu.org/onlinedocs/)或 gcc 信息页面 (**info gcc**-只适用于可用的Linux系统). make.conf.example 文件本身也包含了很多例子和信息; 不要忘了读它.

第一个设置是标志 `-march=`, 指定目标体系结构的名称. 可能用到的选项在 make.conf.example 文件中有描述 (作为注释). 一个常用的值是“native”, 它告诉编译器选择当前系统体系结构 (读者正在安装Gentoo时的系统) 并应用针对性优化.

第二个是标志 `-O` (即大写的字母O, 而不是数字零), 它指定了gcc优化级别标志, 可能用到级别的是 s (对于大小最优化), 0 (零 - 无优化), 1, 2 或甚至 3 等更多的优化选项 (每个级别具有与前面相同的标志, 加上一些额外选项).  `-O2` 是建议的默认值. `-O3` 在整个系统范围内使用时会导致问题, 因此我们建议您坚持使用 `-O2`.

另一个普遍使用的选项是 `-pipe` (不同编译阶段通信使用管道而不是临时文件). 它对产生的代码没有任何影响, 但是会使用更多的内存, 好处则是管道的效率相比临时文件略高 (因为数据经过更快的内存而不是磁盘). 在内存不多的系统里, gcc 可能会触发 OOM Kill. 如果是那样的话, 就不要用这个标记. 

在定义 CFLAGS 和 CXXFLAGS 的时候, 这些优化选项需要被合并. 可以参考下面的例子:

```sh
# Compiler flags to set for all languages
COMMON_FLAGS="-march=native -O2 -pipe"
# Use the same settings for both variables
CFLAGS="${COMMON_FLAGS}"
CXXFLAGS="${COMMON_FLAGS}"
```

#### MAKEOPTS

通过使用 MAKEOPTS, 可以定义在安装软件的时候同时可以产生并行编译的数目. CPU数目（CPU核心数）+1 是个不错的选择, 但是这个准则并不总都是最佳的. 每个 job 都可能要消耗大约 2GB 的内存, 所以请读者自行斟酌. 例: 使用 9 个并行任务 (笔者的笔记本即如此配置: R7 5800H 8C16T with 16GB RAM + 16GB swap)

```sh
MAKEOPTS="-j9"
```

将此行加入 make.conf 即可.

完成配置后, 保存并退出 nano (`Ctrl` + `S`, `Ctrl` + `X`).
