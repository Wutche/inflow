import fs from "fs";
import path from "path";

const filesToProcess = [
  path.join(process.cwd(), "README.md"),
  path.join(
    process.env.USERPROFILE || "C:/Users/USER",
    ".gemini/antigravity/brain/2f3f194e-3865-4b6c-a395-9d023ed0019f/project_summary.md",
  ),
];

function convertMermaidToImage(content: string): string {
  // Regex to capture mermaid blocks
  // ```mermaid
  // content
  // ```
  const mermaidRegex = /```mermaid\r?\n([\s\S]*?)```/g;

  return content.replace(mermaidRegex, (match, mermaidCode) => {
    const trimmedCode = mermaidCode.trim();
    // mermaid.ink expects base64 encoded string of the code
    const buffer = Buffer.from(trimmedCode);
    const base64 = buffer.toString("base64");
    const imageUrl = `https://mermaid.ink/img/${base64}`;

    return `![Diagram](${imageUrl})`;
  });
}

filesToProcess.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, "utf-8");
    const newContent = convertMermaidToImage(content);

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, "utf-8");
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No mermaid blocks found or changed in ${filePath}`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
