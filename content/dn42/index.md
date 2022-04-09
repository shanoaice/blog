+++
title = 'DN42'
+++

DN42 全称 Decentralized Network 42（42 号去中心网络），是一个大型、去中心化的 VPN 网络。但是与其它传统 VPN 不同的是，DN42 本身不提供 VPN 出口服务，即不提供规避网络审查、流媒体解锁等类似服务。相反，DN42 的目的是模拟一个互联网。它使用了大量在目前互联网骨干上应用的技术（例如 BGP 和递归 DNS），可以很好地模拟一个真实的网络环境。

我在 DN42 中运营 AS4242423743 (CHATNOIR-AS), 目前拥有六个节点。有 peer 请求可以联系我的 Telegram 账号 @mika_akizuki (暂时只接受 WireGuard Tunnel).

I operate AS4242423743 (CHATNOIR-AS) in DN42, with 6 nodes currently online. If you want to peer with me, please contact `shanoaice@HackInt#dn42` on IRC or send a email to `mashiro350 [at] protonmail [dot] com`.

# 路由图 Route Propagation Graph
![DN42 Route Propagation Graph](https://bgp-api.strexp.net/as_graph/AS4242423743)

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

- **Fremont, California, United States** FMT1-US  
  Provider: Koisp KGC  
  Speed: 120Mbps  
  WireGuard Pubic Key: `x8nuSiQ4B9fyV/Qe7htgsjeuPMQPziAvOigOt+FWIgs=`  
  Endpoint: fmt1-us.bugsur.xyz  
  WireGuard Port: your last 5 ASN digits  
  IPv4 Address: v4.fmt1-us.bugsur.xyz  
  IPv6 Address: v6.fmt1-us.bugsur.xyz  
  DN42 IPv4 Address: 172.20.158.209  
  DN42 IPv6 Address: fdad:b98a:7dcb::2434  
  Link Local Address: fe80::2434/64  
  Multi Protocol BGP: **Yes** (link local IPv6 **preferred**)  
  Extended Next Hop: **Yes**

- **Chicago, Illnois, United States** (*Down*)  
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

## 即将上线的节点列表 Upcoming Node List

- **Shanghai, China** PVG1-CN  
  中国电信家宽，100Mbps 下行，30Mbps 上行.  
  China Telecom Home Broadband, 30Mbps Up, 100Mbps Down.

## 已退役节点列表 Historical Node List

- **Zurich, Switzerland** (Feb. 12th, 2022)  
  Due to Azure Cloud's high cost and its suboptimal cold-potato routing in Zurich region, this node has been decommissioned. Its functionality is replaced by both **AMS1-NL** and **LEJ1-DE** node. Its DN42 IP address alongside with previous peers has been re-assigned to **AMS1-NL** node. The public DNS record zrh1-ch.bugsur.xyz is preserved for compatibility and is now pointing to ams1-nl.bugsur.xyz (which is AAAA only).  
  由于 Azure 高昂的费用和其在瑞士地区较为迷惑的冷土豆路由，苏黎世节点已经从网络中被移除。它的功能将被新的阿姆斯特丹与莱比锡节点共同承担。它的 DN42 IP 地址与原有的对等连接已经被重分配给阿姆斯特丹节点。它的终端节点域名 zrh1-ch.bugsur.xyz 现在指向 ams1-nl.bugsur.xyz (为兼容性原因保留，但现在该地址只有 IPv6 AAAA 记录).

- **Falkenstein, Germany** (Mar. 8th, 2022)  
  Falkenstein's location is somehow redundant as there is already a backbone node at Amsterdam in West Europe location. In order to improve connection to East Europe location, this node is now being replaced by the Finland node located at Helsinky. Existing peers and domains are not preserved.  
  由于西欧地区已经存在阿姆斯特丹这一骨干节点，法尔肯施泰因的位置使本节点显得有些冗余。因此，此节点将被位于赫尔辛基的芬兰节点替代，以期改善东欧地区的连接质量。此次迁移不保留域名与已有对等互联。

- **Los Angeles, California, United States** (Mar.24th, 2022)  
  I have decided to not continue using DMIT's Premium Los Angeles VPS due to having a better & cost-effective choice (Kolar Cloud's Fremont 9929). New service is approximately at the same location (OAK1-US), so existing peers will be preserved. Old domains will still be kept for a few weeks.  
  由于有性价比更优的选择，我决定不再续期 DMIT 的 Premium 洛杉矶 VPS. 新节点 (OAK1-US) 位于湾区的弗里蒙特，与洛杉矶地理位置相近，因此我决定保留原有的全部对等互联. 旧域名将会保留一段时间，指向新节点的 IP.

- **Toronto, Canada** (Apr.9th, 2022)  
  186526's account providing this node has been suspended by Oracle Cloud for no reason and he decided not to recover this node. I understand his choice and so will take this node down. Hopefully a new low-price substitiution can be added soon.  
  由于 Oracle Cloud 在没有任何预兆的情况下暂停了 186526 为本节点使用的账户，他决定不恢复此节点。我对此决定表示理解，因此将关闭本节点。我已经开始寻找北美东海岸的低价替代，希望能够尽快恢复该地区的接入。

- **Helsinky, Finland** (Apr.9th, 2022)  
  It seems that there is not much DN42 coverage in Eastern Europe area. No peers has been established since the addition of this node, so I decided to decommision this node. No substitiution is planned.  
  自从此节点上线以来，我并没有找到合适的对等互联，也没有任何与此节点的对等互联请求，因此我决定关闭这一节点。目前并无对此节点的替代计划。

如果想与我对等互联，请联系 `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` 或 Telegram @mika_akizuki.

For peering requsets, please contact `mashiro350 [at] protonmail [dot] com`, `shanoaice@HackInt#dn42` or @mika_akizuki on Telegram.

我的 Looking Glass 地址位于博客底栏中, 供完成 peer 后检查连接状态.

My Looking Glass instance links is in the footer of this blog. You can use it to check connectivity after peering is done.
