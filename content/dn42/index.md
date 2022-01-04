+++
title = 'DN42'
+++

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

我在 DN42 中运营 AS4242423743 (CHATNOIR-AS), 目前拥有一个节点。有 peer 请求可以联系我的 Telegram 账号 @mika_akizuki (暂时只接受 WireGuard Tunnel).

I operate AS4242423743 (CHATNOIR-AS) in DN42, with one node currently online. If you want to peer with me, please contact `shanoaice@HackInt#dn42` on IRC or send a email to `mashiro350 [at] protonmail [dot] com`.

# 节点列表

除非另外标明，IPv6 Link Local 地址均为 `fe80::2434`; 所有节点均支持 Extended Next Hop 和 MP-BGP (on v6). 如果你的节点不支持 MP-BGP, 请在 peering request 中说明. 

对于一般的 DN42 网络 peer 而言, 隧道端口为 2xxxx (xxxx 为你的 AS 号后四位). 来自其他网络 (例如 NeoNetwork) 的 peer 请求请单独说明, 一般会分配 5xxxx 端口作为隧道端点 (xxxx 同样为你的 AS 号后四位). 

如果你的节点没有 (或者没有固定的) 公网 IP, 也请说明, 否则可能会造成连接丢失.

我的 Looking Glass 地址位于博客底栏中, 供完成 peer 后检查连接状态.

Unless otherwise noted, IPv6 link local address of all nodes are `fe80::2434`. All nodes supports and by default enables Extended Next Hop and MP-BGP capabalities. If your node does not support MP-BGP, please mention it in your peering request. 

To usual DN42 peers (with AS number in format AS424242xxxx), the tunnel port will be 20000 + **last 4 digits of your AS number**. If your AS number is out of that range, you will usually get 50000 + **last 4 digits of your AS number** as the tunnel port. 

If your node does not have (or does not have a fixed) clearnet ip, please mention in the request too, otherwise a misconfiguration may cause lost of connection.

My Looking Glass instance links is in the footer of this blog. You can use it to check connectivity after peering is done.

- **Los Angeles, CA, United States**
  - WireGuard Pubic Key: `x8nuSiQ4B9fyV/Qe7htgsjeuPMQPziAvOigOt+FWIgs=`
  - Endpoint: lax1-cn2.bugsur.xyz
  - IPv4 Address: v4.lax1-cn2.bugsur.xyz
  - IPv6 Address: v6.lax1-cn2.bugsur.xyz
  - DN42 IPv4 Address: 172.20.158.209
  - DN42 IPv6 Address: fdad:b98a:7dcb::2434
