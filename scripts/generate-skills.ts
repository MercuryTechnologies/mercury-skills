import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

interface TagDefinition {
  name: string;
  description?: string;
  'x-internal'?: boolean;
}

interface OpenAPISpec {
  paths: Record<string, Record<string, Operation>>;
  tags?: TagDefinition[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILLS_DIR = path.resolve(__dirname, '../skills');
const SPEC_PATH = path.resolve(__dirname, '../openapi/mercuryapi.yaml');

function tagToGroup(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: {
    type?: string;
    format?: string;
    description?: string;
    enum?: string[];
    default?: unknown;
    items?: { type?: string; enum?: string[] };
  };
  description?: string;
}

interface Operation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  'x-internal'?: boolean;
  parameters?: Parameter[];
  requestBody?: {
    content?: Record<string, { schema?: { $ref?: string; properties?: Record<string, unknown> } }>;
    description?: string;
  };
  responses?: Record<string, {
    content?: Record<string, { schema?: { $ref?: string } }>;
    description?: string;
  }>;
}

interface GroupedEndpoint {
  method: string;
  path: string;
  operation: Operation;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

function getParamType(param: Parameter): string {
  const s = param.schema;
  if (!s) return 'string';
  if (s.type === 'array' && s.items) {
    const inner = s.items.enum ? s.items.enum.join(' | ') : (s.items.type || 'string');
    return `array[${inner}]`;
  }
  let t = s.type || 'string';
  if (s.format) t += ` (${s.format})`;
  if (s.enum) t = s.enum.join(' | ');
  return t;
}

function getParamDescription(param: Parameter): string {
  const parts: string[] = [];
  const desc = param.description || param.schema?.description || '';
  if (desc) parts.push(desc);
  if (param.schema?.default !== undefined) parts.push(`Default: ${param.schema.default}`);
  return parts.join('. ') || '-';
}

function resolveRef(ref: string): string {
  // Extract schema name from $ref like '#/components/schemas/Foo'
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

function getResponseSchema(operation: Operation): string {
  const resp200 = operation.responses?.['200'];
  if (!resp200?.content) return 'No content';
  const contentType = Object.keys(resp200.content)[0];
  const schema = resp200.content[contentType]?.schema;
  if (!schema) return 'No schema';
  if (schema.$ref) return `\`${resolveRef(schema.$ref)}\``;
  return 'Inline schema';
}

function getRequestBodySchema(operation: Operation): string | null {
  if (!operation.requestBody?.content) return null;
  const contentType = Object.keys(operation.requestBody.content)[0];
  const schema = operation.requestBody.content[contentType]?.schema;
  if (!schema) return null;
  if (schema.$ref) return resolveRef(schema.$ref);
  return 'Inline schema';
}

function generateEndpointMarkdown(ep: GroupedEndpoint): string {
  const { method, path: apiPath, operation } = ep;
  const lines: string[] = [];

  lines.push(`## ${method.toUpperCase()} ${apiPath}`);
  lines.push('');
  lines.push(`**Operation:** \`${operation.operationId}\``);
  if (operation.summary) {
    lines.push(`**Summary:** ${operation.summary}`);
  }
  if (operation.description) {
    lines.push(`**Description:** ${operation.description}`);
  }
  lines.push('');

  // Parameters table
  const params = operation.parameters || [];
  if (params.length > 0) {
    lines.push('### Parameters');
    lines.push('');
    lines.push('| Name | In | Type | Required | Description |');
    lines.push('|------|------|------|----------|-------------|');
    for (const param of params) {
      const name = `\`${param.name}\``;
      const loc = param.in;
      const type = getParamType(param);
      const required = param.required ? 'Yes' : 'No';
      const desc = getParamDescription(param);
      lines.push(`| ${name} | ${loc} | ${type} | ${required} | ${desc} |`);
    }
  } else {
    lines.push('### Parameters');
    lines.push('');
    lines.push('No parameters required.');
  }
  lines.push('');

  // Request body
  const bodySchema = getRequestBodySchema(operation);
  if (bodySchema) {
    lines.push(`### Request Body`);
    lines.push('');
    lines.push(`Schema: \`${bodySchema}\``);
    if (operation.requestBody?.description) {
      lines.push(`${operation.requestBody.description}`);
    }
    lines.push('');
  }

  // Response
  lines.push(`### Response (200)`);
  lines.push('');
  lines.push(`Schema: ${getResponseSchema(operation)}`);
  lines.push('');

  return lines.join('\n');
}

function generateGeneratedMd(group: string, endpoints: GroupedEndpoint[]): string {
  const lines: string[] = [];
  lines.push(`<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->`);
  lines.push('');
  lines.push(`# ${group} API Reference`);
  lines.push('');

  for (let i = 0; i < endpoints.length; i++) {
    lines.push(generateEndpointMarkdown(endpoints[i]));
    if (i < endpoints.length - 1) {
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function deriveDescription(group: string, endpoints: GroupedEndpoint[]): string {
  const resource = group;
  const opSummaries = endpoints.map(e => e.operation.summary).filter(Boolean);
  if (opSummaries.length > 0) {
    return `Mercury ${resource} API operations: ${opSummaries.slice(0, 3).join(', ').toLowerCase()}${opSummaries.length > 3 ? ', and more' : ''}.`;
  }
  return `Mercury ${resource} API operations.`;
}

function generateFrontmatter(group: string, endpoints: GroupedEndpoint[]): string {
  const resource = group;
  const operationIds = endpoints.map(e => e.operation.operationId);
  const mcpTools = endpoints
    .filter(e => e.method === 'get')
    .map(e => e.operation.operationId);
  const hasWriteMethods = endpoints.some(e => e.method !== 'get');

  const scopes = [`${resource}:read`];
  if (hasWriteMethods) scopes.push(`${resource}:write`);

  const frontmatter: Record<string, unknown> = {
    name: `mercury-${group}`,
    description: deriveDescription(group, endpoints),
    metadata: {
      version: '1.0.0',
      category: 'service',
      scopes,
      requires: ['mercury-shared'],
      channels: ['mcp', 'cli'],
      api_resources: operationIds,
      mcp_tools: mcpTools,
    },
  };

  return `---\n${yaml.dump(frontmatter, { lineWidth: 120, quotingType: '"', forceQuotes: false }).trimEnd()}\n---`;
}

function generateSkillMd(group: string, endpoints: GroupedEndpoint[], generatedContent: string, enrichmentsContent: string | null): string {
  const lines: string[] = [];
  lines.push(generateFrontmatter(group, endpoints));
  lines.push('');
  lines.push(generatedContent);
  if (enrichmentsContent) {
    lines.push('');
    lines.push(enrichmentsContent);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  console.log('Loading OpenAPI spec...');
  const specRaw = fs.readFileSync(SPEC_PATH, 'utf-8');
  const spec = yaml.load(specRaw) as OpenAPISpec;

  if (!spec.paths) {
    console.error('No paths found in spec');
    process.exit(1);
  }

  // Build set of internal tags from top-level tag definitions
  const internalTags = new Set<string>();
  if (spec.tags) {
    for (const tagDef of spec.tags) {
      if (tagDef['x-internal']) {
        internalTags.add(tagDef.name);
      }
    }
  }

  // Group endpoints by their first tag
  const groups = new Map<string, GroupedEndpoint[]>();

  for (const [apiPath, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Skip x-internal operations
      if (operation['x-internal']) {
        console.log(`  Skipping internal operation: ${method.toUpperCase()} ${apiPath}`);
        continue;
      }

      const tags = operation.tags;
      if (!tags || tags.length === 0) {
        console.warn(`  [WARN] No tags for operation: ${method.toUpperCase()} ${apiPath}`);
        continue;
      }

      const tag = tags[0];

      // Skip operations whose first tag is internal
      if (internalTags.has(tag)) {
        console.log(`  Skipping internal tag "${tag}": ${method.toUpperCase()} ${apiPath}`);
        continue;
      }

      const group = tagToGroup(tag);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push({ method, path: apiPath, operation });
    }
  }

  console.log(`\nFound ${groups.size} resource groups:\n`);

  for (const [group, endpoints] of groups) {
    console.log(`  ${group}: ${endpoints.length} endpoint(s)`);
    const skillDir = path.join(SKILLS_DIR, `mercury-${group}`);

    // Ensure directory exists
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
      console.log(`    Created directory: ${skillDir}`);
    }

    // Generate _generated.md (always overwritten)
    const generatedContent = generateGeneratedMd(group, endpoints);
    const generatedPath = path.join(skillDir, '_generated.md');
    fs.writeFileSync(generatedPath, generatedContent, 'utf-8');
    console.log(`    Wrote: _generated.md`);

    // Read _enrichments.md if it exists
    const enrichmentsPath = path.join(skillDir, '_enrichments.md');
    let enrichmentsContent: string | null = null;
    if (fs.existsSync(enrichmentsPath)) {
      enrichmentsContent = fs.readFileSync(enrichmentsPath, 'utf-8').trim();
      console.log(`    Found: _enrichments.md`);
    }

    // Generate SKILL.md by merging
    const skillContent = generateSkillMd(group, endpoints, generatedContent, enrichmentsContent);
    const skillPath = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillPath, skillContent, 'utf-8');
    console.log(`    Wrote: SKILL.md`);
  }

  // Clean up stale skill directories no longer generated
  const generatedGroupDirs = new Set([...groups.keys()].map(g => `mercury-${g}`));
  const existingDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('mercury-'))
    .map(d => d.name);

  for (const dirName of existingDirs) {
    if (generatedGroupDirs.has(dirName)) continue;

    const dirPath = path.join(SKILLS_DIR, dirName);
    const hasGenerated = fs.existsSync(path.join(dirPath, '_generated.md'));
    if (!hasGenerated) continue; // not a generated skill, skip

    const hasEnrichments = fs.existsSync(path.join(dirPath, '_enrichments.md'));

    if (hasEnrichments) {
      console.warn(`  [WARN] Stale directory with _enrichments.md, skipping delete: ${dirName}`);
    } else {
      fs.rmSync(dirPath, { recursive: true });
      console.log(`  Removed stale directory: ${dirName}`);
    }
  }

  console.log('\nDone.');
}

main();
