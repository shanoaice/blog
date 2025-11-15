+++
title = "拯救因意外断电损坏的 systemd-homed 加密家目录"
date = 2025-11-15
+++

前两天，当我在更新我笔记本上的 Arch Linux 时，由于忘记更新过程还没结束就尝试使用 supergfxctl 切换集成显卡并注销，导致内核挂起，不得不强制关机。重启后发现似乎刚好内核生成也没有跑完，本以为使用 Arch Live ISO 重复被中断的更新过程就能解决问题，结果重启后能够正常进入系统，但登录后 Plasma 界面却未能显示，同时弹出大量家目录不可写的弹窗。

## 问题诊断

当看到家目录不可写的提示后，我第一时间怀疑的就是 systemd-homed 是否正常工作。于是，我切换到空闲的 tty 并运行 `homectl` 查看家目录的状态：

```text
> homectl
NAME      UID   GID   STATE  REALNAME  HOME            SHELL   
shanoaice ---   --    dirty  shanoaice /home/shanoaice /bin/zsh
```

正常情况下，如果用户没有登录，状态应该是 inactive，而 dirty 表示 systemd-homed 未能正确地挂载我的家目录。我立即感到一丝不妙，由于我使用了 LUKS Storage 存储我的家目录数据，因此 systemd-homed 实际上创建了一份磁盘映像，将我的家目录存储在这份映像里一个加密的 LUKS2 卷上。如果因为强制关机导致家目录的磁盘损坏，那我的数据就可能永久地消失了。

## 尝试恢复

在 ArchWiki 的页面中一番搜索后，[这段提示](https://wiki.archlinux.org/title/Systemd-homed#Home_directory_in_a_dirty_state)显示对于状态为 dirty 的家目录，可以尝试使用 loop device 挂载来检查内部文件系统是否正常。于是，我根据 wiki 中的步骤尝试挂载 loop device:

```text
# losetup -fP --show /home/shanoaice.home
# lsblk
```

lsblk 的结果并不是很对劲：正常状况下，systemd-homed 创建的磁盘映像是带有 GPT 分区表的，losetup 的 `-P` 参数已经要求内核扫描分区表，但 lsblk 列出的 `/dev/loop0` 设备后并没有显示出任何分区。于是，我尝试使用 fdisk 检查分区表是否还正常。非常奇怪的是，fdisk 提示它检测到了 GPT Signature，但并没有找到任何可识别的 GPT 分区表，这意味着磁盘映像的分区表几乎一定是遭到了损坏，但有可能数据仍然还在磁盘映像中。经过又一番搜索，[systemd/systemd#32873](https://github.com/systemd/systemd/issues/32873#issuecomment-2411718884) 记录了几乎一样的错误情况，并给出了可能的修复方式。

首先，将原有的磁盘映像备份到其他位置，以免恢复操作造成进一步的破坏。随后，使用 fdisk 重建分区表：

1. 按 g 新建一份空的 GPT 分区表。
2. 按 n 新建一个分区，大小占满整个磁盘分区（fdisk 默认即如此做）。此时，fdisk 弹出提示，显示它在这个分区上检测到了一个 LUKS Signature，询问是否要抹除它。这是另一个迹象，表明磁盘映像可能真的未遭受灾难性的损坏。选择**不要抹除**。
3. 最后，按 w 写入重建后的分区表并退出 fdisk。

接下来就到了尝试挂载家目录的时候了。由于使用了 LUKS2 加密，需要先解锁卷：

```text
# cryptsetup open /dev/loop0p1 home
```

此时，cryptsetup 弹出需要输入密码来解锁卷的提示，代表它正确地检测到了 LUKS2 卷的分区头标记。使用目标用户的密码来解锁卷，然后挂载：

```text
# mkdir -p /mnt/home
# mount -v /dev/mapper/home /mnt/home
```

mount 提示成功挂载，使用 ls 列出文件列表，看起来一切正常。不过，现在还不是可以掉以轻心的时候。默认情况下，较新的 systemd-homed 在 LUKS2 卷内使用的文件系统是 btrfs，因此现在需要请求 btrfs 检查所有文件的 checksum，以确保没有隐藏的文件损坏：

```text
# btrfs scrub start /mnt/home
# btrfs scrub status /mnt/home
```

还好，btrfs scrub 最后未检测到任何损坏。这代表映像应该已经完成修复，可以准备登录用户了。在这之前，先解除映像的挂载：

```text
# umount -v /mnt/home
# losetup --detach /dev/loop0
```

## 尝试登录

为了避免有任何疏漏导致不能正常挂载家目录后其他应用程序的报错信息污染 journal，我打算先尝试使用 `homectl activate shanoaice` 的方法来检查能不能正常激活家目录区域。很不幸的是，homectl 再一次提示它未能成功解锁家目录，并且将用户的状态重新设为了 dirty. 我不得不回头检查是否漏掉了一些过程。

在仔细阅读 systemd-homed 的文档后，我发现它似乎会严格地验证 GPT 分区表的分区类型和分区 UUID 是否和用户记录中的相符，而我在重建分区表的过程中似乎都只采用了默认的参数，因此，有可能是 homectl 在验证 UUID 时发现记录不符，因此拒绝挂载。于是，我使用 `homectl inspect shanoaice` 来查看我自己用户记录的 Part UUID，并将其拍照保存（tty没有剪贴板）。fdisk 在其高级模式下支持手动修改分区 UUID，因此还需要使用它来完成最后的修复。首先，重新设置 loop device:

```text
# losetup -fP --show /home/shanoaice.home
```

然后调用 `fdisk /dev/loop0` 再次修改分区表：

1. 按 t 修改分区类型。systemd-homed 要求分区的类型 UUID 为 `773f91ef-66d4-49b5-bd83-d683bf40ad16`。按 L 列出所有分区类型，然后搜索，得知该 UUID 对应 `Linux user's home`。在列出的类型中，每行的开始代表 fdisk 的类型代号。在我使用的版本中，`Linux user's home` 对应 143。输入 143 以将分区修改为该类型。
2. 按 x 进入高级选项。按 n 修改分区名，输入你的用户名，对于我来说，是 `shanoaice`。回车确认更改。
3. 按 u 更改分区 UUID。输入之前记录下来的 UUID，切记检查不要输错。回车确认更改。
4. 按 r 回到主菜单。按 w 写入分区表修改。

最后，再次 detach loop device，然后使用 `homectl activate shanoaice` 检查是否正常。这次，homectl 终于提示激活成功，修复完成。重启电脑后并登录后，Plasma 桌面也如愿地出现在了屏幕上。

## 总结与教训

systemd-homed LUKS storage 所使用的 loop 磁盘映像方式在意外关机的情况下并不那么可靠。如果你运气不好，磁盘映像有可能会损坏。只是分区表损坏的问题可能还好，但如果运气非常差，损坏了 LUKS 加密后的数据，后果有可能是无法挽回的。一定要对自己的重要数据做好备份，以免真的丢失。
