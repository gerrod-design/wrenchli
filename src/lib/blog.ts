// Blog utilities — parses markdown files with YAML frontmatter from src/content/blog/

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  content: string;
  readingTime: number;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const metaBlock = match[1];
  const content = match[2].trim();
  const meta: Record<string, string> = {};

  for (const line of metaBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }

  return { meta, content };
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  // Handle YAML array format: ["tag1", "tag2"]
  const match = raw.match(/^\[(.+)\]$/);
  if (match) {
    return match[1].split(",").map((t) => t.trim().replace(/^["']|["']$/g, ""));
  }
  return raw.split(",").map((t) => t.trim());
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

// Vite glob import — loads all .md files at build time
const modules = import.meta.glob("/src/content/blog/*.md", { as: "raw", eager: true }) as Record<string, string>;

export function getAllPosts(): BlogPost[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const slug = path.split("/").pop()!.replace(/\.md$/, "");
      const { meta, content } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        date: meta.date || "",
        excerpt: meta.excerpt || "",
        author: meta.author || "Wrenchli Team",
        tags: parseTags(meta.tags),
        content,
        readingTime: estimateReadingTime(content),
      };
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
