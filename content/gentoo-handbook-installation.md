+++
title = "The Unorthodox Gentoo Handbook I"
date = 2021-11-21T17:39:00

+++

事先声明：这份安装指南与官方的 Gentoo Handbook 相当不同, 内含大量个人观点 (一般以斜体标出), 并不保证能够覆盖到全部的情况 (相对不关心的部分有: 对较老硬件的支持, 配置和**笔者未遇见过的**边角情况等), 如有任何问题请以官方手册为准. 

本篇为安装篇, 并且尚未完成.

## 开始
首先, 笔者并不建议使用 Gentoo 官方提供的 Installation ISO, 一些原因有：

- Kernel 版本较旧 (5.10 LTS), 可能无法识别较新的硬件 (例子有笔者的 AX210 网卡)
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

如果 rfkill 并没有看到被禁用的 WLAN 设备, 那么非常可能的情况是设备的无线网卡在内核中并没有驱动 (或者实在是太旧以至于 Arch ISO 的 Kernel 并没有编译针对它的支持), 这时能做的事不多. 如果该设备很新 (如笔者自己的 HP Omen 16 AMD 版的 Realtek RTL8852AE 和可能的部分联发科 WiFi6 网卡), 那么也许可以等上一阵子, 寄希望于一段时间后新发布 Arch ISO 的内核包含了对这张网卡的支持. 由于 Arch ISO 缺乏编译驱动 / DKMS 需要的开发工具, 现场编译驱动一般是不现实的. 对于只有外置驱动的设备来说, 由于前述原因, 也难以在 Arch ISO 环境下被驱动起来. 这时唯一的方法就是拿出手机, 用数据线连接上电脑后开启 USB 网络分享 (此种方法类似于带 DHCP 的以太网配置, 无需配置) 以获得网络连接. 

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
- Btrfs: 下一代文件系统, 已经成为多个发行版的默认 (openSUSE 似乎是第一个). 它提供了许多高级功能, 如快照, 通过校验和自我修复,  透明压缩、, 子卷和集成 RAID. 尽管 Gentoo Manual 认为 Btrfs 还尚未为生产工作做好准备, 笔者仍然推荐使用 Btrfs, *毕竟快照功能和透明压缩实在是太好用了* (x
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
- 如果需要使用 `systemd-boot` 等文件系统支持并不齐全的 bootloader 或 **LUKS 全盘加密** 的话, 建议单独另开一个 `/boot` 分区 (需要 kernel initramfs), 一般 500MB~1GB 足以 (如果希望保留较多的旧 Kernel 的话则建议大一些), `vfat` 或 `ext2/3` 都行 (`ext4` 一般也能工作, 但不建议)
- 剩余的所有空间都留给系统分区. 

如果需要和 Windows 等其他系统共存的话, 此时你的磁盘一般已经有 EFI 分区了, 所以可以不必担心它. 此时你一般需要从一个 Windows 分区中腾出一些空间. (建议至少为系统分区留下 30GB 和合适大小的 Swap 空间) 这项工作可以使用 Windows 的磁盘管理工具或者 GParted 完成. 随后, 按照上述的方法分区即可. 

假定你现在已经完成分区和 mkfs 的工作, 对于 ext4 分区的配置可以直接跳到下一节, 而对于 Btrfs 分区的配置推荐阅读以下内容. 

### 配置子卷

Btrfs 的几个杀手锏级别的特性之一就是子卷和快照, *而这两个功能一般是配合使用的*. Btrfs 的快照一般占用的空间十分小, 究其原因是 Btrfs 的 CoW 特性使得快照和当前卷能够共享不变的数据而只储存变化了的数据. 最常用的 Btrfs 自动化快照工具是 timeshift, 而 timeshift 只能操作具有 Ubuntu 子卷结构的 Btrfs 分区 (即 `@` 子卷作为根挂载点, `@home` 子卷作为家目录挂载点). 这种配置的好处有: 可以选择一并/分开或不创建家目录的快照, 防止还原时造成家目录数据丢失, 要配置这种结构的 Btrfs 分区, 先挂载 Btrfs 根子卷:

```sh
mkdir /btrfs-root
mount -v [btrfs device] /btrfs-root
```

随后, 切换入根子卷创建需要的其他子卷:

```sh
btrfs subvolume create @
btrfs subvolume create @home
# 按需创建其他的子卷
# 如果需要使用 swapfile 的配置则建议为其单独创建子卷, 防止其被包含入快照中
btrfs subvolume create [subvol name]
```

使用以下命令列出子卷:

```sh
btrfs subvolume list .
```

输出的第一列是子卷的 ID, 最后一列是子卷名称 (即刚才 `btrfs subvolume create` 命令指定的名称), 记住 ID 和它对应的子卷, 稍后会用到 (如果读者是按照本文的顺序创建的子卷, 那么 `@` 和 `@home`的子卷 ID 应该是 `256`, `257`)

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
# and other subvolumes, etc.
```

注意, 如果启用了 Btrfs 的透明压缩并且决定稍后自行编译内核而不是使用 distribution kernel 的话, 请务必启用内核中对应的压缩方法 (此例中是 Zstandard) 并且确保是编译进内核而不是模块形式 (否则将无法挂载根分区).

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

CFLAGS 和 CXXFLAGS 变量分别定义了 GCC C / C++ 编译器的优化选项. 尽管这些选项一般在这里默认被定义过, 但为了性能最大化, 一般需要分别优化每个程序的这些配置.

笔者不会解释所有可能的优化选项. 要了解它们, 请阅读 [GNU 在线手册](https://gcc.gnu.org/onlinedocs/) 或 gcc 信息页面 (`info gcc` - 只适用于完成安装的 Linux 系统). `make.conf.example` 文件本身也包含了很多例子和信息; 不要忘了读它.

第一个设置是选项 `-march=`, 指定目标体系结构的名称. 可能用到的选项在 make.conf.example 文件中有描述 (作为注释). 一个常用的值是“native”, 它告诉编译器选择当前系统体系结构 (读者正在安装 Gentoo 时的系统硬件) 并应用针对性优化.

第二个是选项 `-O` (即大写的字母O, 而不是数字零), 它指定了 gcc 的优化级别, 可能用到级别的是 s (对于大小最优化), 0 (零 - 无优化), 1, 2 或甚至 3 等更多的优化选项 (每个级别具有与前面相同的标志, 加上一些额外选项).  `-O2` 是建议的默认值. `-O3` 在整个系统范围内使用时会导致问题 (对特定应用程序使用也有产生负优化的可能性), 因此笔者建议尽可能使用 `-O2`.

另一个普遍使用的选项是 `-pipe` (不同编译阶段通信使用管道而不是临时文件). 它对产生的代码没有任何影响, 但是会使用更多的内存, 好处则是管道的效率相比临时文件略高 (因为数据经过更快的内存而不是磁盘). 在内存不多的系统里, gcc 可能会触发 OOM Kill. 如果是那样的话, 就不要用这个选项. 

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

## chroot 前的准备

### 生成 fstab

笔者选用 Arch Installation ISO 的原因之一就是它强大的 `genfstab` 工具. 运行如下命令来生成合适的 fstab:

```sh
genfstab -U /mnt/gentoo > /mnt/gentoo/etc/fstab
```

解释:

- `-U` 选项代表使用 UUID 来指定要挂载的分区.
- `/mnt/gentoo` 代表以 `/mnt/gentoo` 为根目录搜索已挂载的分区
- `> /mnt/gentoo/etc/fstab` 表示使用管道将 `genfstab` 命令的输出重定向到 `/mnt/gentoo/etc/fstab` 中, 即新系统的 fstab 位置.

如果先前使用 `swapon` 命令激活过 swap 分区/文件的话, `genfstab` 命令也会将 swap 分区的配置一并写入生成的 fstab 中, 这样就无需额外配置 swap 分区了.

### resolv.conf

事先提示: 由于 Arch Installation ISO 使用的是 systemd-resolved 用于 DNS caching, 不论读者使用的是 systemd 还是 OpenRC init 的 stage3 tarball, 复制得来的 resolve.conf 都是 systemd-resolved 生成的临时 stub conf, 在完成安装重启前是需要重新配置的.

输入以下命令将当前环境的 resolv.conf 复制至 Gentoo chroot 中:
```sh
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/
```
### 可选：选择镜像站点

#### 分发文件

为了能更快的下载源代码，笔者推荐选择一个较快的镜像。Portage 将会在 make.conf 文件中查找 `GENTOO_MIRRORS` 变量，并使用其中所列的镜像。可以通过浏览 Gentoo 镜像列表搜索一个（或一组）最接近系统物理位置（往往是最快的）的镜像。对于中国用户而言, 可以参考 [dist mirror CN](https://www.gentoo.org/downloads/mirrors/#CN) 列表配置 `GENTOO_MIRRORS` 变量.

#### Gentoo ebuild 软件仓库

选择镜像的第二个重要步骤是通过/etc/portage/repos.conf/gentoo.conf文件来配置 Gentoo的 ebuild 软件仓库。这个文件包含了更新 Portage 数据库（包含 Portage 需要下载和安装软件包所需要的信息的一个 ebuild 和相关文件的集合）所需要的同步信息。

通过几个简单的步骤就可以完成软件仓库的配置。首先，如果它不存在，则创建 [repos.conf](https://wiki.gentoo.org/wiki//etc/portage/repos.conf) 目录：

```sh
mkdir -p /mnt/gentoo/etc/portage/repos.conf
```

接下来，复制 Portage 提供的 Gentoo 仓库配置文件到这个（新创建的）目录：

```sh
cp /mnt/gentoo/usr/share/portage/config/repos.conf /mnt/gentoo/etc/portage/repos.conf/gentoo.conf
```

修改 `/mnt/gentoo/etc/portage/repos.conf/gentoo.conf` 的 sync-uri 选项, 使其符合读者你选择的镜像配置. 使用 USTC Rsync Mirror 样例:
```conf
[DEFAULT]
main-repo = gentoo

[gentoo]
location = /var/db/repos/gentoo
sync-type = rsync
sync-uri = rsync://rsync.mirrors.ustc.edu.cn/gentoo-portage/
auto-sync = yes
sync-rsync-verify-jobs = 1
sync-rsync-verify-metamanifest = yes
sync-rsync-verify-max-age = 24
sync-openpgp-key-path = /usr/share/openpgp-keys/gentoo-release.asc
sync-openpgp-keyserver = hkps://keys.gentoo.org
sync-openpgp-key-refresh-retry-count = 40
sync-openpgp-key-refresh-retry-overall-timeout = 1200
sync-openpgp-key-refresh-retry-delay-exp-base = 2
sync-openpgp-key-refresh-retry-delay-max = 60
sync-openpgp-key-refresh-retry-delay-mult = 4
sync-webrsync-verify-signature = yes
```

### 检查

再一次, 运行 `timedatectl` 检查时间是否正确, NTP 是否已经启用; 运行 `ping www.gnu.org` 检查网络连接是否畅通. 一切就绪, vision clear, good tone, we are ready for takeoff.

## *Into the Antartica*

### chrooting

two-liner:

```sh
arch-chroot /mnt/gentoo /bin/bash
source /etc/profile # don't forget to source the profile!
```

no hassle. 这也是笔者选择 Arch Installation ISO 的另一原因: `arch-chroot` 会自动 bind-mount 一切必须的资源, 安装者所要做的只是敲一行命令而已.

### 同步数据库

运行 `emerge-webrsync` 来从选择的 `rsync` 镜像获取一份 24 小时内的数据库快照. 如果需要最新的 portage tree, 可以考虑再运行一次 `emerge --sync`.

随后, 可以选择去阅读一下 Gentoo Portage 的新闻条目. 由于全新安装的系统一般不需要关心新闻条目的变化提示, 这一步并不是必要的, 因此笔者不在此赘述, 有兴趣的读者可以去查阅 Gentoo Wiki 的[对应条目](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Base/zh-cn#.E9.98.85.E8.AF.BB.E6.96.B0.E9.97.BB.E6.9D.A1.E7.9B.AE). 不过, 还是建议读者养成仔细阅读 Portage 新闻的习惯, 毕竟 Gentoo 作为一个可定制性极高的发行版, 上游的微小变化都可能导致个性化配置失效.

### 选择合适的 Gentoo Profile

*配置文件* 是任何一个 Gentoo 系统的积木. 它不仅指定 USE, CFLAGS 和其它重要变量的默认值, 还会锁定系统的包版本范围. 这些设定全是由Gentoo的Portage开发者们来维护.

使用 `eselect` 可以看到当前系统正在使用什么配置文件，现在来使用 `profile` 模块：

```
# eselect profile list
Available profile symlink targets:
  [1]   default/linux/amd64/17.1 *
  [2]   default/linux/amd64/17.1/desktop
  [3]   default/linux/amd64/17.1/desktop/gnome
  [4]   default/linux/amd64/17.1/desktop/kde
```

在看完框架的可用配置文件amd64之后，用户可以键入以下命令为系统选择一个不同的配置文件：

```sh
eselect profile set 2
```

建议读者不要轻易地变换 profile 类型, 而是应该选择和下载的 stage3 tarball 位于同一个 subset 的 profile (如笔者下载的是 desktop profile | systemd 的 stage3 tarball, 那么就只应从使用 systemd + glibc 的 profile 中选择, 对于有特定 DE 需求的读者则可以选择对应 DE 的 profile, 即 KDE 用户可以选择 KDE profile, Gnome 则可以选择 Gnome profile).

随意改变 libc 和 init system 可能导致系统损坏; 鉴于 Linux 尚有部分常用应用 (如 Wine 等) 仍需 32-bit 的 multilib 支持, 选择 no multilib 的 profile 也不明智 (并且几乎不可能在以后切换为 multilib 配置). 除非完全清楚自己在干什么, 这些都是普通用户需要避免的高危操作.

### 更新@world集合

接下来, 明智的做法是更新系统的 [@world set](https://wiki.gentoo.org/wiki/World_set_(Portage)) 以确保应用了所有 profile 改变.

当系统应用了任何升级, 或从任何 profile 构建了 stage3 后应用了不同的 use 标记时，下一步是 **必要** 的.

```sh
emerge --ask --verbose --update --deep --newuse @world
```

> **Tip**
> 如果选择了桌面环境配置文件, 则此过程可能大大增加安装过程所需的时间量. 时间紧迫的读者可以参考“经验法则”: 配置文件名称越短, @world 的特定性越低; @world 设置的特定性越低, 系统需要的软件包越少.

### 配置 ACCEPT_LICENSE 变量

Portage 会读取 `/etc/portage/make.conf` 中定义的 `ACCEPT_LICENSE` 变量以确认使用哪些许可证的软件包可以在不经确认的情况下安装. 要了解所有可能的值, 请参考 Gentoo Handbook 中的[对应条目](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Base/zh-cn#.E5.8F.AF.E9.80.89.EF.BC.9A_.E9.85.8D.E7.BD.AE_ACCEPT_LICENSE_.E5.8F.98.E9.87.8F). 此处笔者仅给出两个推荐的选项.

对于不太关心许可证的一般用户而言, 可以选择自动接受除限制性的 `@EULA` 许可以外的所有许可:

```conf
ACCEPT_LICENSE="* -@EULA"
```

对于希望自己的系统中尽可能只包含自由软件的用户来说, 可以只接受 `@FREE` 许可组内的许可:

```conf
ACCEPT_LICENSE="-* @FREE"
```

有些时候可能需要自动接受特定软件包的许可, 此时可以在 `/etc/portage/package.license/` 目录中创建文件添加对单独软件包的覆盖.

例 - 创建 `/etc/portage/package.license/kernel` 文件并接受 `sys-kernel/linux-firmware` 软件包的 `@BINARY-REDISTRIBUTABLE` 许可:

```conf
sys-kernel/linux-firmware @BINARY-REDISTRIBUTABLE
```

### 配置时区

运行 `ls /usr/share/zoneinfo` 查看可用的时区. 对于 OpenRC 用户, 将其写入 `/etc/timezone` 文件 (假定时区为 Asia/Shanghai):

```sh
echo "Asia/Shanghai" > /etc/timezone
```

接下来，重新配置 [sys-libs/timezone-data](https://packages.gentoo.org/packages/sys-libs/timezone-data) 以更新 `/etc/localtime` 文件

```sh
emerge --config sys-libs/timezone-data
```

systemd 则有些许不同, 需要直接创建对应 zoneinfo 到 `/etc/localtime` 的软链接:

```sh
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

稍后系统启动后即可使用 `timedatectl` 命令来调整时区.

### 配置 Locale

请参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Base/zh-cn#.E9.85.8D.E7.BD.AE_locale).

### 配置内核

非常不建议初次使用 Gentoo 的读者手动配置内核, 此种安装方法费时费力, 且稍有差池就会得到一个无法启动的内核. 如果确实有手动配置的需求, 请参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Kernel/zh-cn#.E9.BB.98.E8.AE.A4.EF.BC.9A.E6.89.8B.E5.8A.A8.E9.85.8D.E7.BD.AE). 如果使用了 btrfs 透明压缩, 不要忘记将对应的压缩方式 (一般是 LZO 或者 Zstd) 编译进内核中 (不是编译成模块). 如果需要使用 iwd 连接无线网络, 不要忘记开启对应的内核加密方式 (参考: [Gentoo Wiki: iwd](https://wiki.gentoo.org/wiki/Iwd#Kernel)).

推荐的安装方式是使用 Distribution Kernel, 这样内核会随系统一同更新且无需担心硬件兼容问题 (Gentoo 的 dist-kernel 会几乎编译所有的 non-obselete feature 和 hardware support).

首先, 根据要使用的启动器安装 installkernel 包:

```sh
# if using GRUB
emerge --ask sys-kernel/installkernel-gentoo
```

然后, 安装 dist-kernel 包和固件:

```sh
emerge --ask sys-kernel/gentoo-kernel
# 也可以用编译好的 binary
emerge --ask sys-kernel/gentoo-kernel-bin

# 固件, 许可为 @BINARY-REDISTRIBUTABLE
emerge --ask sys-kernel/linux-firmware

# Intel 微码, 许可为 @BINARY-REDISTRIBUTABLE
sys-firmware/intel-microcode 
```

如果有额外的 DKMS 需求可以参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Kernel/zh-cn#Alternative:_Using_distribution_kernels).

### 配置主机名和 hosts

本节内容将专注于 Gentoo Handbook 完全没有提到的 systemd 配置. 使用 OpenRC 的读者可以参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/System/zh-cn#.E4.B8.BB.E6.9C.BA.E5.90.8D.E3.80.81.E5.9F.9F.E5.90.8D.E4.BF.A1.E6.81.AF).

首先, 配置主机名. 例 - 设置主机名为 `mygentoo`:

```sh
echo "mygentoo" > /etc/hostname
```

接下来编辑 `/etc/hosts` (仍假定主机名是 mygentoo):

```sh
nano -w /etc/hosts
```

加入以下内容:

```hosts
127.0.0.1   localhost
::1         localhost
127.0.1.1   mygentoo.localdomain    mygentoo
```

### 配置网络

本节内容将同样专注于 Gentoo Handbook 完全没有提到的 systemd 配置. 使用 OpenRC 的读者可以参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/System/zh-cn#.E9.85.8D.E7.BD.AE.E7.BD.91.E7.BB.9C).

#### 无线网络

首先, 安装 `iwd` 作为无线网络客户端, `dhcpcd` 作为 DHCP 客户端:

```sh
emerge --ask net-wireless/iwd net-misc/dhcpcd
```

然后, 启用它们的 systemd service:

```sh
systemctl enable iwd dhcpcd
```

重启后按照前述配置无线网络的方法连接即可.

#### 有线网络

首先, 安装 `dhcpcd` 作为 DHCP 客户端. 

```sh
emerge --ask net-misc/dhcpcd
```

启用 `systemd-networkd`:

```sh
systemctl enable systemd-networkd
```

随后, 运行 `networkctl list` 查看以太网接口名, 一般会是 `eth0`, `eno0` 或者是 `enp1s0`. 接下来, 创建 `/etc/systemd/network/20-wired.network` 文件:

```sh
nano -w /etc/systemd/network/20-wired.network
```

写入以下内容以配置 systemd-networkd 自动使用 DHCP 连接以太网:

```conf
[Match]
Name=enp1s0 # 替换为前述命令得到的接口名

[Network]
DHCP=ipv4
```

需要配置静态 IP 或者其他高级配置的读者可以参考 ArchWiki 的 [systemd-networkd](https://wiki.archlinux.org/title/Systemd-networkd_(简体中文)) 页面.

### Root 密码

使用 `passwd` 命令设置 root 密码.

```sh
passwd
```
