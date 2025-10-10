+++
title = "The Unorthodox Gentoo Handbook I (Refreshed)"
date = 2025-09-10T18:00:00

+++


事先声明：这份安装指南与官方的 Gentoo Handbook 相当不同, 内含大量个人观点 (一般以斜体标出), 并不保证能够覆盖到全部的情况 (相对不关心的部分有: 对较老硬件的支持, 配置和**笔者未遇见过的**边角情况等), 如有任何问题请以官方手册为准. 

## 开始
首先, 笔者并不建议使用 Gentoo 官方提供的 Installation ISO, 一些原因有：

- 使用 LTS, 可能无法识别最新的硬件
- `chroot` 过程较为繁琐
- 缺乏易用的 `fstab` 生成工具

稍稍筛选后, 笔者选定了 Arch Installation ISO 作为安装媒介. 对于不想对着“可怖”的 console 界面分区的读者, 可以额外获取一份 GParted Live ISO 用于分区. 

对于不在乎是否可以简单地重复利用安装 USB 的读者, 可以简单地使用 Rufus 或 Etcher 直接写入 USB (Etcher 支持 Linux, 也可以直接使用 `dd` 写入). ~~一些比较怀旧的读者也可以自行刻录光盘, 毕竟 Arch Installation ISO 也不大.~~

如果希望能够简单地重复利用 USB 设备或者不想为了使用 GParted Live ISO 而写入多次 USB 的读者, 笔者推荐使用 [Ventoy](https://www.ventoy.net/cn/index.html).

接下来, 前往 [Get Gentoo!](https://www.gentoo.org/downloads/#amd64-advanced) 页面获取对应的 stage 3 tarball (本文作者使用的是 **desktop profile | systemd** 的 stage 3 tarball, 指南内容也以 systemd 的配置为主, 如果希望使用 OpenRC 作为 init, 那么接下来的指南中部分 systemd 相关的内容请自行参考 Gentoo Manual 替换为 OpenRC 的等价配置) 并且保存在可以比较容易从 Arch ISO 中访问的位置. 

## 配置网络

进入 Arch ISO 后, 如果使用的是 Ethernet 连接, 则一般无需关心配置, `systemd-networkd` 会把工作做好. 对于使用静态 IP 的读者, 可以参考 [systemd-networkd (ArchWiki)#Wired adapter using a static IP](https://wiki.archlinux.org/title/Systemd-networkd#Wired_adapter_using_a_static_IP) 章节配置网络.

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

如果 rfkill 并没有看到被禁用的 WLAN 设备, 那么非常可能的情况是设备的无线网卡在内核中并没有驱动 (或者实在是太旧以至于 Arch ISO 的 Kernel 并没有编译针对它的支持), 这时能做的事不多. 如果该设备很新, 那么也许可以等上一阵子, 寄希望于一段时间后新发布 Arch ISO 的内核包含了对这张网卡的支持. 由于 Arch ISO 缺乏编译驱动 / DKMS 需要的开发工具, 现场编译驱动一般是不现实的. 对于只有外置驱动的设备来说, 由于前述原因, 也难以在 Arch ISO 环境下被驱动起来. 这时唯一的方法就是拿出手机, 用数据线连接上电脑后开启 USB 网络分享 (此种方法类似于带 DHCP 的以太网配置, 无需配置) 以获得网络连接.

如果 `station list` 列出了 WLAN 设备 (一般是 wlan0), 那么接下来 `station [device] scan` 扫描可用网络, `station [device] connect [SSID]` 连接网络. 如果需要一些额外的指引, iwctl shell 的 `help` 命令会非常有帮助.

### NTP 时间同步

为了防止时间误差过大导致后续可能需要 TLS 连接等的步骤失败, 一般建议在获得网络连接后设置 NTP 时间同步. 由于 Arch ISO 使用的是 systemd 和 timedatectl, 只需一行命令即可设置 NTP：

```sh
timedatectl set-ntp true
```

### 题外话：调节笔记本背光亮度

很多时候 Arch ISO 启动后的背光亮度是很暗的. 对于笔记本来说, 在 tty 下功能键调节亮度的功能一般是失效的, 这个时候就得用一些比较原始的方法来控制背光亮度了. 首先, `ls /sys/class/backlight` 查看屏幕的 backlight class, 随后 `cat /sys/class/backlight/[backlight class]/max_brightness` 查看屏幕的最大亮度, 然后按照百分比计算好想要的亮度后执行 `echo [brightness] > /sys/class/backlight/[backlight class]/brightness`.

想亮度拉满也可以直接 `cat /sys/class/backlight/[backlight class]/max_brightness > /sys/class/backlight/[backlight class]/brightness`.

以笔者的 HP Omen 16 AMD 版为例, `ls /sys/class/backlight` 得到的输出是 `amdgpu_bl1` (笔者的笔记本并不具备独显直连能力, 因此不会有多个 backlight class, 对于没有在 BIOS 中启用默认独显直连的移动设备而言, 这个 backlight class 的名称与 CPU 核显制造商有关), 那么 `cat /sys/class/backlight/amdgpu_bl1/max_brightness` 得到最高亮度为 255, 按 80% 计算后得出结果 204, 那么 `echo 204 > /sys/class/backlight/amdgpu_bl1/brightness` 即可将亮度调节为 80%.

## 准备磁盘

简单地介绍一下 Linux 常用的文件系统类型：

- E2FS family (ext2/3/4): 最常用的 Linux 文件系统, 日志式, 可靠, 久经考验. 如果不确定到底想用什么文件系统, ext4 永远是最不坏的选择.
- XFS: 不同于 Gentoo Handbook, 笔者不推荐使用 XFS. 尽管 XFS 拥有第一梯队的性能, 它无法可靠地缩小分区, 因此尤其是在磁盘空间受限或者双/多系统的场合配置相当不灵活.
- Btrfs: 下一代文件系统, 已经成为多个发行版的默认 (openSUSE 似乎是第一个). 它提供了许多现代功能, 如快照, 内置校验, 自我修复, 透明压缩, 子卷和集成 RAID. 相对于 Gentoo Manual 推荐的 XFS, 笔者更推荐使用 Btrfs, 毕竟快照功能和透明压缩对于日常应用需要的备份回滚和空间节约需求来说非常好用.
- ZFS: 源自企业级解决方案的高级文件系统, 但配置方法复杂, 配置选项也极为繁多，对于不同的负载场合需要应用不同的配置才能达到最佳性能, 且缓存配置对于内存容量要求高, 在消费级环境中可能较为捉襟见肘. 最重要的是, ZFS 支持来自内核外的附加模块, 且无论是 Arch Linux LiveISO 还是一般的 Gentoo LiveISO 都不默认支持配置 ZFS. 仅在你已经熟悉或者在可控环境中练习过如何配置 ZFS 时才应该考虑配置 ZFS.
- VFAT/FAT32: 有 4GB 的文件大小上限, 一般只用于 EFI/boot 分区以保证兼容性. 毕竟, 几乎所有相对现代的工具都能读取 VFAT.

Swap 交换分区一般也是必要的, 虽然许多指南推荐 Swap 分区应为 RAM 的两倍, 但对于几乎标配 >=8GB RAM 的现代设备来说, 笔者的拙见是 2x RAM 的 Swap 颇有些高射炮打蚊子的意味, 所以对于 >=8GB RAM 的设备来说, 一般笔者推荐至少配置 8GB 的 Swap, 如果有休眠的需求的话, 保险起见可配置 Swap Size = RAM Size, 如果你不经常占满内存, 由于 Linux 内核在写入 swap 分区前会先释放非易失性的页面缓存, 通常配置 1/2 RAM Size 大小的 Swap 也可以成功休眠. 不要忘记 `swapon [swap device]` 以启用 swap, 这不仅可以省去稍后生成 fstab 时手写 swap 项的麻烦, 也可以防止 Gentoo 构建时占用内存过多导致 OOM 的问题. 

如果磁盘空间实在是捉襟见肘, 那么可以考虑稍稍缩小 Swap 分区的大小. 如果实在是无法挤出足够的空间, 那么在拥有 >=16GB RAM 的情况下 swapless 配置也并非是无法接受 (尽管这可能会造成一些性能损失), 此时一般建议配合 zram 来节约内存空间 (可以参考笔者先前的一篇关于配置 zram 的文章). 

有时, 你可能不想单独有一个 swap 分区, 那么 swapfile 也是可以考虑的. 笔者不在此赘述 swapfile 的配置方法, 读者如有兴趣可以参考 ArchWiki 中的相关文档. 

### 分区建议

此处笔者给出一些分区的建议, 仅供参考. 此处仅考虑 GPT+EFI 的配置, 如果有任何 MBR/Legacy BIOS 或 coreboot 的需求请自行查阅文档. 

对于只需要 Linux 单盘单系统用户而言, 如下的分区足以：

- 500MB~ 的 EFI 分区, `vfat` 格式 (必须是 `vfat`)
  - 如果你的系统配置较为复杂, 希望使用 Unified Kernel Image, 或者是需要保留多个 Kernel, 那么请适当扩大 EFI 分区. *笔者使用 LUKS2 全盘加密 + systemd-boot + UKI + 安全启动和 Windows 双启动的复杂配置下为 EFI 分区预留了 4GB 空间, 供参考.*
  - 对于使用 GRUB 2 和传统 initramfs + vmlinuz 配置的用户来说, 可以考虑不用太大的 EFI 分区, 而是将内核文件放在分开的 `/boot` 分区中. `/boot` 分区可以使用任何 GRUB 支持的文件系统格式, 如果不确定的话 `ext4` 永远是最不坏的选择, 没有文件大小限制又可靠
  - 尽管 systemd-boot 支持使用 XBOOTLDR 来扩展 EFI 分区, 但 FAT32 的短 UUID 格式并不能装下 XBOOTLDR 所要求的标准标识符, 而大部分市面上的设备所搭载的 UEFI 固件都不支持除三种基础 FAT 格式以外的任何格式, 所以我相当不推荐使用 XBOOTLDR 来扩展 EFI 分区. 如果你一定希望这么做, 请参见 The Unorthodox Gentoo Handbook I (Advanced) 章节中的内容. *(筹备中)*
- 合适大小的 Swap 分区 (按照传统一般建议放在磁盘较为靠前的位置, 因为机械硬盘较外圈的磁道速度快, `/boot` 分区同理, SSD 则可以无需担心位置)
- 剩余的所有空间都留给系统分区. 

如果需要和 Windows 等其他系统共存的话, 此时你的磁盘一般已经有 EFI 分区了, 所以可以不必担心它. 此时你一般需要从一个 Windows 分区中腾出一些空间. (建议至少为系统分区留下 30GB 和合适大小的 Swap 空间) 这项工作可以使用 Windows 的磁盘管理工具或者 GParted 完成. 随后, 按照上述的方法分区即可. 

#### 题外话: 高级配置

笔者自己使用的是 LUKS 2 全盘加密与 TPM 2 自动解锁. 感兴趣的读者可以查看 The Unorthodox Gentoo Handbook I (Advanced) 的对应章节来了解如何配置 *(筹备中)*.

---

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

输出的第一列是子卷的 ID, 最后一列是子卷名称 (即刚才 `btrfs subvolume create` 命令指定的名称), 确认已经创建所有需要的字卷.

接下来, 解除挂载:

```sh
umount -vR /btrfs-root
```

## 挂载分区

对于一般文件系统或者无子卷的 Btrfs 分区而言, 可以直接挂载:

```sh
mount -v [device] /mnt
# 如果是 btrfs, 可以指定透明压缩
# 此例中, 指定 zstd 压缩方式, level 5 压缩等级
mount -vo compress-force=zstd:5 [device] /mnt
```

如果是带子卷的 Btrfs 分区, 那么可以如此挂载 (不推荐使用 subvolid 来指定字卷, 因为从快照恢复可能会导致 subvolid 改变):

```sh
mount -vo compress-force=zstd:5,subvol=/@ [device] /mnt
mkdir /mnt/home
mount -vo compress-force=zstd:5,subvol=/@home [device] /mnt/home
# and other subvolumes, etc.
```

注意, 如果启用了 Btrfs 的透明压缩并且决定稍后自行编译内核而不是使用 distribution kernel 的话, 请务必启用内核中对应的压缩方法 (此例中是 Zstandard) 并且确保是编译进内核而不是模块形式 (否则将无法挂载根分区).

随后, 挂载 EFI 和 boot 分区 (如有):

```sh
mkdir /mnt/efi /mnt/boot
mount -v [EFI partition device] /mnt/efi
mount -v [boot partition device] /mnt/boot # if exists
```

注意, 此处 `/efi` 分区挂载点位于根目录下. 笔者非常不推荐使用传统的 `/boot/efi` 嵌套挂载, 以避免造成任何不必要的麻烦.

## 安装 stage3 tarball

接下来, 找到先前下载的 stage3 tarball, 切换到新系统的根目录并解压:

```sh
tar xpvf [stage3 tarball location] --xattrs-include='*.*' --numeric-owner
```

### 配置编译选项

启动编辑器, 随后仔细阅读接下来提到的内容:

```sh
nano -w /mnt/etc/portage/make.conf
```

#### CFLAGS 和 CXXFLAGS

CFLAGS 和 CXXFLAGS 变量分别定义了 GCC C / C++ 编译器的优化选项. 尽管这些选项一般在这里默认被定义过, 但为了性能最大化, 一般需要分别优化每个程序的这些配置.

笔者不会解释所有可能的优化选项. 要了解它们, 请阅读 [GNU 在线手册](https://gcc.gnu.org/onlinedocs/) 或 gcc 信息页面 (`info gcc` - 只适用于完成安装的 Linux 系统). `make.conf.example` 文件本身也包含了很多例子和信息; 不要忘了读它.

第一个设置是选项 `-march=`, 指定目标体系结构的名称. 可能用到的选项在 make.conf.example 文件中有描述 (作为注释). 一个常用的值是 `native`, 它告诉编译器选择当前系统体系结构 (读者正在安装 Gentoo 时的系统硬件) 并启用对应的指令集支持.

第二个设置是选项 `-mtune=`, 同样指定目标体系结构的名称, 允许的设定值与 `-march=` 相同, 不同的是它指定的是编译器优化不同体系架构时采用的开销参数等架构特定数值, 但不会额外启用任何指令集支持. 常用的值同样是 `native`. 如果希望自己编译的包以 x86(-64) 架构的通用参数优化, 可以将此项设置为 `generic` (`-mtune=` 独有值, `-march=` 不可用).

第三个是选项 `-O` (即大写的字母O, 而不是数字零), 它指定了 gcc 的优化级别, 可能用到级别的是 s (对于大小最优化), 0 (零 - 无优化), 1, 2 或甚至 3 等更多的优化选项 (每个级别具有与前面相同的标志, 加上一些额外选项).  `-O2` 是建议的默认值. `-O3` 在整个系统范围内使用时会导致问题 (对特定应用程序使用也有产生负优化的可能性), 因此笔者建议尽可能使用 `-O2`.

另一个普遍使用的选项是 `-pipe` (不同编译阶段通信使用管道而不是临时文件). 它对产生的代码没有任何影响, 但是会使用更多的内存, 好处则是管道的效率相比临时文件略高 (因为数据经过更快的内存而不是磁盘). 在内存不多的系统里, gcc 可能会触发 OOM Kill. 如果是那样的话, 就不要用这个选项. 

在定义 CFLAGS 和 CXXFLAGS 的时候, 这些优化选项需要被合并. 可以参考下面的例子:

```sh
# Compiler flags to set for all languages
COMMON_FLAGS="-march=native -mtune=native -O2 -pipe"
# Use the same settings for both variables
CFLAGS="${COMMON_FLAGS}"
CXXFLAGS="${COMMON_FLAGS}"
```

#### RUSTFLAGS

有许多现代应用程序使用 Rust 语言编写. `rustc` 有它自己的一套优化选项, 它通常对所有 Release 构建应用第 3 级别优化, 笔者同样不会解释所有可用的优化选项, 好奇的读者可参见 [Rust 文档](https://doc.rust-lang.org/rustc/codegen-options/index.html). 最有用且简单的优化是指定 `rustc` 编译到当前系统的体系结构, 如同 C/C++ 中的 `-march=native -mtune=native` 一样: 

```sh
RUSTFLAGS="${RUSTFLAGS} -C target-cpu=native"
```

#### MAKEOPTS

通过使用 MAKEOPTS, 可以定义在安装软件的时候同时可以产生并行编译的数目 (`-j`). 由于每个 job 都可能要消耗大约 2GB 的内存, Gentoo Handbook 建议设置为 CPU 线程数或内存容量 / 2GB 中较小的的数值. 对于超线程处理器来说, 有时设置为和线程数相同可能未必最合适, 有兴趣的读者可以自己调整配置并编译稍大的项目测试最优数值, 查阅处理器 (架构) 评测估算超线程效率, 或者在 Windows 上使用 Cinebench 测试 MP Ratio 来做 job 数目估计.

Load-average 参数 (`-l`) 是一个阻尼值, 用来决定在 CPU 负载达到多少时不运行新的编译 job (load-average 每 +1 大致对应于每一个核心 / 线程满占用). 由于其阻尼值的特性, 可以设置为稍大于 job 数目的值, 或者留空让 Portage 自行决定.

```sh
MAKEOPTS="-j10 -l12"
```

将此行加入 make.conf 即可.

完成配置后, 保存并退出 nano (`Ctrl` + `S`, `Ctrl` + `X`).

## chroot 前的准备

### 生成 fstab

笔者选用 Arch Installation ISO 的原因之一就是它强大的 `genfstab` 工具. 运行如下命令来生成合适的 fstab:

```sh
genfstab -U /mnt > /mnt/etc/fstab
```

解释:

- `-U` 选项代表使用 UUID 来指定要挂载的分区.
- `/mnt` 代表以 `/mnt` 为根目录搜索已挂载的分区
- `> /mnt/etc/fstab` 表示使用管道将 `genfstab` 命令的输出重定向到 `/mnt/etc/fstab` 中, 即新系统的 fstab 位置.

如果先前使用 `swapon` 命令激活过 swap 分区/文件的话, `genfstab` 命令也会将 swap 分区的配置一并写入生成的 fstab 中, 这样就无需额外配置 swap 分区了.

生成 initramfs 的 `dracut` 和一些 Kernel / Firmware 相关的软件包会读取 fstab 来确认到底要将需要的文件安装到哪里. 请务必确保 fstab 内容正确且与你实际挂载的布局一致, 否则你可能会遇到许多奇奇怪怪的安装错误, 或者生成不可启动的 initramfs.

### resolv.conf

事先提示: 由于 Arch Installation ISO 使用的是 systemd-resolved 用于 DNS caching, 不论读者使用的是 systemd 还是 OpenRC init 的 stage3 tarball, 复制得来的 resolve.conf 都是 systemd-resolved 生成的临时 stub conf, 在完成安装重启前是需要重新配置的.

输入以下命令将当前环境的 resolv.conf 复制至 Gentoo chroot 中:
```sh
cp --dereference /etc/resolv.conf /mnt/etc/
```

### 可选：选择镜像站点

#### 分发文件

为了能更快的下载源代码，笔者推荐选择一个较快的镜像。Portage 将会在 make.conf 文件中查找 `GENTOO_MIRRORS` 变量，并使用其中所列的镜像。可以通过浏览 Gentoo 镜像列表搜索一个（或一组）最接近系统物理位置（往往是最快的）的镜像。对于中国用户而言, 可以参考 [dist mirror CN](https://www.gentoo.org/downloads/mirrors/#CN) 列表配置 `GENTOO_MIRRORS` 变量.

#### Gentoo ebuild 软件仓库

选择镜像的第二个重要步骤是通过/etc/portage/repos.conf/gentoo.conf文件来配置 Gentoo的 ebuild 软件仓库。这个文件包含了更新 Portage 数据库（包含 Portage 需要下载和安装软件包所需要的信息的一个 ebuild 和相关文件的集合）所需要的同步信息。

通过几个简单的步骤就可以完成软件仓库的配置。首先，如果它不存在，则创建 [repos.conf](https://wiki.gentoo.org/wiki//etc/portage/repos.conf) 目录：

```sh
mkdir -p /mnt/etc/portage/repos.conf
```

接下来，复制 Portage 提供的 Gentoo 仓库配置文件到这个（新创建的）目录：

```sh
cp /mnt/usr/share/portage/config/repos.conf /mnt/etc/portage/repos.conf/gentoo.conf
```

修改 `/mnt/etc/portage/repos.conf/gentoo.conf` 的 sync-uri 选项, 使其符合读者你选择的镜像配置. 笔者建议使用 Git Repo Sync, 它通常远快于 Rsync, 配置可参见 [Gentoo Wiki](https://wiki.gentoo.org/wiki/Portage_with_Git) 和各大高校镜像站的文档. desktop stage 3 tarball 已默认包含 `dev-vcs/git`, 否则在 chroot 后, 同步之前需要使用 `emerge-webrsync` 获取一份 Portage 快照并安装 git, 然后才可以同步. 使用 USTC Gentoo Portage with Git 样例:
```conf
[DEFAULT]
main-repo = gentoo

[gentoo]
location = /var/db/repos/gentoo
sync-type = git
sync-uri = https://mirrors.ustc.edu.cn/gentoo.git
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
arch-chroot /mnt /bin/bash
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
  [1]   default/linux/amd64/23.0 *
  [2]   default/linux/amd64/23.0/desktop
  [3]   default/linux/amd64/23.0/desktop/gnome
  [4]   default/linux/amd64/23.0/desktop/kde
```

在看完框架的可用配置文件amd64之后，用户可以键入以下命令为系统选择一个不同的配置文件：

```sh
eselect profile set 2
```

建议读者不要轻易地变换 profile 类型, 而是应该选择和下载的 stage3 tarball 位于同一个 subset 的 profile (如笔者下载的是 desktop profile | systemd 的 stage3 tarball, 那么就只应从使用 systemd + glibc 的 profile 中选择, 对于有特定 DE 需求的读者则可以选择对应 DE 的 profile, 即 KDE 用户可以选择 KDE profile, Gnome 则可以选择 Gnome profile).

随意改变 libc 和 init system 可能导致系统损坏; 鉴于 Linux 尚有部分常用应用 (如 Wine 等) 仍需 32-bit 的 multilib 支持, 选择 no multilib 的 profile 也不明智 (并且几乎不可能在以后切换为 multilib 配置). 除非完全清楚自己在干什么, 这些都是普通用户需要避免的高危操作.

### 更新 @world 集合

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

Locale 不仅指定了用户希望与系统交互使用的语言, 也指定了字符串排序, 日期和时间显示等各地区有差异的内容. 通常来说, 至少需要生成 en_US 的 locale 来确保程序能够正确显示信息. 要在桌面中正常设置使用中文, 也会需要生成 zh_CN (或其他 zh_*) 的 locale. UTF-8 对于现代应用来说已经是事实上的标准, Linux 上通常也极少用到无法正确处理 UTF-8 的应用程序 (不同于 Windows). 因此, 除非非常清楚自己的需求, 生成对应 locale 的 UTF-8 变体即可. 使用 `nano /etc/locale.gen` 编辑需要生成的 locale:

```
en_US.UTF-8 UTF-8
zh_CN.UTF-8 UTF-8
```

保存并退出. 运行 `locale-gen` 来生成配置好的 locale.

完成 locale 生成后, 就需要选择系统级的 locale 设置. 没有额外 patch 的 Kernel 并不能正常显示中文和其他 CJK 字符, 考虑到 tty font 字符集之间的差异也可能未必能正常显示其他非 ASCII 字符, 因此并不推荐将系统 locale 设置为 `en_US.utf8` 以外的值. 列出可供选择的 locale:

```
# eselect locale list

Available targets for the LANG variable:
  [1]  C
  [2]  C.utf8
  [3]  en_US
  [5]  en_US.utf8
  [6]  zh_CN
  [8]  zh_CN.utf8
  [9] POSIX
  [ ]  (free form)
```

然后选择 locale (以上仅供参考, 以命令实际输出为准):

```
# eselect locale set 3
```

最后重载环境:

```sh
env-update && source /etc/profile && export PS1="(chroot) ${PS1}"
```

### 配置内核

非常不建议初次使用 Gentoo 的读者手动配置内核, 此种安装方法费时费力, 且稍有差池就会得到一个无法启动的内核. 如果确实有手动配置的需求, 请参考 Gentoo Handbook 的[对应章节 (en)](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Kernel#Alternative:_Manual_configuration). 如果使用了 btrfs 透明压缩, 不要忘记将对应的压缩方式 (一般是 LZO 或者 Zstd) 编译进内核中 (不是编译成模块). 如果需要使用 iwd 连接无线网络, 不要忘记开启对应的内核加密方式 (参考: [Gentoo Wiki: iwd](https://wiki.gentoo.org/wiki/Iwd#Kernel)).

推荐的安装方式是使用 Distribution Kernel, 这样内核会随系统一同更新且无需担心硬件兼容问题 (Gentoo 的 dist-kernel 会几乎编译所有的 non-obselete feature 和 hardware support).

首先, 在 `/etc/portage/make.conf` 配置 dist-kernel 的全局 USE flag:

```sh
USE="... dist-kernel initramfs"
```

考虑到配置的简洁性, 推荐生成 initramfs. 笔者自己由于通常使用较为复杂的配置, 并没有配置无 initramfs 系统的经验. 有兴趣的读者可在完成安装后自行使用 Gentoo Wiki 和 ArchWiki 探索这种配置方法.

然后, 根据要使用的启动器启用对应的 installkernel USE flag:

#### GRUB

编辑 `/etc/portage/package.use/installkernel`:

```gentoo
sys-kernel/installkernel dracut grub
```

对于 systemd 用户, 也可以额外添加 `systemd` USE flag 来使用更现代的 systemd kernel-install. 希望使用 ugrd 生成 initramfs 的用户可以将 `dracut` USE flag 替换为 `ugrd`, 后文不再赘述.

#### systemd-boot

systemd-boot 用户必须使用 systemd 提供的 kernel-install. 同样的, 编辑 `/etc/portage/package.use/installkernel`; systemd 用户:

```gentoo
sys-apps/systemd boot
sys-kernel/installkernel dracut systemd-boot
```

OpenRC 用户:

```gentoo
sys-apps/systemd-utils boot kernel-install
sys-kernel/installkernel dracut systemd systemd-boot
```

如果需要, 在 `/etc/kernel/cmdline` 中指定启动参数, 例:

```
loglevel=5
```

### 题外话: Unified Kernel Image (UKI)

在 UEFI 中, UKI 是一种将 Kernel, initramfs 和 cmdline 打包在一起的一个可执行映像文件, 可以直接被 UEFI BIOS 加载启动. 如果不使用安全启动, 这么做不会提供额外的好处, 但会一定程度上增加配置的复杂性 (使用传统布局时 installkernel 会自动处理好布局, 如使用 systemd-boot 则还会生成 entry.conf 并指定 cmdline), 因此笔者不推荐配置生成 UKI. 如果需要使用安全启动, 那么签名 UKI 更为直接, 同时可以防止启动参数遭到篡改导致加固措施被绕过. 对于安全启动和 UKI 感兴趣的读者可以移步 The Unorthodox Gentoo Handbook I (Advanced) 并阅读相关的章节 *(筹备中)*.

---

然后, 安装 dist-kernel 包和固件:

```sh
emerge --ask sys-kernel/gentoo-kernel
# 也可以用编译好的 binary
emerge --ask sys-kernel/gentoo-kernel-bin

# 固件, 许可为 @BINARY-REDISTRIBUTABLE
emerge --ask sys-kernel/linux-firmware

# Intel 处理器微码, 许可为 @BINARY-REDISTRIBUTABLE
# AMD 处理器微码已包含在 linux-firmware 中, 请跳过这步
emerge --ask sys-firmware/intel-microcode 
```

如果有额外的 DKMS 需求可以参考 Gentoo Handbook 的[对应章节](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Kernel/zh-cn#Alternative:_Using_distribution_kernels).

### 配置主机名和 hosts

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

### Root 密码

使用 `passwd` 命令设置 root 密码.

```sh
passwd
```

### 配置 init 系统

#### OpenRC

```sh
# 检查 OpenRC 的主配置文件. 仔细阅读注释, 很有帮助
nano /etc/rc.conf

# 配置 keymap. 多数用户都应该选择最标准的美式 104 键盘, 除非你真的客制化了 DVORAK 等小众配列的键盘,
# 或者使用了欧盟 / 日本地区销售的笔记本
# 请务必小心, 错误的设置可能导致键盘完全不可用
nano /etc/cond.d/keymaps

# 最后, 编辑硬件时钟设置
nano /etc/conf.d/hwclock
```

#### systemd

首先, 运行两条 systemd 配置初始化命令, 根据配置回答 prompt:

```sh
systemd-machine-id-setup
systemd-firstboot --prompt
```

然后, 使 systemd 启用所有 Gentoo Preset 应当启用的 service:

```sh
systemctl preset-all --preset-mode=enable-only

# 上述命令只会执行启用动作, 也可以执行全部初始化, 但可能导致一些已手动启用的 service 被禁用:
# systemctl preset-all
```

### 配置网络

大部分的 IPv4 网络环境都会使用 DHCP 来分配网关和 IP, 因此除非读者确认需要手动配置所有分配或在有 SLAAC 的纯 IPv6 环境下使用, 都推荐安装 DHCP Client:

```sh
emerge --ask net-misc/dhcpcd
```

对于安装桌面环境的系统来说, 主流的 DE 通常使用 NetworkManager 来管理全部的有线 / 无线网络连接:

```sh
emerge --ask net-misc/networkmanager
```

然后, 禁用其他全部 network 相关的服务并启用 NetorkManager 的服务:

```sh
# systemd
systemctl disable systemd-networkd dhcpcd iwd
systemctl enable NetworkManager

# OpenRC
for x in /etc/runlevels/default/net.* ; do rc-update del $(basename $x) default ; rc-service --ifstarted $(basename $x) stop; done
rc-update add NetworkManager default
```

NetworkManager 默认使用 wpa_supplicant 作为无线后端, 这在一些特定型号的无线网卡上似乎会有一些非致命性的问题 (如笔者曾经使用过的 Realtek RTL8852AE 在信号强度 <50% 时会有非常严重的断流). 此时可以编辑 USE flag 指定 nm 使用 iwd 作为默认无线后端, `nano /etc/portage/package.use/networkmanager`:

```gentoo
net-misc/networkmanager iwd
```

重新编译 NetworkManager:

```sh
emerge --ask --newuse --deep net-misc/networkmanager
```

重新启动后, 可使用 `nmtui` 以命令行界面的形式配置网络.

### 硬件时钟

写入硬件时钟:

```sh
hwclock -w
```

对于 Windows 双启动的读者来说, 推荐设置 Windows 使其将硬件时钟作为 UTC 时间而不是本地时间. 这是更为标准的做法, 详情可参考[这篇文章 (en)](https://www.howtogeek.com/323390/how-to-fix-windows-and-linux-showing-different-times-when-dual-booting/).

### 配置 cron daemon

安装 `sys-process/cronie` 包并启用:

```sh
emerge --ask sys-process/cronie

# systemd
systemctl enable cronie

# OpenRC
rc-update add cronie default
```

对于 systemd 用户来说, systemd 自带的 timer 功能也已足够. 如果不介意不使用 cron 更简便的格式的话, 也可不安装 cron daemon.

### 配置 bootloader

#### GRUB 2

安装 GRUB 2:

```sh
emerge -av sys-boot/grub:2
```

请注意: 运行上述命令将在出现之前输出启用的 GRUB_PLATFORMS 值. 如果输出中没有 `efi-64`, 则需要在安装前将 `GRUB_PLATFORMS="efi-64"` 添加到 `/etc/portage/make.conf` 再安装: 

```sh
echo "GRUB_PLATFORMS="efi-64" >> /etc/portage/make.conf
emerge --ask sys-boot/grub:2
```

如果有多系统启动的需求, 建议一并安装 `sys-boot/os-prober` 以检测其它系统的引导:

```sh
emerge --ask sys-boot/os-prober
```

将 GRUB2 安装至 EFI 分区:

```sh
grub-install --target=x86_64-efi --efi-directory=/efi
```

编辑 `/etc/defaut/grub` 以选择正确的 init 并启用 os-prober:

```conf
GRUB_DISTRIBUTOR="Gentoo"

# 10 秒等待时间
GRUB_TIMEOUT=10

# OpenRC 用户请去掉 init 相关选项
# 首次启动或需要 debug 时建议去除 quiet 选项以启用 logging
# nowatchdog 有时可以显著提升关机速度
GRUB_CMDLINE_LINUX="loglevel=5 quiet nowatchdog"

# GRUB 很多时候无法正确检测到屏幕分辨率
# 将此值设置为屏幕 长x宽x色深 的形式可以解决该问题
GRUB_GFXMODE=1920x1080x32

# 启用 os-prober
# 无需多系统的用户不必配置此项
GRUB_DISABLE_OS_PROBER=0
```

随后生成 grub.cfg:

```sh
grub-mkconfig -o /boot/grub/grub.cfg
```

#### systemd-boot

请确保在配置内核步骤设置了正确的 USE Flag 和内核参数, 否则请参考上述章节完成设置, 随后使用 `emerge --config sys-kernel/gentoo-kernel` 重新安装内核.

将 systemd-boot 安装至 EFI 启动菜单:

```sh
bootctl install
```

### 重启系统

退出 chroot 并解除挂载所有分区.

```sh
exit
```

```sh
cd
umount -vR /mnt
reboot
```

现在, 可以开始安装后工作了. 

安装后工作的 Handbook 第二章还在筹备.
