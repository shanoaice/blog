+++
title = 'DN42'
+++

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

我在 DN42 中运营 AS4242423743 (CHATNOIR-AS), 目前拥有六个节点。有 peer 请求可以联系我的 Telegram 账号 @mika_akizuki (暂时只接受 WireGuard Tunnel).

I operate AS4242423743 (CHATNOIR-AS) in DN42, with 6 nodes currently online. If you want to peer with me, please contact `shanoaice@HackInt#dn42` on IRC or send a email to `mashiro350 [at] protonmail [dot] com`.

# 节点列表 Node List

- **Amsterdam, Netherland** AMS1-NL  
  Provider: Scaleway  
  Speed: 100Mbps  
  WireGuard Pubic Key: `MUShSTyApCSU7Rc1TLCGKiyyOBAIkLzEEVCpOf6wbQ0=`  
  EndPoint: ams1-nl.bugsur.xyz (v6 only)  
  IPv4 Address: v4 Clearnet NAT access is provided by **Cloudflare WARP**  
  IPv6 Address: v6.ams1-nl.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  DN42 IPv4 Address: 172.20.158.211  
  DN42 IPv6 Address: fdad:b98a:7dcb::2436  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**  

- **Falkenstein, Germany** LEJ1-DE  
  Provider: Hax.co.id (L1 Provider is Hetzner)  
  Speed: 100Mbps  
  WireGuard Pubic Key: `FzKNluDXuNscqy2WQ6Ik7+HcWoSoD4P9MqiltZykhAs=`  
  EndPoint: lej1-de.bugsur.xyz (v6 only)  
  IPv4 Address: v4 Clearnet NAT access is provided by **Cloudflare WARP**  
  IPv6 Address: v6.lej1-de.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  DN42 IPv4 Address: 172.20.158.213  
  DN42 IPv6 Address: fdad:b98a:7dcb::2438  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**  

- **Los Angeles, California, United States** LAX1-US  
  Provider: DMIT  
  Speed: 500Mbps  
  WireGuard Pubic Key: `x8nuSiQ4B9fyV/Qe7htgsjeuPMQPziAvOigOt+FWIgs=`  
  Endpoint: lax1-us.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  IPv4 Address: v4.lax1-us.bugsur.xyz  
  IPv6 Address: v6.lax1-us.bugsur.xyz  
  DN42 IPv4 Address: 172.20.158.209  
  DN42 IPv6 Address: fdad:b98a:7dcb::2434  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**

- **Toronto, Canada** YYZ1-CA  
  Provider: Oracle Cloud  
  **Sponsored by: [186526](https://net.186526.xyz)**  
  Speed: 480Mbps  
  WireGuard Public Key: `XTBuEghaAHzVAThpPytjD1VRvy0KcS71fT5+aX6I7jI=`  
  Endpoint: yyz1-ca.bugsur.xyz (v4 only)  
  WireGuard Port: your last 5 ASN digits  
  IPv4 Address: v4.yyz1-ca.bugsur.xyz  
  IPv6 Address: v6 Clearnet NAT access is provided by **Cloudflare WARP**  
  DN42 IPv4 Address: 172.20.158.214  
  DN42 IPv6 Address: fdad:b98a:7dcb::2439  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**

> 位于加拿大的多伦多节点由 [186526](https://net.168526.xyz) 赞助，配置为 Oracle Cloud Ampere Compute A1 Flex, 2 OCPU, 12GB RAM. 感谢他的支持.
>
> The Toronto, Canada node is sponsored by [186526](https://net.168526.xyz), spec Oracle Cloud Ampere Compute A1 Flex, 2 OCPU, 12GB RAM. Thanks for his/her support.

- **Chicago, IL, United States** (*Down*)  
  Provider: *NoyesIX*  
  Endpoint: noyesix.bugsur.xyz (IPv6)  
  **Usually** you will want to join NoyesIX (ask in the unofficial multilingual Telegram group) to peer with this node.  

- **Osaka, Japan** KIX1-JP  
  Provider: Oracle Cloud  
  Speed: 480Mbps  
  WireGuard Public Key: `bs/T5TWlC75M7zaQM0U/Nr+An/EeXR/LFU946uGHBU4=`  
  Endpoint: kix1-jp.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  IPv4 Address: v4.kix1-jp.bugsur.xyz  
  IPv6 Address: v6.kix1-jp.bugsur.xyz
  DN42 IPv4 Address: 172.20.158.214  
  DN42 IPv6 Address: fdad:b98a:7dcb::2439  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**

## 已退役节点列表 Historical Node List

- **Zurich, Switzerland** (Feb. 12th, 2022)  
  Due to Azure Cloud's expensive cost and its suboptimal cold-potato routing in Zurich region, this node has been decommissioned. Its functionality is replaced by both **AMS1-NL** and **LEJ1-DE** node. Its DN42 IP address alongside with previous peers has been re-assigned to **AMS1-NL** node. The public DNS record zrh1-ch.bugsur.xyz is preserved for compatibility and is now pointing to ams1-nl.bugsur.xyz (which is AAAA only).  
  由于 Azure 高昂的费用和其在瑞士地区较为迷惑的冷土豆路由，苏黎世节点已经从网络中被移除。它的功能将被新的阿姆斯特丹与莱比锡节点共同承担。它的 DN42 IP 地址与原有的对等连接已经被重分配给阿姆斯特丹节点。它的终端节点域名 zrh1-ch.bugsur.xyz 现在指向 ams1-nl.bugsur.xyz (为兼容性原因保留，但现在该地址只有 IPv6 AAAA 记录).

如果想与我对等互联，请联系 `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` 或 Telegram @mika_akizkui.

For peering requsets, please contact `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` or @mika_akizkui on Telegram.

我的 Looking Glass 地址位于博客底栏中, 供完成 peer 后检查连接状态.

My Looking Glass instance links is in the footer of this blog. You can use it to check connectivity after peering is done.
