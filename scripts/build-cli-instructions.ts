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
  metadata: Record<string, unknown>;
}

const CATEGORY_ORDER = ["shared", "service", "workflow", "helper", "agentic"] as const;

const CATEGORY_HEADINGS: Record<string, string> = {
  shared: "Core Rules",
  service: "Service Skills",
  workflow: "Workflow Skills",
  helper: "Helper Skills",
  agentic: "Agentic Skills",
};

async function main() {
  console.log("Building CLI instructions...");

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // Read and parse all SKILL.md files, filtering to cli channel
  const skills: Array<{ data: SkillFrontmatter; content: string }> = [];

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      console.log(`  Skipping ${dir} (no SKILL.md)`);
      continue;
    }

    const raw = fs.readFileSync(skillPath, "utf-8");
    const { data, content } = matter(raw) as { data: SkillFrontmatter; content: string };

    if (!data.channels?.includes("cli")) {
      console.log(`  Skipping ${dir} (not in cli channel)`);
      continue;
    }

    skills.push({ data, content });
    console.log(`  Included ${dir} (${data.category})`);
  }

  // Group by category
  const grouped = new Map<string, Array<{ data: SkillFrontmatter; content: string }>>();
  for (const skill of skills) {
    const cat = skill.data.category;
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat)!.push(skill);
  }

  // Build markdown output
  const sections: string[] = ["# Mercury CLI Instructions"];

  for (const category of CATEGORY_ORDER) {
    const group = grouped.get(category);
    if (!group || group.length === 0) continue;

    const heading = CATEGORY_HEADINGS[category];
    sections.push(`\n## ${heading}`);

    if (category === "shared") {
      // Shared skills go directly under Core Rules
      for (const skill of group) {
        sections.push(skill.content.trim());
      }
    } else {
      // Other categories get sub-headings per skill
      for (const skill of group) {
        const displayName = skill.data.name
          .replace(/^mercury-/, "")
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        sections.push(`\n### ${displayName}\n\n${skill.content.trim()}`);
      }
    }
  }

  const output = sections.join("\n") + "\n";
  const outPath = path.join(distDir, "cli-instructions.md");
  fs.writeFileSync(outPath, output, "utf-8");

  console.log(`\nCLI instructions written to ${outPath}`);
  console.log(`  Total skills included: ${skills.length}`);
  for (const [cat, group] of grouped) {
    console.log(`  ${CATEGORY_HEADINGS[cat] || cat}: ${group.length}`);
  }
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
