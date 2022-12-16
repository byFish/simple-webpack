const swc = require("@swc/core");
const Visitor = require("@swc/core/Visitor").default;
const path = require("path");
const fs = require("fs");

const moduleRequetFuncName = "moduleRequest";

// 模块路径与下标的映射
let moduleMap = {};
// 模块列表
let moduleList = [];
// 模块长度
let moduleIndex = 0;
// 待解析列表
let unResolveModuleList = [];

// 获取文件路径
// todo 对index文件名，js、json文件后缀做处理
let currentDir = __dirname;
function handleFilePath(targetFilePath = "") {
  return path.join(currentDir, targetFilePath);
}

// 参考 https://juejin.cn/post/7034316603890237477
class requireStripper extends Visitor {
  visitCallExpression(expression) {
    //  判断代码类型以及对应的value是否为require
    if (
      expression.callee.type === "Identifier" &&
      expression.callee.value === "require"
    ) {
      expression.callee.value = moduleRequetFuncName;
      // 将未解析的文件加入解析队列
      // 利用index标记文件并修改模块路径为下标
      const targetModule = expression.arguments[0].expression.value;
      const targetFilePath = handleFilePath(targetModule);
      if (moduleMap[targetFilePath] === undefined) {
        moduleIndex++;
        moduleMap[targetFilePath] = moduleIndex;
        unResolveModuleList.push(targetFilePath);
      }
      // 由于rust对类型有限制，这里为了方便直接转换为字符串
      expression.arguments[0].expression.value = String(
        moduleMap[targetFilePath]
      );
      return expression;
    }
    return expression;
  }
}

async function analyzeFile(filePath) {
  console.log(`打包文件${filePath}`);
  currentDir = path.parse(filePath).dir;
  const module = await swc.transformFile(filePath, {
    plugin: (m) => new requireStripper().visitProgram(m),
  });
  const moduleFunc = `
(module, exports) => {
${module.code}}`;
  moduleList[moduleMap[filePath]] = moduleFunc;

  while (unResolveModuleList.length) {
    const newPath = unResolveModuleList.pop();
    await analyzeFile(newPath);
  }
}
function formatOutput() {
  return `
const moduleList = [
${moduleList}
];

const usedModuleMap = {};

function ${moduleRequetFuncName}(moduleId) {
  if (usedModuleMap[moduleId]) {
    return usedModuleMap[moduleId].exports;
  }
  const currentModuleFunc = moduleList[moduleId];
  const currentModule = {
    exports: null,
  };
  currentModuleFunc(currentModule, currentModule.exports);
  usedModuleMap[moduleId] = currentModule;
  return usedModuleMap[moduleId].exports;
}

${moduleRequetFuncName}(0)
  `;
}

// 打印输出文件
function output(outputPath) {
  // const body = JSON.stringify(moduleList, undefined, 2);
  fs.writeFileSync(outputPath, formatOutput());
}

// 初始化
async function init(config) {
  if (!config.entry) {
    console.log("入口不存在");
    return;
  }
  if (!config.output) {
    console.log("出口不存在");
    return;
  }

  const path = handleFilePath(config.entry);
  // 入口文件作为0下标
  moduleMap[path] = 0;
  await analyzeFile(path);
  output(config.output);
}

module.exports = init;
