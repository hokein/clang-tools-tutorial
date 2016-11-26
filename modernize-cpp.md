# 自动现代化C++代码

虽然C++11标准出来已经有好些年了，但是由于历史的原因，现在大部分C++项目仍然是C++03的语法。那么有没方法能够**自动地**把老的C++03代码替换成C++11代码？从而让我们享受到C++11新特性，像for-range loop，auto，nullptr，override等。

答案当然有的——[clang-tidy](http://hokein.me/clang-tools-tutorial/clang-tidy.html)。clang-tidy提供一系列的`modernize-*`checks。这些checks就是用C++11改写C++03。具体有下面这些：

* modernize-avoid-bind: 使用`lambda`替换`std::binding`。
* modernize-deprecated-headers: 将C标准库的头文件include替换成C++style，`#include <assert.h>` => `#include <cassert>`。
* modernize-loop-convert: 使用`for-range loop`替换`for(...;...;...;)`, 并更新`for`语句的相关变量。
* modernize-make-shared: 找出所有显式创建`std::shared_ptr`变量的表达式，并使用`make_shared`替换。
* modernize-make-unique: 跟`make-shared`一样，使用`std::make_unique`替换所有`std::unique_ptr`显式创建表达式。
* modernize-pass-by-value: 在构造函数中使用move语义
* modernize-raw-string-literal: 用C++11的`raw string literal`(`R"..."`)替换原来的`string literal`, 这样的好处就是不用再添加转义符`\`了。
* modernize-redundant-void-arg: 去掉`void`函数参数。
* modernize-replace-auto-ptr: 用`std::unique_ptr`替换`std::shared_ptr`, `std::shared_ptr`是不推荐使用的，即使在C++98。
* modernize-shrink-to-fit: 在C++03中，如果我们想修改STL容器的`capacity`，只能通过`copy & swap`的方式，C++11提供了`shink_to_fit`的方法。
* modernize-use-auto: 在变量定义的时候，使用`auto`代替显式的类型声明，这个在定义STL容器类的`Iterator`特别方便。
* modernize-use-bool-literals: 找出所有隐式从`int`转成`bool`的`literal`, 使用`true`或者`false`代替。
* modernize-use-default: 对于没有任何自定义行为(定义为`{}`)的特殊的成员函数，构造函数，析构函数，移动/复制构造函数，用`=default`代替掉`{}`。
* modernize-use-emplace: 使用STL容器中的`emplace`代替`push_back`。
* modernize-use-equals-delete: 在C++98中，类设计为了实现禁止调用某些特殊的成员函数，通常把它们声明成`private`；在C++11中，只需要在声明中体检`=delete`，找出所有`private`的特殊成员函数，并将它们标记成`=delete`。
* modernize-use-nullptr: 用`nullptr`代替`NULL`。
* modernize-use-override: 对于子类改写父类的`virtual`方法，在方法后面添加`override`, 并删掉`virtual`前缀，即`virtual void NewOveride()` => `void NewOverride() override {}`。
* modernize-use-using: 用`using`代替`typedef`, 如`typedef int V` => `using V = int`。


## 如何应用到项目中

这里将以GitHub的[electron](https://github.com/electron/electron)开源项目为例子，如何应用clang-tidy来改写它的C++03代码：

* 你需要导出项目的[`compilation database`](http://clang.llvm.org/docs/JSONCompilationDatabase.html), 通常命名为`compile_commands.json`, 因为clang-tidy作为一个clang-based工具，需要知道如何编译每一个源文件（从`compile_commands.json`查找）. [`ninja`](https://ninja-build.org/)提供这个导出功能，只需要简单执行下面命令。对于其它不用`ninja`编译的项目，也是有工具导出的，方法请查看前一篇[介绍clang-tidy文章](http://hokein.me/clang-tools-tutorial/clang-tidy.html)。

```shell
cd path/to/electron
# Make sure you can build electron successfully.
./script/build.py -c D
# Dump compilation database.
ninja -C out/D -t compdb cc cxx > compile_commands.json
```

* 现在，我们可以尝试对项目中某个文件运行`modernize-use-nullptr` check, 我们需要添加`-fix`的命令参数，clang-tidy才会执行对原文件修改, 不然结果会定向到标准输出`stdout`。

```shell
# Diagnose any `NULL` usage.
clang-tidy -checks="-*,modernize-use-nullptr" atom/browser/api/atom_api_menu.cc
# Replace all NULL usages to C++11 nullptr.
clang-tidy -checks="-*,modernize-use-nullptr" -fix atom/browser/api/atom_api_menu.cc
```

* 我们当然不需要每次都手动执行一个源文件，`run_clang_tidy.py`脚本能够对每个`compilation database`中的每个文件都运行`clang-tidy`（使用多进程方法）。

```shell
# Run `modernize-use-auto` on all files in atom/* and apply fixes.
path/to/run_clang_tidy.py -checks="-*,modernize-use-auto" -fix atom/*
```

真实运行的结果，请查看[electron#6423](https://github.com/electron/electron/pull/6423/files)，已经被merge进upstream了。


