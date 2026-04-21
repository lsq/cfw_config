写一个js应用，根据上面yaml内容，生成配置，要求：

1. method为1时， 把providers中的所有链接下载到本地（文件名以name + \_ + 远程文件名形式)，返回一个对象，记录下载文件名、和解析后文件内容（根据类型解析，如果为yaml且直接取proxies字段列表内容，如果main值为true那么全部内容，如果为base64则base64解码即为proxies字段列表内容，所有proxies列表内容中的name字段前缀添加providers.name)，main字段记录 主配置文件名,供后续合并使用，
2. 读取fileName字段所有的文件，对每个文件内容使用linkToclash函数，并生成proxies列表，列表内容中的所有name前缀添加文件名（不带扩展），供后续合并使用
3. 读取fileYaml列表，直接为proxies列表，列表内容中的所有name前缀添加文件名，供后续合并使用4.将步骤1-3中的所有proxies列表合并到步骤1中记录为main字段的proxies中，
4. 应用fix字段中的base字段内容到合并后的main 主配置中
5. 应用rules字段内容到main主配置中
6. 最后保存main配置为config.yaml

如果为方案二，即methon为2，

1. 同方案一步骤1，但是忽略main属性，有main字段的元素也只读取proiex列表
2. 根据template值(数值则为templates数组序号，字符串则为元素name的名称)，下载url指定配置到本地，并设为主main配置
3. 修改步骤2中main配置，把步骤1中的providers全部添加到main配置中，path设置为proxy_providers/{name + 远程地址文件名} , additional-suffix: "| name"
4. 把所有fileYaml/fileName添加的file类型providers, path设置为proxy_providers/{文件名} , additional-suffix: "|文件名"
5. 最后保存main配置为config.yaml

#### 方案一：修复dns

使用原来的代理，修复如下：

1. dns泄露
2. 添加本地yaml/txt代理（不通过proxy-provider）
3. 通过配置解析远程订阅或者prxoy-provider
4. 可选修复rules

#### 方案二：直接换模板

1. 使用github已有rules-set 模板
2. 根据配置替换相应proxy-provider
