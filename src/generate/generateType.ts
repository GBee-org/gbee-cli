import { Schema, SchemaProperty } from '../types';

function inferTypeFromSchema(schema: Schema) {
  switch (schema.type) {
    case "string":
      return typeof (schema.example || "string");
    case "integer":
      return typeof (schema.example || "number");
    case "boolean":
      return typeof (schema.example || "boolean");
    case "object":
      if ("properties" in schema && schema.properties) {
        const propertiesType: { [key: string]: any } = {};
        for (const [key, property] of Object.entries(schema.properties)) {
          propertiesType[key] = inferTypeFromSchema(property);
        }
        return propertiesType;
      }
    case "array":
      // Handle arrays (assuming homogeneous elements for simplicity)
      return Array.from(inferTypeFromSchema(schema.items));
    default:
      return "any";
  }
}

function toTsType(schema: SchemaProperty | Schema): string {
  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
      return "number";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      if ("items" in schema && schema.items) {
        return `${toTsType(schema.items)}[]`;
      }
      return "any[]";
    case "object":
      if ("properties" in schema && schema.properties) {
        return `{ ${Object.entries(schema.properties)
          .map(([key, val]) => `${key}: ${toTsType(val)}`)
          .join("; ")} }`;
      }
    default:
      return "any";
  }
}

export function generateTypeScriptInterfaces(name: string, schema: Schema): string {
  const props = Object.entries(schema.properties)
    .map(([propName, propSchema]) => `  ${propName}: ${toTsType(propSchema)};`)
    .join("\n");
  return `export type ${name} = {\n${props}\n}\n`;
}
