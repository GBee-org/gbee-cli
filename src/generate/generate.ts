#!/usr/bin/env node

import fs from 'fs-extra';
import jsYaml from "js-yaml";
import { Parameter, Schema } from '../types';
import { generateTypeScriptInterfaces } from './generateType';
import { generateEndpoint } from './generateEndpoint';
import { generateEndpointFromTemplate } from './generateAPI';

// Function to parse the YAML specification and create objects
function parseSpec(yamlString: string): {
  schemas: { [key: string]: any };
  paths: any;
  tags: string[];
} {
  const spec = jsYaml.load(yamlString);

  // Create an array of tags from the OpenAPI spec
  const tags = spec.tags ? spec.tags.map((tag: any) => tag.name) : [];

  // Create objects for schemas with inferred types
  const schemas: { [key: string]: any } = {};
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    const schemaWithType: Schema = schema as any;
    schemas[name] = schemaWithType;
  }

  // Create objects for paths (endpoints) and their request/response models
  const paths = {};
  for (const [path, pathObject] of Object.entries(spec.paths)) {
    paths[path] = {};
    for (const [method, methodObject] of Object.entries(pathObject)) {
      paths[path][method] = {};
      paths[path][method].operationId =
        methodObject.operationId || `${method}${methodObject.tags[0] || ""}`;
      paths[path][method].tag = methodObject.tags[0] || "";

      // Request parameters object (if defined)
      if (methodObject.parameters) {
        const requestParameters =
          methodObject.parameters.filter(
            (param: any) => param.in === "path" || param.in === "query"
          ) || [];

        paths[path][method].requestParameters = requestParameters.map(
          (param: any) => {
            const paramWithType: Parameter = {
              name: param.name,
              in: param.in,
              required: param.required,
              schema: param.schema,
            };
            if (param.schema && param.schema.$ref) {
              const refName = param.schema.$ref.substring(
                param.schema.$ref.lastIndexOf("/") + 1
              );
              paramWithType.schemaRef = schemas[refName];
            }
            return paramWithType;
          }
        );
      }

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

  return { tags, schemas, paths };
}

export const generatePrompt = async (args?: any) => {
  try {
    // Example usage: Load the YAML string and parse it
    const yamlFilePath = args.api;

    // Read the content of the file
    const yamlString = fs.readFileSync(yamlFilePath, "utf8");

    const { tags, schemas, paths } = parseSpec(yamlString);

    // Create all schemas to type (TypeScript)
    Object.entries(schemas).map(([name, schema]) => {
      fs.writeFileSync(
        `src/${name}.ts`,
        generateTypeScriptInterfaces(name, schema)
      );
    });

    console.log("Schemas successfully generated.");
    
    for (const tag of tags) {
      // Create a directory for each tag
      generateEndpointFromTemplate(tag.endsWith("s") ? tag.slice(0, -1) : tag);
    }
    // generateEndpoint(paths);

    return;
  } catch (error) {
    console.error("Error generating the project:", error.message);
  }
};
