
const moduleList = [

(module, exports) => {
var sum = moduleRequest("1");
var num = sum(1, 2, 3);
console.log(num);
module.exports = num;
},
(module, exports) => {
module.exports = function() {
    for(var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++){
        params[_key] = arguments[_key];
    }
    return params.reduce(function(pre, value) {
        return pre + value;
    }, 0);
};
}
];

const usedModuleMap = {};

function moduleRequest(moduleId) {
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

moduleRequest(0)
  