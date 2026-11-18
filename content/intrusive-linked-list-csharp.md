---
title: "在 C# 里实现 Arena 分配器 (和侵入式链表): 哈? 我不是托管型语言吗?"
createTime: '2026-11-17 21:08:00'
permalink: /intrusive-linked-list-csharp/
---

> 本文的代码经由 AI 指导思路与验证, 代码实现与正文内容完全由人类创作.

C# 在通常的认知里似乎是和 Java 等坐一桌的 GC 型高级语言, 看上去和侵入式链表这种"指针魔法"并不沾边, 跟手写分配器好像就更是相去甚远了. 但是, 相比于 Java 在设计之初 all-in GC, all-in objects 的态度, .NET 平台作为后辈其实已经见识到 Java 在万物皆对象上吃的苦头, 再加上早期与 Windows/COM 生态深度互操作的现实需求, 从诞生第一天起, .NET 就拥有原生的值类型 (而不是仅限于 Java 里那几个少得可怜的基本类型) 和真正操作裸指针的能力, 以及在很长的一段时间里能甩传统 JNI 一大条街的 P/Invoke FFI 原生交互.

尽管 C# 在设计之初的潜力无穷, 但 .NET Framework 时期, C# 7.0 之前, 折腾这些东西依然十分痛苦. 压缩式 GC 的特征导致一旦忘记手动调用固定就会炸出大堆野指针, 动态分配的非托管堆数组没有编译时的长度检测, 也缺少阻止栈逃逸的语言机制. 转机来自微软另一段颇具传奇色彩的 "野心": 从早期的 Singularity 到后来著名的 Midori 项目, 微软曾试图用 C# / .NET 的系统级变体来构建一整套纯托管操作系统. 尽管这个把操作系统内核全盘托管化的梦想最终还是落空了, 但 Midori 团队在高性能, 零分配与安全系统编程上攒下的丰厚遗产却并没有被埋没, 而是直接反哺给了全新启航的 .NET Core 与现代 C#. 这些能让我们舒适地折腾底层类型的特性几乎都是来自 Midori 的馈赠:

- `ref struct` 不可逃逸上堆/装箱的结构体, 解决了栈上生命周期管理的大难题. (C# 7.2, .NET Core 2.1)
- `ref struct Span<T>, ReadOnlySpan<T>` 带边界检查的安全内存视图. (.NET Core 2.1)
- `scoped` 关键字, 用来显式约束 `ref` 与 `ref struct` 的逃逸作用域, 在编译期拦住悬垂引用. (C# 11)
- `[InlineArray]` 在结构体内部直接内联定长缓冲区并天然兼容 `Span<T>` (这本身也是当年 Midori 里 `Packs` 概念的精神续作). (C# 12, .NET 8)
- 支持实现 `IDisposable` 的 `ref struct`, 配合 `using` 关键字能轻松地实现类 RAII 语义. (C# 8.0 引入基于模式的 `using`, C# 13 正式允许实现接口)
- `System.Runtime.InteropServices.NativeMemory` 跨平台的非托管内存分配工具, 告别了过去笨重的 `Marshal.AllocHGlobal` 或手写 `malloc` 绑定. (.NET 6)
- `System.Runtime.CompilerServices.Unsafe` 与 `MemoryMarshal`, 提供各类零开销的底层引用提取、指针操作与类型转换工具. (.NET Core 1.0 / .NET Core 2.1)

没有这些标准库和语言特性的支持, 尤其是其中的 `Unsafe` 工具包, 正确地实现本文中的逻辑将要困难的多得多.

## 开端

引入了这么长一段, 让我们回过头来看看我具体为什么要用到 C# 这种高级语言的另一面: 我近来尝试为 Arch Linux 的包管理器 pacman 背后的 libalpm 编写一个 .NET 平台的包装库, 既作为使用 C# 做系统级编程的练习, 也方便实现一些我自己想要魔改的功能和 (可能的) 现代 GUI 界面. 由于 libalpm 是非常老式的纯 C 库, 它所使用的所有列表数据结构都是一个名为 `alpm_list_t` 的双链表, 定义大致如下:

```csharp
[StructLayout(LayoutKind.Sequential)]
public unsafe struct _alpm_list_t
{
    public void* data;
    public _alpm_list_t* prev;
    public _alpm_list_t* next;
}
```

`libalpm` 也提供了相应的工具函数用来操作这些链表, 使用 P/Invoke 导入后在 C# 中的定义大致如此 (自 `csbindgen` 生成的绑定中摘抄了重要的几个函数):

```csharp
internal static unsafe class NativeMethods 
{
    const string __DllName = "libalpm";
    
    [DllImport(__DllName, EntryPoint = "alpm_list_free", CallingConvention = CallingConvention.Cdecl, ExactSpelling = true)]
    internal static extern void alpm_list_free(_alpm_list_t* list);

    [DllImport(__DllName, EntryPoint = "alpm_list_free_inner", CallingConvention = CallingConvention.Cdecl, ExactSpelling = true)]
    internal static extern void alpm_list_free_inner(_alpm_list_t* list, delegate* unmanaged[Cdecl]<void*, void> fn_);

    [DllImport(__DllName, EntryPoint = "alpm_list_add", CallingConvention = CallingConvention.Cdecl, ExactSpelling = true)]
    internal static extern _alpm_list_t* alpm_list_add(_alpm_list_t* list, void* data);
}
```

有许多 libalpm 的函数要接受来自调用方构造的 `alpm_list_t` 作为输入参数, 例如 `alpm_checkdeps()`:

```csharp
/// <summary>
///  Checks dependencies and returns missing ones in a list.
///  Dependencies can include versions with depmod operators.
///  @param handle the context handle
///  @param pkglist the list of local packages
///  @param remove an alpm_list_t* of packages to be removed
///  @param upgrade an alpm_list_t* of packages to be upgraded (remove-then-upgrade)
///  @param reversedeps handles the backward dependencies
///  @return an alpm_list_t* of alpm_depmissing_t pointers.
/// </summary>
[DllImport(__DllName, EntryPoint = "alpm_checkdeps", CallingConvention = CallingConvention.Cdecl, ExactSpelling = true)]
internal static extern _alpm_list_t* alpm_checkdeps(_alpm_handle_t* handle, _alpm_list_t* pkglist, _alpm_list_t* remove, _alpm_list_t* upgrade, int reversedeps);
```

直觉上来讲, 在 C# 的包装库中最简单的办法就是对于用户传入的集合, 我们手工遍历并一个一个附加链表项:

```csharp
public unsafe IReadOnlyList<MissingDependency> CheckDependency(
  IReadOnlyCollection<AlpmPackage> packages,
  IReadOnlyCollection<AlpmPackage> removedPackages,
  IReadOnlyCollection<AlpmPackage> upgradePackages,
  bool reverseDependencies = false)
{
  _alpm_list_t* packagesListPointer = null;
  _alpm_list_t* removedPackagesListPointer = null;
  _alpm_list_t* upgradePackagesListPointer = null;

  foreach (var package in packages)
  {
    packagesListPointer = NativeMethods.alpm_list_add(packagesListPointer, package.PackageHandle);
  }
  // 对于其他链表也如此操作...

  return NativeMethods.alpm_checkdeps(this.Handle, packagesListPointer, ...); // 不要在意返回类型不对, 意思到了 ;)
}
```

仔细思考的话, 这么做的效率其实并不很高: 对于传入的每一个列表项, `alpm_list_add()` 都在幕后做了一次堆分配. 但再多想想, 我们又发现此事好像也没有那么糟. 这和我的包装库的使用场景有关: 这些在非托管堆 / FFI 边界外的分配造成的主要麻烦其实是调用开销, 影响的是代码的吞吐量. 可是, 在真实 Arch Linux 系统里, 多数用户一般也就装上百个包, 撑死了几千个, 一次更新或查询等场景更是通常远不到这个数. 费尽心力优化最后节约的开销不过就几百纳秒, 撑死几十微秒, 即使是在 GUI 里, 由于是计算线程的操作, 不过是让用户少等一眨眼的时间, 实在是过度设计. 那么, 我为什么最后还是需要设计 Arena 分配器这种看似复杂的解决方案呢?

## 死结

问题的关键在于列表内容的类型. 上一个例子中, 列表里装的东西本就有原生端对应的结构体, 构造列表要做的只是一次访问, 取出里面的原生指针即可. 但是, 万一我们要传的是字符串呢? .NET CLR 内部的字符串表示可是 UTF-16, 而 libalpm 接受的是 Linux 下 C 代码最标准的 NUL Terminated UTF-8 字符串. 这意味着我们需要做多得多的工作, 如果我们只是沿用之前的简易实现, 流程就要变成这样:

1. 遍历用户传入的字符串集合.
2. 对于每个 .NET 字符串, 在托管堆上分配一个 `byte[]` 数组, 用 `Encoding.UTF8.GetBytes()` 往里写 UTF-8 字符串.
3. 使用 `GCHandle` 固定住这个数组并获取它的指针, 然后丢给 `alpm_list_add()`.
4. 调用返回后, 逐个解除对 UTF-8 字符串数组的固定.

示例代码如下:

```csharp
public static unsafe IReadOnlyCollection<AlpmPackage> SearchDatabaseNaive(_alpm_db_t* db, IReadOnlyCollection<string> needles)
{
    _alpm_list_t* needleList = null;
    // 为了让所有 byte[] 在跨边界调用期间保持固定，必须用 List 收集句柄
    var handles = new List<GCHandle>(); 

    try
    {
        foreach (var needle in needles)
        {
            var byteCount = Encoding.UTF8.GetByteCount(needle);

            // 1. 托管堆分配：为每个关键词创建 byte[]
            var bytes = new byte[byteCount + 1];

            // 2. 编码写入并追加 NUL 终止符
            Encoding.UTF8.GetBytes(needle, 0, needle.Length, bytes, 0);
            bytes[byteCount] = 0;

            // 3. 手动钉住对象，阻止 GC 移动或回收，获取原生指针
            var handle = GCHandle.Alloc(bytes, GCHandleType.Pinned);
            handles.Add(handle); // List 可能会发生内部数组扩容分配

            var ptr = (byte*)handle.AddrOfPinnedObject();

            // 4. 非托管堆分配：alpm_list_add 内部逐个 malloc 节点
            needleList = NativeMethods.alpm_list_add(needleList, ptr);
        }

        _alpm_list_t* retList = null;

        // 5. 发起 Native 搜索调用
        var ret = NativeMethods.alpm_db_search(db, needleList, &retList);
        if (ret != 0)
        {
            // 错误处理...
        }

        return retList;
    }
    finally
    {
        // 6. 逐个手动解除 GC 钉住状态
        foreach (var handle in handles)
        {
            if (handle.IsAllocated)
            {
                handle.Free();
            }
        }

        // 7. 释放 Native 链表节点（byte[] 散落在托管堆等下一次 GC 清理）
        if (needleList != null)
        {
            NativeMethods.alpm_list_free(needleList);
        }
    }
}
```

`alpm_db_search` 是个相当高频的操作, 每次 `pacman -Ss` 或者在 GUI 里输入搜索词, 都要调用它. 代码里的核心逻辑不过一行简单的 P/Invoke (实际操作中可能还要稍微多一两行最后从原生的 `alpm_list_t` 转成 `IReadOnlyCollection` 的代码, 不过这不影响我们的结论), 却要花上三四十行完全用来伺候编解码和生命周期管理. 更糟糕的是, 这里面每一个搜索字符串 / 正则表达式字符串都要做至少一次托管堆分配 (UTF-8 字符串数组和用来记录 `GCHandle` 的 `List`), 还要暂时钉住字符串, 造成碎片化. 类似的例子还有 `alpm_db_set_servers`, Arch Linux 里每个软件源的 mirrorlist 动辄数百行, 虽然通常只在重新加载配置文件的时候才会调用, 但一次就会往托管堆的 Gen 0 里塞一大把垃圾. 也许这对于 CLI 来说可能无关痛痒, 但如果要写个现代的 Avalonia GUI, 在用户快速打字搜索的防抖路径上产生如此高频的 Gen 0 冲刷配合 Pinned 碎片, 无异于在渲染流水线旁埋了一颗破坏渲染流畅性的隐性炸弹.

熟悉现代 .NET 的读者可能会说: "这也太朴素了吧, 直接用 `NativeMemory.Alloc()` 配合 `Encoding.UTF8.GetBytes(ReadOnlySpan<char>, Span<byte>)` 的重载, 把缓冲区全丢进非托管堆, 这样既不用 Pin 也不造成托管内存压力, 不就好了?"

表面上, 这么干确实是达到了目的, 但是实际上为了在调用结束后一起释放所有的非托管字符串缓冲区, 你还是得要留着一个 `List<nint>` 来记录所有已分配的指针, 并不能完全消除托管堆的依赖 (当然, 这点依赖确实可以称得上微乎其微), 也不能消除代码层面上生命周期管理的复杂性, 甚至比朴素做法还多了一个遍历指针列表挨个释放的工作, 对于维护长期可用的代码来说相当不利.

## 主角登场: Arena 分配器

上述做法总觉得别扭的主要麻烦, 其实来源于生命周期的错配. 作为调用方, 传入的这一列表里的所有节点和对应的字符串缓冲区实际上拥有完全一致的生命周期. 他们只需要活到 P/Invoke 调用返回后的那一瞬间, 就可以被一次性全部扔掉. 但是, 上述每一种做法都把每一个字符串缓冲区当成了独立的个体来管理, 因此才不得不最后逐个释放, 可能还要防着异常安全这种时不时会冒出来的雷 (这里大概没有, 除了你真的分配到一半碰上内存用尽了, 可是难说别的场景没有哦). 那么, 谁最擅长这种生命周期一致, 能轻松管理这些可以"一网打尽"的资源呢? 当然是 Arena 分配器啦! 对于送来的资源, 我们计算出到底要多少字节, 一次性通过非托管堆分配一大块缓冲区, 然后逐个字符串发放指针. 生命周期结束后, 只需要一行 `NativeMemory.Free()` 就能一次性释放所有的内存. 配合上之前提到的不可逃逸的 `ref struct` 和 `IDisposable` 带来的 RAII 语义, 创建一次性列表就变成了几行代码的简单工作.

不过, 虽然一次非托管堆分配已经够爽了, 但既然我们已经用上了只能活在栈帧上的 `ref struct`, 何不更进一步呢? 除了软件源配置这种少数低频场景, 大部分其他用得到字符串列表分配的函数传进来的字符串加起来通常也就一百多字节, 这种小缓冲区的条件下, 调用方的栈帧就是完全 0 成本的内存宝库. 反正分配器自己就活在栈帧上, 那么, 内联数组, 启动! 对于这类场景, 我们再加入一个 Small Buffer Optimization (SBO), 在分配器定义里直接塞上一个用于栈分配字符串的定长缓冲区 (`[InlineArray(const Capacity)]`). 编码字符串时, 如果总量放得下, 就直接让 `Encoding.UTF8.GetBytes()` 往栈内存里写, 连一次分配都不需要.

来都来了, 能不能再多操作一点? 当然可以! 除了我们要分配的所有字符串外, 每一个字符串所属的 `alpm_list_t` 结构体其实也完全有着和字符串一样的生命周期, 那我们为什么还要一次次调 P/Invoke 边界外的 libalpm 函数来一个个构造链表节点呢? 由于链表节点的大小是完全确定的, 结构体定义也是完全公开给 libalpm 的调用方的, 且所有接受传入链表的 libalpm 函数都约定释放工作是在调用方, 那我们干脆就不依靠 libalpm 了! 直接一次性计算所有的链表节点要占用的内存空间并分配连续的内存, 然后手动填充每一个链表的属性, 同时也允许和字符串缓冲区一样的 SBO 优化 (这甚至比字符串缓冲区的 SBO 更好, 因为字符串可能很长, 但数量就那么几个, 链表节点能完全放在栈内存里的概率要大得多). 这样, 我们甚至都不需要手动调用 `alpm_list_free()`, arena 分配器的 `Dispose()` 方法直接全部包圆! 这么一通操作下来, 消费方的代码被直接压缩到 2 行:

1. 创建 arena 分配器实例: `using var allocator = new TransientAlpmStringListAllocator();`
2. 分配列表: `var nativeStringList = allocator.ConstructNative(IReadOnlyCollection<string> stringList);`

搞定, 所有分配 (如果分配了) 的缓冲区都会在作用域结束时被 `using` 关键字自动调用 `Dispose()` 释放, 相比于朴素实现不知道简单到哪里去了.

那么, 有些好奇的读者要问了: "消费方的代码确实简单了好多呢, 可是, 分配器自己不会很难写吧? 那样不就完全没意义了吗?"

嘿嘿, 非也非也, 虽然逻辑看似有些复杂, 但是实际上实现起来也就一百行左右, 其中还有不少是为了可读性插入的空行. 而且, 大部分逻辑其实比读者们可能想象的要直观许多. Talk is cheap, here is the code:

```csharp
/// <summary>
/// Allocates a transient alpm_list_t with strings encoded as UTF-8 from managed strings for P/Invoke use.
/// </summary>
/// <remarks>
/// This is a mutable ref struct. If passed to a helper method, it MUST be passed by <see langword="ref"/>,
/// otherwise any heap chunks allocated inside the helper will be leaked, and the inline buffer will be on the wrong stack,
/// i.e. becomes dangling pointers once helper methods return.
/// </remarks>
internal ref struct TransientAlpmStringListAllocator() : IDisposable
{
  // 1. 内联 SBO 缓冲区
  private const int ListBufferCapacity = 4;
  private const int StringBufferCapacity = 512;

  [InlineArray(ListBufferCapacity)]
  private struct ListBuffer
  {
    private _alpm_list_t _elem0;
  }

  [InlineArray(StringBufferCapacity)]
  private struct StringBuffer
  {
    private byte _elem0;
  }

  private ListBuffer _listBuffer;
  private int _listBufferOffset = 0;

  private StringBuffer _stringBuffer;
  private int _stringBufferOffset = 0;

  // 2. 保存已分配的非托管堆缓冲区
  private unsafe _alpm_list_t* _heapLists = null;
  private unsafe byte* _heapStrings = null;

  internal unsafe _alpm_list_t* ConstructNative(IReadOnlyCollection<string> strings)
  {
    var listCount = strings.Count;

    if (listCount == 0) return null;

    _alpm_list_t* lists;

    // 3. 链表节点能全塞进 SBO 里吗?
    if (listCount <= ListBufferCapacity - _listBufferOffset)
    {
      // 3.1. 转换成指针, 并放进后面直接返回的指针变量里
      // 这是为了在填充环节不必关心我们到底是在填充哪一块内存,
      // 后续的代码面对的是统一的 `_alpm_list_t*` 指针.
      // 这也是安全的: 因为栈内存绝对不可能移动, 它也就不可能变成野指针.
      lists = (_alpm_list_t*)Unsafe.AsPointer(ref _listBuffer[_listBufferOffset]);

      // 3.2. 记录偏移量, 如果多次调用分配器, 下一次调用如果放得下, 依然可以放进 SBO 里
      _listBufferOffset += listCount;
    }
    else
    {
      // 4. 不行?
      // 4.1 分配内存并赋值给后面返回的指针变量
      // 你可能会问, 为什么不贪心地先往栈内存里放呢?
      // 首先, 这么干代码会复杂不少
      // 其次, 这样的缓存局部性没有现在的做法好
      // 当然, 这是个副作用, 我们现在其实性能需求没那么高
      _heapLists = (_alpm_list_t*)NativeMemory.Alloc((nuint)sizeof(_alpm_list_t) * (nuint)listCount);
      lists = _heapLists;
    }

    var byteCount = 0;

    // 5. 计数: 看看转换成 UTF-8 要多少字节, 别忘了 C 字符串末尾的 NUL!
    // 注: 前面说的无托管堆分配其实不太够准确: 此处以及后续的枚举循环在冷路径/多态调用下的确会对枚举器装箱
    // 但 .NET 10 的 Dynamic PGO 可以在热路径上通过逃逸分析跳过装箱
    foreach (var str in strings)
    {
      byteCount += Encoding.UTF8.GetByteCount(str) + 1;
    }

    scoped Span<byte> buffer;

    // 6. 和链表节点类似, 字符串们能全塞进 SBO 里吗?
    if (byteCount <= StringBufferCapacity - _stringBufferOffset)
    {
      // 6.1. 能!
      buffer = _stringBuffer[_stringBufferOffset..(_stringBufferOffset + byteCount)];
      _stringBufferOffset += byteCount;
    }
    else
    {
      // 6.2. 不能...分配堆内存吧...
      _heapStrings = (byte*)NativeMemory.Alloc((nuint)sizeof(byte) * (nuint)byteCount);
      buffer = new Span<byte>(_heapStrings, byteCount);
    }

    var idx = 0;

    // 7. 开始构建链表!
    foreach (var str in strings)
    {
      // 7.1. 把 UTF-8 编码后的字符串写进 arena 缓冲区里
      var bytesWritten = Encoding.UTF8.GetBytes(str, buffer);

      // 7.2. 一样的, 别忘了 C-style string 末尾的 NUL!
      buffer[bytesWritten] = 0;

      // 7.3. 把字符串指针和前后节点各自填入当前的节点
      // libalpm 的双链表要求表头节点的 prev 指针指向表尾, 因此需要特判
      lists[idx].data = Unsafe.AsPointer(ref MemoryMarshal.GetReference(buffer));
      lists[idx].prev = idx != 0 ? &lists[idx - 1] : &lists[listCount - 1];
      lists[idx].next = idx != listCount - 1 ? &lists[idx + 1] : null;

      // 7.4. 切片字符串 buffer 并自增计数器, 这样下一次就不会踩到上一次用完的内存了
      buffer = buffer[(bytesWritten + 1)..];
      ++idx;
    }

    // 8. 完工! 返回构造好的链表
    return lists;
  }

  public unsafe void Dispose()
  {
    // 9. Dispose 时, 一次性释放整块 buffer, 一点循环都不需要!
    // 内联的 SBO 完全不用管, 栈帧离开它就会和 allocator 一起销毁 ;)
    if (_heapLists != null)
      NativeMemory.Free(_heapLists);

    if (_heapStrings != null)
      NativeMemory.Free(_heapStrings);

    _heapLists = null;
    _heapStrings = null;
  }
}
```

读完这段代码, 看上去我们已经万事大吉了?

- 消费端干净利落
- 只用一百行左右的代码就能写出可复用, 零托管分配, 带栈优先 SBO 和 Dispose() 一次性释放的 arena 分配器
- 也许你还写了点简单的单元测试, 跑下来也是全绿

但是, **细心的读者可能会注意到...**

## 侵入式链表呢?! 你这 `alpm_list_t` 不就是一般路过的双链表嘛

> 你的观察完全正确! 我确实没有使用侵入式链表. 需要我给你一份侵入式链表在 C# 中的实现吗?

开玩笑的, 前面的代码的确没有使用侵入式链表. 但是, 既然你那么细心, 读了全部的标题, 还发现了这一点, 那么...也许你可以再细心一点?

<!-- markdownlint-disable-next-line MD026 -->
### 揭晓谜底...

前文所述的 arena 分配器, 虽然在简单的单元测试里可能人畜无害, 但它其实是颗巨大的不定时炸弹: `_listBufferOffset += listCount` 处的切片暗示了这个分配器在同一个作用域内是可以多次调用的, 可是由于在分配堆内存的时候直接覆写了指针, 但凡你多调用几次的时候触发不止一次的堆分配路径, 上一次分配的整块堆内存就会当场消失, 所有处于那片区域中的内存将立刻永久性地泄漏.

怎么办? 第一直觉当然是往里面塞一个 `List<nint>` 追踪每次的堆分配. 可是, 我们之前苦苦折腾那么久, 就是为了实现零托管堆分配, 这托管列表一加, 不就前功尽弃了吗?

有读者又要问了: "那么我们维护一个非托管的动态数组呢?"

说的轻巧, 但是要管理一个动态数组, 我们就得有一个分配器. 为了管理一个分配器发放的非托管内存, 我们居然需要引入另一个分配器, 这简直就是左脚踩右脚! 我们现在姑且是在托管环境里, .NET 给了我们一个完全可用的 Alloc, 但即便如此, 要在一次次手动 Realloc 的同时还要防止分配失败的时候不要覆写原内存, 折腾下来也完全可称得上是叠床架屋. 加之, 要是哪天真的要在没有分配器的环境下工作, 这不就成了鸡和蛋的问题?

既然把元数据追踪工作放在外部行不通, 那么我们不妨换个思路, 对我们自己本来就要管理的内存下手. 我们每次批发堆内存的时候, 在内存的头部额外要一个指针的空间. 把这部分空间用来存储上一段分配的溢出块地址, 让它们自己一个个串成一个逆向单链表. 不需要额外的托管数组和分配器, 每块内存自己就是元数据的容器, `Dispose()` 时顺着指针一个个往回跳, 就能轻松地释放全部溢出块.

这么改, 总计只要增加十行左右的代码, 就能在几乎不引入什么复杂度的情况下写出一个完全支持 SBO 和多次溢出分配的 arena 分配器, 以下是实现:

```csharp
/// <summary>
/// Allocates a transient alpm_list_t with strings encoded as UTF-8 from managed strings for P/Invoke use.
/// </summary>
/// <remarks>
/// This is a mutable ref struct. If passed to a helper method, it MUST be passed by <see langword="ref"/>,
/// otherwise any heap chunks allocated inside the helper will be leaked, and the inline buffer will be on the wrong stack,
/// i.e. becomes dangling pointers once helper methods return.
/// </remarks>
internal ref struct TransientAlpmStringListAllocator() : IDisposable
{
  private const int ListBufferCapacity = 4;
  private const int StringBufferCapacity = 512;

  [InlineArray(ListBufferCapacity)]
  private struct ListBuffer
  {
    private _alpm_list_t _elem0;
  }

  [InlineArray(StringBufferCapacity)]
  private struct StringBuffer
  {
    private byte _elem0;
  }

  private ListBuffer _listBuffer;
  private int _listBufferOffset = 0;

  private StringBuffer _stringBuffer;
  private int _stringBufferOffset = 0;

  // 1. 用于增强可读性的辅助类型, 作为侵入式链表的表头
  private unsafe struct HeapChunk
  {
    public HeapChunk* Prev;
  }

  // 2. 分配的指针类型改为指向表头的指针
  private unsafe HeapChunk* _heapLists = null;
  private unsafe HeapChunk* _heapStrings = null;

  internal unsafe _alpm_list_t* ConstructNative(IReadOnlyCollection<string> strings)
  {
    var listCount = strings.Count;

    if (listCount == 0) return null;

    _alpm_list_t* lists;

    if (listCount <= ListBufferCapacity - _listBufferOffset)
    {
      lists = (_alpm_list_t*)Unsafe.AsPointer(ref _listBuffer[_listBufferOffset]);
      _listBufferOffset += listCount;
    }
    else
    {
      // 3. 先保存上一块内存的地址
      var prev = _heapLists;

      // 3.1. 多分配一个表头的空间...
      var headerSize = (nuint)sizeof(HeapChunk);
      var payloadSize = (nuint)(sizeof(_alpm_list_t) * listCount);
      _heapLists = (HeapChunk*)NativeMemory.Alloc(headerSize + payloadSize);

      // 3.2. 把上一块的地址塞进去...
      _heapLists->Prev = prev;

      // 3.3. 然后把表头拆掉, 拿到溢出块内容真正的开始!
      // _heapLists[1] 会越过一个指针的长度 (刚好是表头的长度),
      // 然后取地址, 再强转成目标指针类型, 完工.
      lists = (_alpm_list_t*)&_heapLists[1];
    }

    var byteCount = 0;

    foreach (var str in strings)
    {
      byteCount += Encoding.UTF8.GetByteCount(str) + 1;
    }

    scoped Span<byte> buffer;

    if (byteCount <= StringBufferCapacity - _stringBufferOffset)
    {
      buffer = _stringBuffer[_stringBufferOffset..(_stringBufferOffset + byteCount)];
      _stringBufferOffset += byteCount;
    }
    else
    {
      // 4. 一样的工作...
      var prev = _heapStrings;

      var headerSize = (nuint)sizeof(HeapChunk);
      var payloadSize = (nuint)(sizeof(byte) * byteCount);

      _heapStrings = (HeapChunk*)NativeMemory.Alloc(headerSize + payloadSize);
      _heapStrings->Prev = prev;

      // 4.1. 不同的是, 这次把剥去表头的指针传给 Span 的构造函数
      buffer = new Span<byte>((byte*)&_heapStrings[1], byteCount);
    }

    var idx = 0;

    foreach (var str in strings)
    {
      var bytesWritten = Encoding.UTF8.GetBytes(str, buffer);
      buffer[bytesWritten] = 0;

      lists[idx].data = Unsafe.AsPointer(ref MemoryMarshal.GetReference(buffer));
      lists[idx].prev = idx != 0 ? &lists[idx - 1] : &lists[listCount - 1];
      lists[idx].next = idx != listCount - 1 ? &lists[idx + 1] : null;

      buffer = buffer[(bytesWritten + 1)..];
      ++idx;
    }

    return lists;
  }

  public unsafe void Dispose()
  {
    // 5. 取出表头, 准备连续释放
    var currentList = _heapLists;
    // 5.1. 一直释放到表头为空
    while (currentList != null)
    {
      // 5.2. 先取出上一块的地址, 要不然就被释放了
      var prev = currentList->Prev;

      // 5.3. 把这一块内存连同表头一起释放
      NativeMemory.Free(currentList);

      // 5.4. 将当前指针移向上一块分配的地址, 也是下一块要释放的地址
      currentList = prev;
    }

    _heapLists = null;

    // 6. 对字符串缓冲区也如此做...
    var currentBuffer = _heapStrings;
    while (currentBuffer != null)
    {
      var prev = currentBuffer->Prev;
      NativeMemory.Free(currentBuffer);
      currentBuffer = prev;
    }

    _heapStrings = null;
  }
}
```

### 小插曲: 内存对齐

熟悉侵入式链表和计算机架构底层的读者可能在看到 `&_heapLists[1]` 会有个非常合理的疑问: 在内存块头部塞的指针有没有可能造成非对齐访问?

好问题, 让我们来看看这个侵入式链表的内存布局:

```csharp
NativeMemory.Alloc(sizeof(HeapChunk) + payloadSize)
┌────────────────────┬─────────────────────────────────────────┐
│ HeapChunk { Prev } │ _alpm_list_t[0] │ _alpm_list_t[1] │ ... │
└────────────────────┴─────────────────────────────────────────┘
▲                    ▲
_heapLists           &_heapLists[1] (实际返回给调用方的 lists)
```

`NativeMemory.Alloc()` 在 BCL 中是 libc `malloc()` 的一个简单转发, 因此它会保证返回的地址满足平台基础类型的最大对齐要求 (64 位 Linux 上通常是 16 字节). 而我们的 `HeapChunk` 只有一个指针字段, 大小正好是一个指针宽度, 8 字节. 因此, 剥去表头后的 `&_heapLists[1]` 虽然丢掉了 16 字节对齐 (比如从 `0x1000` 挪到了 `0x1008`), 但依然严格满足 8 字节对齐.

再看我们要存放的数据: `_alpm_list_t` 的三个成员清一色都是指针, 整个结构体的对齐要求恰好就是一个指针宽度; 至于 UTF-8 字符串的 `byte` 数组, 对齐要求更是只有 1 字节. 因此, `&_heap[1]` 刚好是完全安全且严格对齐的.

不过这个疑问当然是非常合理的. 如果这个技巧要推广到通用的分配器, 那对于一些需要 16 字节对齐的类型, 就得要往表头里加 padding. 对于更高对齐要求的类型, 还得换成 `NativeMemory.AlignedAlloc()`, 不过这都是额外的内容了.

解除了非对齐访问的危机, 看着 heaptrack 里稳定在 0 的 leaked 计数, 成功地在 C# 里把指针魔法, 侵入式链表和 SBO 优雅地捏在一起的确很爽. 可是, 冲劲过后, 作为一位有合格品味的人类工程师, 我们必须重新审视冰冷的现实, 冷静地问出这个问题:

## But at what cost?

侵入式链表确实是设计上优雅的解决方案, 但是大部分 C# 开发者其实并不熟悉这种指针魔法. 正确地理解 `&_heap[1]` 是如何剥去表头的原理需要对内存布局的理解, 即使是高性能游戏领域的开发者也通常止步于零分配技巧和缓存局部性的一般理解, 而甚少直接动手操作指针.

另一方面, 在当前 libalpm 的代码逻辑里, 其实并没有要一次性传两个字符串列表的场景. 为了支持一个不存在的场景, 我们居然要往里面塞进这种高阶魔法. 这难道不是过度设计吗?

### 接口的契约

细心的读者可能已经注意到了, 上文中的代码实现里分配器的可见性修饰符是 `internal`. 既然都是内部代码而不是公开接口, 为何我们还要大费周章保证它的正确性呢?

答案并不复杂: 需要构造字符串列表的函数散落在 libalpm 的各个部分, 从代码复用的角度上来说, 抽离成通用的分配器组件是很自然的.

逻辑一旦被抽离成独立的组件, 它就和当前的特定场景完成了切割, 哪怕它是一段内部代码. 如果这一段分配逻辑只是老老实实待在某一个类里, 作为一个简单的 private static 帮手方法, 那我们或许可以写得粗糙些, 甚至可以说是一种减少复杂度的理性选择. 可一旦我们将它套上了 `ref struct` 和 `IDisposable` 的独立外壳, 它就不再是一段简单的胶水代码, 而是一个一定意义上的"通用分配器". 通用分配器可以能力有限, 但不可以逻辑不自洽. 在同一个作用域内, 因为语义上合法的第二次调用而直接造成前一次分配的泄露是显然的自相矛盾.

也许你会觉得, 既然是内部代码, 那我多加一行注释不就行了吗? 也许这样的策略有时有用, 但如果接口叫作 `Allocator`, 提供的方法看上去也是和一般的半特化构造器类似的签名, 仅仅是一行文档注释并不能简单地阻止其他 contributor, 甚至是两周后的你自己在某个其他方法里随手多调用一次. 对于一些场景, 仅仅依赖开发者的纪律性是脆弱的. 更何况, 现在几乎所有人都在使用 Coding Agent, 在模型们的有效上下文窗口还不够用的现在, 如果你往代码里埋一颗雷, 那 agent 踩中它不是会不会的问题, 而是何时的问题.

当然, 细心的读者肯定读到了文档注释里的 remarks 项了 -- 别急着大喊"你这不是自相矛盾嘛!", 这条注释确实是被语言特性捆住手脚后的无奈之举. 为了保证分配器绝不逃逸上堆, 我们只有 `ref struct` 可选, 而 C# 在语言层面上默认所有结构体都是 trivially copyable 的, 既没有 C++ 的 `= delete` 禁拷贝构造, 也没有 Rust 的 `Pin<T>`, `noncopyable` 结构体也至今还在远期讨论里画大饼. 况且, 在主路径里顺手调两次分配器是太自然不过的操作, 而这个结构体复制的坑只有在把分配器往子函数里传时才可能踩到. 再说, "可变 `ref struct` 不能按值传参" 这类规则对于写过 C++ 等中低级语言的人来说几乎是刻入骨髓的, 只是一般 C# 程序员不怎么用得到 `ref struct`, 编译器也还没学会帮你兜底, 哪怕是 BCL 自家的 `ValueStringBuilder` 也得老老实实靠注释和人工审核. 在 C# 现有的规则里, 这大概已经是能做到的最体面的防呆了.

<!-- markdownlint-disable-next-line MD026 -->
### 但你的逻辑还是有些漏洞!

不过, 擅长工程设计的读者又要问了: "既然的确代码中没有支持多次构造列表的需求, 我们难道不可以写出形如以下的代码, 使得我们确保只能调用一次堆分配吗?"

```csharp
internal ref struct TransientAlpmStringList : IDisposable
{
  private unsafe _alpm_list_t* _lists;
  private unsafe byte* _strings;

  private bool _listsOnStack;
  private bool _stringsOnStack;

  internal readonly unsafe _alpm_list_t* BackingStruct => _lists;

  internal static unsafe TransientAlpmStringList Create(IReadOnlyCollection<string> strings, Span<_alpm_list_t> listBuffer, Span<byte> stringBuffer)
  {
    _alpm_list_t* lists;
    Span<byte> buffer;

    bool listsOnStack;
    bool stringsOnStack;

    // 处理 SBO 与堆分配...
    // 不过这里会有一些坑, 假使中途抛异常, 需要用 catch 解除已经分配的指针
    // 考虑到这个实现不是重点, 我们将正确的实现留作习题 ;)
    // 以及, 这里不用内联 SBO 是因为会有自引用的毛病, 我们就不做过多篇幅的解释了

    // 然后返回一个一次性的 ref struct 暴露指针和 RAII 语义
    return new TransientAlpmStringList
    {
      _lists = lists,
      _strings = (byte*)Unsafe.AsPointer(ref MemoryMarshal.GetReference(buffer)),
      _listsOnStack = listsOnStack,
      _stringsOnStack = stringsOnStack
    };
  }

  public unsafe void Dispose()
  {
    // 指针如果不是栈内存, 就回收, 否则不动
    if (!_listsOnStack)
      NativeMemory.Free(_lists);
    _lists = null;

    if (!_stringsOnStack)
      NativeMemory.Free(_strings);
    _strings = null;
  }
}
```

没错, 的确如此. 兜兜转转到最后, 我们似乎还是发现, 从我们实际的逻辑需求来看, 最初的设计似乎有点用力过猛了. 但是, 用力过猛就一定不好吗?

这要看是什么场景了. 多数情况下, 用力过猛的确是坏的, 因为大部分过度设计的代码都具有超越必要性的全局复杂度, 像是引入全局状态造成耦合, 跨线程污染造成调试困难, 侵入公开 API 导致重构束手束脚, 等等等等. 这些坏的设计引入的维护债务是所有开发者的噩梦.

但是, 我们的设计并没有这样的坏特征:

- 没有任何全局状态
- 编译期保证 `ref struct` 不可逃逸出栈帧 (即不可跨越线程边界或装箱)
- 完全是内部代码 `internal`, 对外不暴露任何裸指针
- 代码逻辑的复杂度在适当范围内, 只有一百行出头, 并且理解只需要一些额外的底层编程知识, 正确性则有仔细设计的单元测试和 heaptrack 兜底, 是标准的写完就不用再改的叶子代码.

因此, 我们的设计最大的后果可能只是实现的时候多烧了几个脑细胞, 对于代码库的长期可维护性并没有什么影响.

## 尾声

找补了这么多, 其实与其说写出这种力大砖飞型的代码是出于炫技, 不如说是一种独特的"职业病"发作:

我的学业背景更多聚焦在科学计算与基础学科的交叉领域, 也曾经在竞赛编程的丛林里折腾过好久. 在这两个世界里, 相比于业务开发的抽象分层, 更早进入我思绪的多是内存布局与确定性开销这样的性能细节. 对于习惯了在这些边边角角榨取性能的人来说, 比起一些过度设计, 看到这些散落一地的 malloc 与链表节点可能更让我们浑身刺挠. 既然这个项目也有不少练习性质, 那在研究如何把它们打包成一整块连续内存的同时顺手写个准通用的 arena 分配器就是个非常顺理成章的选择.

回到开头那个关于 C# 的讨论. 尽管微软对于纯托管系统的野心落空了, 但是 C# 源自系统级编程理念的许多遗产确确实实地滋养了今天的现代化 .NET 平台. 它像 Java 给予了你 GC 语言和自动堆分配的充分便利, 但不像 Java 那样非得给四肢健全的高级程序员也配一套拐杖轮椅才让你开工. .NET 语言能在你需要的时候允许你绕开这些"辅助工具"换取更加确定的性能, 又不必像在 C 里那样放弃现代的类型系统, 不必像在 C++ 里那样捣鼓诘屈聱牙的模板元编程, 也不用总是和 Rust 的编译器搏斗. 拥有站在这些选择中间, 灵活选择自己要面对哪个世界的能力, 或许才是 C# 最迷人的一点.
