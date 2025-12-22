# [xpath 匹配](https://www.qianwen.com/chat/a1d7d1d86fc04cc7aecb9401e8a672d2)
要使用 XPath 匹配如下两种结构中的文本内容：

1. `<p><code><code>text1</code></code></p>`
2. `<p><code>text2</code></p>`

目标是提取出 `text1` 和 `text2`。

---

### 分析结构

- 第一种情况：`<p>` 下有两层 `<code>`，文本在最内层。
- 第二种情况：`<p>` 下只有一层 `<code>`，文本直接在里面。

我们希望一个 XPath 表达式能同时匹配这两种结构，并提取其中的**文本内容**。

---

### 推荐 XPath 表达式

```xpath
//p[code]/descendant::text()[normalize-space()]
```

或者更明确一点（只取 code 元素下的文本）：

```xpath
//p[code]//code//text()[normalize-space()]
```

但要注意：上面这个可能会重复匹配嵌套的情况（比如 text1 会被匹配一次，没问题；但如果结构更深可能有问题）。

更安全、精准的做法是：**获取所有 `<p>` 下任意深度 `<code>` 中的非空文本节点**：

```xpath
//p[.//code]//code//text()[normalize-space()]
```

不过如果你确定只有这两种结构，也可以简化为：

```xpath
//p//code//text()[normalize-space()]
```

但这样会匹配页面中所有 `<p>` 里 `<code>` 的文本，可能范围过大。

---

### 更精确：仅限 `<p>` 直接或间接包含 `<code>`，且取最内层文本

由于你只想匹配 `<p>` 内部有 `<code>`（无论一层还是两层）的文本，可以使用：

```xpath
//p[descendant::code]/descendant::code[last()]/text()[normalize-space()]
```

解释：
- `//p[descendant::code]`：选中包含 `<code>` 后代的 `<p>`。
- `/descendant::code[last()]`：在该 `<p>` 下，取最深层（最后一个嵌套层级）的 `<code>`（对两层嵌套取内层，对单层就取它自己）。
- `/text()[normalize-space()]`：取非空白文本。

✅ 这个表达式能正确处理：
- `<p><code>text2</code></p>` → `text2`
- `<p><code><code>text1</code></code></p>` → `text1`

---

### 示例验证

HTML 片段：
```html
<p><code><code>text1</code></code></p>
<p><code>text2</code></p>
<p>普通段落</p>
<p><code> <em>带标签的</em> </code></p> <!-- 不匹配纯文本 -->
```

使用：
```xpath
//p[descendant::code]/descendant::code[last()]/text()[normalize-space()]
```

结果：
- `text1`
- `text2`

（不会匹配带 `<em>` 的那个，因为它的 `<code>` 内没有直接文本节点，只有元素节点）

---

### 如果允许 `<code>` 内有混合内容，想提取所有文本（包括跨标签）

可以用 `string()` 函数，但 XPath 1.0 中 `string()` 只返回第一个节点的字符串值。在 XPath 2+ 或某些解析器（如 lxml、Selenium）中可配合编程语言处理。

但在纯 XPath 提取文本节点时，上述方案已足够应对你的需求。

---

### 总结

✅ **推荐使用的 XPath 表达式**：

```xpath
//p[descendant::code]/descendant::code[last()]/text()[normalize-space()]
```

这个表达式能准确匹配你描述的两种结构，并提取出 `text1` 和 `text2`。
