#!/usr/bin/env node

import fs from "fs";
import jsYaml from "js-yaml";

interface SchemaProperty {
  type: string;
  example?: any;
}

interface Schema {
  type: string;
  example?: any;
  properties?: { [key: string]: SchemaProperty };
  items?: SchemaProperty;
}

function inferTypeFromSchema(schema: Schema) {
  switch (schema.type) {
    case "string":
      return typeof (schema.example || "string");
    case "integer":
      return typeof (schema.example || "number");
    case "boolean":
      return typeof (schema.example || "boolean");
    case "object":
      if (schema.properties) {
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

// Function to parse the YAML specification and create objects
function parseSpec(yamlString: string): {
  schemas: { [key: string]: any };
  paths: any;
} {
  const spec = jsYaml.load(yamlString);

  // Create objects for schemas with inferred types
  const schemas: { [key: string]: any } = {};
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    const schemaWithType: Schema = schema as any;
    schemas[name] = inferTypeFromSchema(schemaWithType);
  }

  // Create objects for paths (endpoints) and their request/response models
  const paths = {};
  for (const [path, pathObject] of Object.entries(spec.paths)) {
    paths[path] = {};
    for (const [method, methodObject] of Object.entries(pathObject)) {
      paths[path][method] = {};

      // Request body object (if defined)
      if (methodObject.requestBody) {
        const requestBodySchema =
          methodObject.requestBody.content["application/json"].schema;
        let requestBodyRef;
        if (requestBodySchema.type) {
          if (requestBodySchema.type == "array") {
            requestBodyRef = requestBodySchema.items.$ref;
          }
        } else {
          requestBodyRef = requestBodySchema.$ref;
        }
        const requestBodyName = requestBodyRef.substring(
          requestBodyRef.lastIndexOf("/") + 1
        );
        paths[path][method].requestBody = schemas[requestBodyName];
      }

      // Response objects (for successful responses)
      for (const [statusCode, responseObjectInit] of Object.entries(
        methodObject.responses
      )) {
        const responseObject: { content: any } = responseObjectInit as any;
        if (statusCode.startsWith("2")) {
          // Success codes (2xx)
          const responseBody = responseObject.content["application/json"];
          const responseBodySchema = responseBody.schema;
          let responseBodyRef;
          if (responseBodySchema.type) {
            if (responseBodySchema.type == "array") {
              responseBodyRef = responseBodySchema.items.$ref;
            } else {
              responseBodyRef = responseBodySchema.type;
            }
          } else {
            responseBodyRef = responseBodySchema.$ref;
          }
          if (String(responseBodyRef).includes("#")) {
            const responseBodyName = responseBodyRef.substring(
              responseBodyRef.lastIndexOf("/") + 1
            );
            paths[path][method].response = schemas[responseBodyName];
          } else {
            paths[path][method].response = responseBodyRef;
          }
        }
      }
    }
  }

  return { schemas, paths };
}

const generatePrompt = async (args?: any) => {
  try {
    // Example usage: Load the YAML string and parse it
    const yamlFilePath = args.api;

    // Read the content of the file
    const yamlString = fs.readFileSync(yamlFilePath, "utf8");

    const { schemas, paths } = parseSpec(yamlString);

    // fs.writeFileSync("./schemas.ts", JSON.stringify(schemas).normalize());

    console.log("#-------------------------------------#")
    console.log("#----------- Sortie Final ------------#")
    console.log("Schemas: ", schemas);
    console.log("Paths: ", paths);

    return;
  } catch (error) {
    console.error("Error generating the project:", error.message);
  }
};

export default generatePrompt;

// openapi-generator-cli generate \
//     -i api.yml \
//     -g typescript \
//     -o out 
