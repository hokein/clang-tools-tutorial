# FileCheck

`FileCheck`在LLVM/Clang/Clang Tools的lint测试里不可或缺的一个工具，它是LLVM仓库里的一个命令行工具，通常用于检查Clang编译器的输出结果(编译生成的警告，编译后的代码，输出的错误信息)是否符合预期的结果。

下面是一个ClangTidy的lint test例子，用FileCheck检查每个check的输出消息是否与预期的一致。第一行`// RUN:`是告诉lint，说要执行这个命令（调用`clang-tidy`，并把它的结果以管道形式传递给`FileCheck`检测）

```cpp
// RUN: clang-tidy -checks="-*,llvm-namespace-comment" %s %t.cpp -- | FileCheck %s
namespace i {
}
// CHECK: warning: namespace 'i' not terminated with a closing comment [llvm-namespace-comment]
```

`FileCheck`接受一个输入文件`actual_result`和预期的结果`expected_result`，判断两者是否一致。如果两者一致，返回0；否则返回非0；在LLVm的lint测试里，如果任何一个步骤返回非0结果，就会被认为这步骤没有执行正确，这个测试就没有通过。

通常`expected_result`文件能包含不同的`CHECK` pattern，用于给`FileCheck`检测。这些pattern是pattern的名字，后面再跟着对比的内容，类似`// CHECK: <check content>`。`FileCheck`提供有`-check-prefix=<check_name>`的选项，用于对比指定的`CHECK` pattern内容。

下面一个`expected_result`的例子：

```cpp
// CHECK: this should be warned.
// CHECK: this should be warned too.
```

FileCheck基本用法：

```cpp
// 检测clang_result和expected_result里的`CHECK::` pattern是否一致.
// 这里可以不显式指定`-check-prefix`, 默认是检测名字`CHECK`的pattern。
FileCheck -input-file=clang_result.txt -check-prefix=CHECK expected_result.txt

// 如果指定`-input-file`，FileCheck会从标准输入中读入
clang -Wunused warnings.cpp | FileCheck -check-prefix=CHECK-WARNINGS
expected_result.txt
```

`Check` pattern可以使用正则表达式来匹配内容，需要使用`{{ }}`把正则表达式包起来，像`{{regex_exp}}`。但大部分情况下，固定的字符串也足够用了。

FileCheck是基于行对比的，`// CHECK:`是对比一行内容的。当你需要检查连续多行是否一致，可以使用`// CHECK-NEXT`。如果你的Check pattern是自定义的，那使用`// <your-check-name>-NEXT:`：

```cpp
// CHECK: warning1;
// CHECK-NEXT: warning2;
// CHECK-NEXT: warning3;
```

另外，如果想仅仅匹配换行`\n`，可是使用正则表达式`{{[:space:]}}`:

```cpp
// CHECK: [start warnings
// CHECK-NEXT: {{:space:}}
// CHECK: end warnings.]
```

更详细的文档，请查看LLVM的[官方文档](http://llvm.org/docs/CommandGuide/FileCheck.html)。
