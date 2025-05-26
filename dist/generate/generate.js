#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrompt = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const generateType_1 = require("./generateType");
const generateAPI_1 = require("./generateAPI");
// Function to parse the YAML specification and create objects
function parseSpec(yamlString) {
    const spec = js_yaml_1.default.load(yamlString);
    // Create an array of tags from the OpenAPI spec
    const tags = spec.tags ? spec.tags.map((tag) => tag.name) : [];
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
            paths[path][method].operationId =
                methodObject.operationId || `${method}${methodObject.tags[0] || ""}`;
            paths[path][method].tag = methodObject.tags[0] || "";
            // Request parameters object (if defined)
            if (methodObject.parameters) {
                const requestParameters = methodObject.parameters.filter((param) => param.in === "path" || param.in === "query") || [];
                paths[path][method].requestParameters = requestParameters.map((param) => {
                    const paramWithType = {
                        name: param.name,
                        in: param.in,
                        required: param.required,
                        schema: param.schema,
                    };
                    if (param.schema && param.schema.$ref) {
                        const refName = param.schema.$ref.substring(param.schema.$ref.lastIndexOf("/") + 1);
                        paramWithType.schemaRef = schemas[refName];
                    }
                    return paramWithType;
                });
            }
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
    return { tags, schemas, paths };
}
const generatePrompt = async (args) => {
    try {
        // Example usage: Load the YAML string and parse it
        const yamlFilePath = args.api;
        // Read the content of the file
        const yamlString = fs_extra_1.default.readFileSync(yamlFilePath, "utf8");
        const { tags, schemas, paths } = parseSpec(yamlString);
        // Create all schemas to type (TypeScript)
        Object.entries(schemas).map(([name, schema]) => {
            fs_extra_1.default.writeFileSync(`src/${name}.ts`, (0, generateType_1.generateTypeScriptInterfaces)(name, schema));
        });
        console.log("Schemas successfully generated.");
        for (const tag of tags) {
            // Create a directory for each tag
            (0, generateAPI_1.generateEndpointFromTemplate)(tag.endsWith("s") ? tag.slice(0, -1) : tag);
        }
        // generateEndpoint(paths);
        return;
    }
    catch (error) {
        console.error("Error generating the project:", error.message);
    }
};
exports.generatePrompt = generatePrompt;
