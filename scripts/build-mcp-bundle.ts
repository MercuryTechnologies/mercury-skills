import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../skills");
const distDir = path.resolve(__dirname, "../dist");

interface SkillFrontmatter {
  name: string;
  version: string;
  description: string;
  category: string;
  scopes: string[];
  requires: { skills: string[] };
  channels: string[];
  metadata: {
    api_resources?: string[];
    mcp_tools?: string[];
  };
}

interface SkillsBundle {
  version: string;
  generatedAt: string;
  serverInstructions: string;
  toolDescriptionExtras: Record<string, string>;
}

async function main() {
  console.log("Building MCP skills bundle...");

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const skillDirs: string[] = [];

  // Collect skill directories from shared/, api/*, and agentic/*
  for (const subdir of ["shared", "api", "agentic"]) {
    const subdirPath = path.join(skillsDir, subdir);
    if (!fs.existsSync(subdirPath)) continue;

    if (subdir === "shared") {
      // shared/ is itself a skill directory
      skillDirs.push(subdir);
    } else {
      // api/ and agentic/ contain skill subdirectories
      const children = fs
        .readdirSync(subdirPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(subdir, d.name));
      skillDirs.push(...children);
    }
  }

  let serverInstructions = "";
  const toolDescriptionExtras: Record<string, string> = {};
  let sharedCount = 0;
  let serviceCount = 0;
  let toolCount = 0;

  // First pass: read all SKILL.md files
  const skills: Array<{ data: SkillFrontmatter; content: string; dir: string }> = [];

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      console.log(`  Skipping ${dir} (no SKILL.md)`);
      continue;
    }

    const raw = fs.readFileSync(skillPath, "utf-8");
    const { data, content } = matter(raw) as { data: SkillFrontmatter; content: string };
    skills.push({ data, content, dir });
  }

  // Build serverInstructions: start with mercury-shared body
  const shared = skills.find((s) => s.data.category === "shared");
  if (shared) {
    serverInstructions = shared.content.trim();
    sharedCount++;
    console.log(`  Added shared instructions from ${shared.dir}`);
  }

  // Append critical behavioral rules from other skills that belong in server instructions
  for (const skill of skills) {
    if (skill.data.category === "shared") continue;
    if (!skill.data.channels?.includes("mcp")) continue;

    // Extract critical rules sections if present
    const criticalMatch = skill.content.match(/## Critical Rules[\s\S]*?(?=\n## |\n# |$)/);
    if (criticalMatch) {
      serverInstructions += `\n\n### ${skill.data.name} - Critical Rules\n${criticalMatch[0].replace(/## Critical Rules\n?/, "").trim()}`;
      console.log(`  Added critical rules from ${skill.dir}`);
    }
  }

  // Build toolDescriptionExtras from service skills with mcp_tools
  for (const skill of skills) {
    if (skill.data.category !== "service") continue;
    const mcpTools = skill.data.metadata?.mcp_tools;
    if (!mcpTools || mcpTools.length === 0) continue;

    serviceCount++;

    // Read enrichments file if it exists
    const enrichmentsPath = path.join(skillsDir, skill.dir, "_enrichments.md");
    let enrichmentContent = "";
    if (fs.existsSync(enrichmentsPath)) {
      enrichmentContent = fs.readFileSync(enrichmentsPath, "utf-8").trim();
      console.log(`  Read enrichments for ${skill.dir} (${mcpTools.length} tools)`);
    } else {
      console.log(`  No enrichments for ${skill.dir}, using empty string for ${mcpTools.length} tools`);
    }

    for (const tool of mcpTools) {
      toolDescriptionExtras[tool] = enrichmentContent;
      toolCount++;
    }
  }

  const bundle: SkillsBundle = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    serverInstructions,
    toolDescriptionExtras,
  };

  const outPath = path.join(distDir, "skills-bundle.json");
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), "utf-8");

  console.log(`\nMCP bundle written to ${outPath}`);
  console.log(`  Shared skills: ${sharedCount}`);
  console.log(`  Service skills: ${serviceCount}`);
  console.log(`  Tool extras: ${toolCount}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
