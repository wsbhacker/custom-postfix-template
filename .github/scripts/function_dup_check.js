// 使用 ES 模块语法（需在 package.json 中设置 "type": "module"）
import { glob } from "glob";

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
  console.log(allFiles);
}

checkFiles();
