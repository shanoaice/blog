+++
title = '记录配置 DN42 内网过程'
date = 2022-01-18
draft = true
+++

在此记录一下配置 DN42 内网的过程.

## 链路隧道及内部路由

(本段内容写成于网络大重构前, 现架构已可完成 Full Mesh 连接)
内网各个节点的联通是首先要解决的问题, 但第一步这里就遇到了麻烦. 原本我设想中的网络规模暂时不会太大, 所以用 Layer 3 的 WireGuard 隧道做 full mesh connection 应当不成问题. 现实击碎了我的幻想: NoyesIX 节点并没有公网 v4, 而位于苏黎世的 Azure 节点刚好相反 -- 没有公网 v4. 此时 Layer 2 VPN 也于事无补, 因为即使是 L2 VPN 也需要所有节点直接物理联通 (至少间接联通) 才行, 而 NoyesIX 到苏黎世 Azure 根本无法联通, 自然做不到 full mesh.

此时, 我第一时间想到的是使用现有的 IGP 方案来完成内网选路协商. 在 OSPF 与 babel 中, 我选择了配置更为简易的 babel, 并使用能够自动测量延迟的 babeld 作为 daemon.
