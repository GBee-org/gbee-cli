#!/usr/bin/env node
import fs from "fs";
import jsYaml from "js-yaml";
function inferTypeFromSchema(schema) {
    switch (schema.type) {
        case "string":
            return typeof (schema.example || "string");
        case "integer":
            return typeof (schema.example || "number");
        case "boolean":
            return typeof (schema.example || "boolean");
        case "object":
            if ("properties" in schema && schema.properties) {
                const propertiesType = {};
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
function parseSpec(yamlString) {
    const spec = jsYaml.load(yamlString);
    // Create objects for schemas with inferred types
    const schemas = {};
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
        const schemaWithType = schema;
        schemas[name] = schemaWithType;
    }
    // Create objects for paths (endpoints) and their request/response models
    const paths = {};
    for (const [path, pathObject] of Object.entries(spec.paths)) {
        paths[path] = {};
        for (const [method, methodObject] of Object.entries(pathObject)) {
            paths[path][method] = {};
            // Request body object (if defined)
            if (methodObject.requestBody) {
                const requestBodySchema = methodObject.requestBody.content["application/json"].schema;
                let requestBodyRef;
                if (requestBodySchema.type) {
                    if (requestBodySchema.type == "array") {
                        requestBodyRef = requestBodySchema.items.$ref;
                    }
                }
                else {
                    requestBodyRef = requestBodySchema.$ref;
                }
                const requestBodyName = requestBodyRef.substring(requestBodyRef.lastIndexOf("/") + 1);
                paths[path][method].requestBody = schemas[requestBodyName];
            }
            // Response objects (for successful responses)
            for (const [statusCode, responseObjectInit] of Object.entries(methodObject.responses)) {
                const responseObject = responseObjectInit;
                if (statusCode.startsWith("2")) {
                    // Success codes (2xx)
                    const responseBody = responseObject.content["application/json"];
                    const responseBodySchema = responseBody.schema;
                    let responseBodyRef;
                    if (responseBodySchema.type) {
                        if (responseBodySchema.type == "array") {
                            responseBodyRef = responseBodySchema.items.$ref;
                        }
                        else {
                            responseBodyRef = responseBodySchema.type;
                        }
                    }
                    else {
                        responseBodyRef = responseBodySchema.$ref;
                    }
                    if (String(responseBodyRef).includes("#")) {
                        const responseBodyName = responseBodyRef.substring(responseBodyRef.lastIndexOf("/") + 1);
                        paths[path][method].response = schemas[responseBodyName];
                    }
                    else {
                        paths[path][method].response = responseBodyRef;
                    }
                }
            }
        }
    }
    return { schemas, paths };
}
const generatePrompt = async (args) => {
    try {
        // Example usage: Load the YAML string and parse it
        const yamlFilePath = args.api;
        // Read the content of the file
        const yamlString = fs.readFileSync(yamlFilePath, "utf8");
        const { schemas, paths } = parseSpec(yamlString);
        // Create all schemas to type (TypeScript)
        Object.entries(schemas).map(([name, schema]) => {
            fs.writeFileSync(`src/${name}.ts`, generateTypeScriptInterfaces(name, schema));
        });
        console.log("✅ Schemas successfully generated.");
        // console.log(paths);
        return;
    }
    catch (error) {
        console.error("Error generating the project:", error.message);
    }
};
function toTsType(schema) {
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
function generateTypeScriptInterfaces(name, schema) {
    const props = Object.entries(schema.properties)
        .map(([propName, propSchema]) => `  ${propName}: ${toTsType(propSchema)};`)
        .join("\n");
    return `export type ${name} = {\n${props}\n}\n`;
}
export default generatePrompt;
