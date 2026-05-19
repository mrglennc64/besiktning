"use client";

import { FieldDef, SchemaField } from "./SchemaField";

interface SchemaNode {
  type?: string | string[];
  title?: string;
  properties?: Record<string, SchemaNode>;
  $ref?: string;
  $defs?: Record<string, SchemaNode>;
}

interface RootSchema extends SchemaNode {
  $defs?: Record<string, SchemaNode>;
}

interface Props {
  schema: RootSchema;
  /** dot-path into the root schema, e.g. "header" or "rooms.hall" */
  path: string;
  value: Record<string, unknown>;
  onPatch: (patch: Record<string, unknown>) => void;
}

/** Walk dot-path through schema.properties, following $ref into root.$defs. */
function resolveNode(root: RootSchema, path: string): SchemaNode | null {
  if (!path) return root;
  let node: SchemaNode | undefined = root;
  for (const segment of path.split(".")) {
    if (!node) return null;
    node = deref(root, node);
    node = node?.properties?.[segment];
  }
  return node ? deref(root, node) : null;
}

function deref(root: RootSchema, node: SchemaNode): SchemaNode {
  if (!node.$ref) return node;
  const m = node.$ref.match(/^#\/\$defs\/(.+)$/);
  if (!m) return node;
  const target = root.$defs?.[m[1]];
  return target ? { ...target, title: node.title ?? target.title } : node;
}

function isLeaf(node: SchemaNode): boolean {
  return !node.properties;
}

function buildPatch(path: string, value: unknown): Record<string, unknown> {
  const segments = path.split(".");
  const root: Record<string, unknown> = {};
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segments[segments.length - 1]] = value;
  return root;
}

function readValue(data: Record<string, unknown>, path: string): unknown {
  let cur: unknown = data;
  for (const seg of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Renders the subtree of `schema` at `path` as form fields.
 * One level of nested objects is expanded inline with a smaller heading.
 * Deeper nesting collapses to flat dotted field names (good enough for the
 * apartment template — house/smahus may need a richer renderer in M7).
 */
export function SchemaForm({ schema, path, value, onPatch }: Props) {
  const node = resolveNode(schema, path);
  if (!node || !node.properties) return null;

  return (
    <div className="space-y-6">
      {Object.entries(node.properties).map(([key, raw]) => {
        const child = deref(schema, raw);
        const childPath = path ? `${path}.${key}` : key;
        if (isLeaf(child)) {
          return (
            <SchemaField
              key={childPath}
              name={childPath}
              def={child as FieldDef}
              value={readValue(value, childPath)}
              onChange={(v) => onPatch(buildPatch(childPath, v))}
            />
          );
        }
        return (
          <fieldset key={childPath} className="rounded border border-gray-200 p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">
              {child.title ?? key}
            </legend>
            <SchemaForm
              schema={schema}
              path={childPath}
              value={value}
              onPatch={onPatch}
            />
          </fieldset>
        );
      })}
    </div>
  );
}
