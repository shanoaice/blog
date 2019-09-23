---
title: "构建一个本地rust crates镜像"
date: 2019-08-15T11:35:45+08:00
---

众所周知, rust的官方包管理器源在国内有点小问题, 轻则下载速度缓慢, 重则连接超时, 而唯一在国内提供rust crates镜像源的中科大源也时常挂掉, 所以你也许需要构建一个本地源以备不时之需.

## 搭建步骤

1. 将github上的rust crates官方镜像源克隆到本地(目前大小100MB多, 还可以接受)
``` bash
git clone https://github.com/rust/crates.io-index.git
```
2. 切换到本地目录
``` bash
cd crates.io-index
```
3. 打开这个目录下的`config.json`文件, 然后将其替换为以下内容:
``` json
{
    "dl": "https://crates-io.proxy.ustclug.org/api/v1/crates",
    "api": "https://crates.io/"
}
```
*这边用了中科大搭的一个rust crates API反向代理, 这玩意实测可用*

4. 这样镜像本身就搭建好了

*注: 这个镜像更新速度贼快, 而且拉取一般情况下耗时不会太长, 所以你可以没事就`git pull origin`拉一下*

## 配置cargo

接下来就轮到配置cargo了, 将以下内容写入你的`~/.cargo/config`文件中(此处路径为使用rustup安装的默认路径):
``` toml
[source.crates-io]
replace-with = 'local'
[source.local]
registry = "file://这儿替换成你的镜像目录的绝对路径"
```
如果你配置过中科大源, 那你的配置文件应该看上去像这样:
``` toml
[source.crates-io]
replace-with = 'ustc'
[source.ustc]
registry = "https://mirrors.ustc.edu.cn/crates.io-index"
```
在`source.ustc`项下面加一行 `replace-with = 'local'`
然后把下面的东西粘贴到文件末尾就行了:
``` toml
[source.local]
registry = "file://这儿替换成你的镜像目录的绝对路径"
```

## 附: 关于Windows下镜像目录的URL

如果Windows下你的镜像目录的绝对路径是`C:/crates.io-index`, 那么镜像目录的URL是`file:///C:/crates.io-index`
