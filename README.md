# simple-webpack

一个简单的webpack，利用swc进行ast解析。实现了将多个文件打包为一个文件。仅支持commonjs。

## 项目难点

1. swc文档仅描述了简单的使用，未找到ast产物说明的文档，遍历节点并修改的方法在[issues](https://github.com/swc-project/swc/issues/501)中才看到。
2. 对于node文件系统路径不熟悉，目前使用`path.join`与`path.parse`进行文件路径合并与定位，不知道是否有更好的方法。

## 参考

[@swc/core文档](https://swc.rs/docs/usage/core)

[swc初体验](https://juejin.cn/post/7034316603890237477)
