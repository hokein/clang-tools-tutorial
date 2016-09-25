# clang-tidy——静态代码分析框架

## clang-tidy介绍

[clang-tidy](http://clang.llvm.org/extra/clang-tidy/)是一个基于clang的静态代码分析框架，支持C++/C/Objective-C。

它是一个功能更强大的lint工具。绝大部分lint工具只能在出现问题的代码地方给出提示，之后需要人为修改，而clang-tidy则能够自动修复功能（当然这个如何修复需要该check作者提供）；并且clang-tidy采用模块化设计，非常容易扩展。如果用户想往clang-tidy添加一个新的检测功能，只需要编写一个clang-tidy check实现（如何编写一个clang-tidy check以后将会有一章详细介绍），每一个check检测一种问题，例如检测某个违反Code style的模式，检测某些API不正确使用的方法等等。

clang-tidy check可以检测各式各样的问题：

* 检测违反代码规范的代码模式（header guard不满足，include头文件顺序错误)；
* 找出不容易在编译时发现的代码错误（把int赋值给std::string, 变量定义在头文件）；
* 把deprecated的API替换成新的API，modernize模块典型例子，把C++03的代码自动转换成C++11的代码（for-range-loop, auto, nullptr, overriede, default）；

Google code style提供了[cpplint](https://github.com/google/styleguide/tree/gh-pages/cpplint)脚本，用于检测代码中违反code style的地方。clang-tidy也支持检测代码中违反Google code style的地方(`google-*`check), 它们之间有什么区别？cpplint是一个python的脚本，它是采用正则表达式匹配出违反code style的代码, 所以它能检测的功能会受限于正则表达式，它不能够检测所有的违反code style的地方，并且还会有False positive和True positive；而clang-tidy则是基于抽象语法树(AST)对源文件进行分析，相比之下，是在分析的结果更加准确，能检测的问题也更多。

这两者各有优缺点，clang-tidy需要对源代码进行语法分析（编译源文件），所以它需要知道源文件的编译命令，对于依赖较多较大的文件，花费时间会较长；cpplint则不需要源文件编译，对文件内容进行正则匹配，运行会更快。

clang-tidy每次只针对一个编译单元(TranslationUnit, 可简单理解成1个`.cpp`文件)进行静态分析，因此，它只能查找出一个编译单元里面的代码问题，对于那种只在跨编译单元出现的问题，就无能为力了。

现在clang-tidy实现有100+个check，请查看list列表。根据check不同种类(从check名字的前缀就能知道哪一类)，分为如下几大类：

* boost 检测boost库API使用问题
* cert 检测[CERT](https://www.securecoding.cert.org/confluence/display/seccode/SEI+CERT+Coding+Standards)的代码规范
* cpp-core-guidelines 检测是否违反cpp-core-guidelines
* google 检测是否违反google code style
* llvm 检测是否违反llvm code style
* readability  检测代码上相关问题，但又不明确属于任何代码规范的
* misc 其它一些零碎的check
* mpi 检测MPI API问题
* modernize 把C++03代码转换成C++11代码，使用C++11新特性
* performance 检测performance相关问题

## clang-tidy使用

clang-tidy是一个命令行工具，可以在官网下载编译好的二进制包。
我写了一个[clang-tools-prebuilt](https://www.npmjs.com/package/clang-tools-prebuilt)的npm包，可以通过`npm install clang-tools-prebuilt`的命令下载（仅支持MacOS, Linux）。

```bash
// 列出所有的check
$ clang-tidy -list-checks
// 找出simple.cc中所有没有用到的using declarations. 后面的`--`表示这个文件不在compilation database里面，可以直接单独编译；
$ clang-tidy -checks="-*,misc-unused-using-decls" path/to/simple.cc --

// 找出simple.cc中所有没有用到的using declarations并自动fix(删除掉)
$ clang-tidy -checks="-*,misc-unused-using-decls" -fix path/to/simple.cc --

// 找出a.c中没有用到的using declarations. 这里需要path/to/project/compile_commands.json存在
$ clang-tidy -checks="-*,misc-unused-using-decls" path/to/project/a.cc
```

分析项目中的y编译单元，clang-tidy首先要知道如何编译单元(该编译单元的编译命令)，它从目录下查找compliation database，这个database就是`compile_commands.json`文件，里面包含该项目中所有的编译单元的编译命令。在使用之前要导出这个文件。目前已经有工具帮我们做了这项工作。

* 如果是cmake的项目，通过`cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON path/to/llvm/sources`命令导出;
* 如果是GYP项目，通过`ninja -C out/D -t compdb cc cxx objc objcxx > compile_commands.json`；
* 如果是make项目，使用[Bear](https://github.com/rizsotto/Bear)工具；

一次命令只能分析一个文件太麻烦，要分析整个项目的所有文件？[run_clang_tidy.py](https://github.com/llvm-mirror/clang-tools-extra/blob/master/clang-tidy/tool/run-clang-tidy.py)脚本正是你想要的，通过多进程的方法对整个项目文件进行分析。

