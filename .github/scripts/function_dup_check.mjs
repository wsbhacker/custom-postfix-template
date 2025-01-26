// 使用 ES 模块语法（需在 package.json 中设置 "type": "module"）
import { glob } from "glob";
import fs from "fs";
import readline from "readline";

let functionMap = new Map();

async function analyzeFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  let lineCount = 0;
  for await (const line of rl) {
    if (!line.startsWith(".")) {
      continue;
    }
    let functionName = line.trim();
    const endIndex = line.indexOf(":");
    if (endIndex != -1) {
      functionName = line.subString(0, endIndex).trim();
    }
  }
  let fileList = functionMap.get(functionName);
  if (!fileList) {
    fileList = Array.of(filePath);
  }
  fileList.push(filePath);
  functionMap.set(functionName, fileList);
}

// 获取当前目录下的所有 .txt 文件
async function getAllFiles() {
  try {
    // 模式解释：
    // *.txt   匹配当前目录下的 .txt 文件
    // **/*.txt 递归匹配所有子目录中的 .txt 文件（如果包含子目录）
    const txtFiles = await glob("*.postfixTemplates");
    console.log(txtFiles);
    return txtFiles;
  } catch (err) {
    console.error("扫描文件失败:", err.message);
    process.exit(1); // 非零退出码表示失败
  }
}

// 执行函数
function checkFiles() {
  const allFiles = getAllFiles();
  allFiles.forEach((fp) => analyzeFile(fp));
  console.log(functionMap);
}

checkFiles();
