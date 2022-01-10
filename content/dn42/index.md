+++
title = 'DN42'
+++

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

我在 DN42 中运营 AS4242423743 (CHATNOIR-AS), 目前拥有一个节点。有 peer 请求可以联系我的 Telegram 账号 @mika_akizuki (暂时只接受 WireGuard Tunnel).

I operate AS4242423743 (CHATNOIR-AS) in DN42, with one node currently online. If you want to peer with me, please contact `shanoaice@HackInt#dn42` on IRC or send a email to `mashiro350 [at] protonmail [dot] com`.

# 节点列表

- **Zurich, Switzerland**  
  Provider: Azure Cloud  
  Speed: 1Gbps  
  WireGuard Pubic Key: `jSStWALn3+1Iqy9RXygkVomaGGm6g+M1+zFuQiey60k=`  
  EndPoint: zur1-azr.bugsur.xyz (behind **NAT**)  
  IPv4 Address: zur1-azr.bugsur.xyz  
  IPv6 Address: No IPv6 Clearnet Address  
  WireGuard Port: your last 5 ASN digits  
  DN42 IPv4 Address: 172.20.158.211  
  DN42 IPv6 Address: fdad:b98a:7dcb::2436  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**  

- **Los Angeles, CA, United States**  
  Provider: DMIT  
  Speed: 500Mbps  
  WireGuard Pubic Key: `x8nuSiQ4B9fyV/Qe7htgsjeuPMQPziAvOigOt+FWIgs=`  
  Endpoint: lax1-cn2.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  IPv4 Address: v4.lax1-cn2.bugsur.xyz  
  IPv6 Address: v6.lax1-cn2.bugsur.xyz  
  DN42 IPv4 Address: 172.20.158.209  
  DN42 IPv6 Address: fdad:b98a:7dcb::2434  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**

- **Chicago, IL, United States**  
  Provider: *NoyesIX*  
  Endpoint: noyesix.bugsur.xyz (IPv6)  
  **Usually** you will want to join NoyesIX (ask in the unofficial multilingual Telegram group) to peer with this node.  
  If ping to other peer is **unacceptable** (such as when you are running a Europe IPv6 only PoP), this node can still accept direct peers. Just ask before proceeding and I will send the config to you.

如果想与我对等互联，请联系 `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` 或 Telegram @mika_akizkui.

For peering requsets, please contact `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` or @mika_akizkui on Telegram.

我的 Looking Glass 地址位于博客底栏中, 供完成 peer 后检查连接状态.

My Looking Glass instance links is in the footer of this blog. You can use it to check connectivity after peering is done.
