// 使用 ES 模块语法（需在 package.json 中设置 "type": "module"）
import { glob } from "glob";
import fs from "fs";
import readline from "readline";

// 存储函数名及其位置信息的 Map
// 结构: { functionName -> [{ filePath, lineNumber, fullLine }, ...] }
let functionMap = new Map();

// 缓存已处理的文件以避免重复处理
const processedFiles = new Set();

async function analyzeFile(filePath) {
  // 避免重复处理同一文件
  if (processedFiles.has(filePath)) {
    return;
  }
  processedFiles.add(filePath);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });
  
  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    if (!line.startsWith(".")) {
      continue;
    }
    
    let trimmedLine = line.trim();
    const endIndex = trimmedLine.indexOf(":");
    let functionName;
    
    if (endIndex !== -1) {
      functionName = trimmedLine.substring(0, endIndex).trim();
    } else {
      // 如果没有冒号，可能整个行就是函数名（处理不同格式）
      functionName = trimmedLine.substring(1).trim(); // 去除开头的点号
    }
    
    // 如果函数名为空，则跳过
    if (!functionName) {
      continue;
    }
    
    // 创建函数信息对象
    const functionInfo = {
      filePath: filePath,
      lineNumber: lineNumber,
      fullLine: trimmedLine
    };
    
    // 获取或创建函数信息数组
    let functionInfoList = functionMap.get(functionName);
    if (!functionInfoList) {
      functionInfoList = [];
    }
    functionInfoList.push(functionInfo);
    functionMap.set(functionName, functionInfoList);
  }
}

// 获取所有 .postfixTemplates 文件
async function getAllFiles() {
  try {
    // 模式解释：
    // **/*.postfixTemplates 递归匹配所有子目录中的 .postfixTemplates 文件
    const txtFiles = await glob("**/*.postfixTemplates", { absolute: false });
    console.log("Found .postfixTemplates files:", txtFiles.length, "files");
    return txtFiles;
  } catch (err) {
    console.error("扫描文件失败:", err.message);
    process.exit(1); // 非零退出码表示失败
  }
}

// 执行函数
async function checkFiles() {
  console.time("Total execution time");
  
  const allFiles = await getAllFiles();
  console.log(`Processing ${allFiles.length} files...`);
  
  // 使用 Promise.all 并行处理文件以提高性能
  const promises = allFiles.map(filePath => analyzeFile(filePath));
  await Promise.all(promises);
  
  // 检查是否有重复的函数名
  let hasDuplicates = false;
  let duplicateCount = 0;
  
  // 优化：只遍历那些有多个实例的函数
  for (const [functionName, functionInfoList] of functionMap.entries()) {
    if (functionInfoList.length > 1) {
      duplicateCount++;
      console.log(`\n❌ 错误: 发现重复的函数名 "${functionName}" (${functionInfoList.length} 个实例):`);
      console.log("   出现位置:");
      functionInfoList.forEach((info, index) => {
        console.log(`     ${index + 1}. 文件: ${info.filePath}`);
        console.log(`        行号: ${info.lineNumber}`);
        console.log(`        内容: ${info.fullLine}`);
        console.log("");
      });
      hasDuplicates = true;
    }
  }
  
  if (hasDuplicates) {
    console.log(`\n🚨 检测到 ${duplicateCount} 个重复函数名，构建失败。`);
    console.log("💡 请重命名重复的函数以确保唯一性。");
    console.timeEnd("Total execution time");
    process.exit(1);
  } else {
    console.log("\n✅ 所有函数名都是唯一的，没有发现重复项。");
    console.log(`📊 总共检查了 ${functionMap.size} 个不同的函数名。`);
    console.timeEnd("Total execution time");
  }
}

// 添加错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

await checkFiles();
