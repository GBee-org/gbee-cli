"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import statements
var fs_1 = require("fs");
var js_yaml_1 = require("js-yaml");
// Function to create an object from a schema definition
function createObjectFromSchema(schema) {
    var obj = {};
    if (schema.type === 'object' && schema.properties) {
        for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], property = _b[1];
            // Set default values based on property types
            switch (property.type) {
                case 'string':
                    obj[key] = property.example || '';
                    break;
                case 'integer':
                    obj[key] = property.example || 0;
                    break;
                case 'boolean':
                    obj[key] = false;
                    break;
                default:
                    obj[key] = null;
            }
        }
    }
    return obj;
}
// Function to infer type from schema (recursive)
function inferTypeFromSchema(schema) {
    switch (schema.type) {
        case 'string':
            return 'string';
        case 'integer':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'object':
            if (schema.properties) {
                var propertiesType = {};
                for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], property = _b[1];
                    propertiesType[key] = inferTypeFromSchema(property);
                }
                return propertiesType;
            }
        case 'array':
        // Handle arrays (assuming homogeneous elements for simplicity)
        //      return Array<inferTypeFromSchema(schema.items || { type: 'any' })>
        default:
            return 'any';
    }
}
// Function to parse the YAML specification and create objects
function parseSpec(yamlString) {
    var spec = js_yaml_1.default.load(yamlString);
    // Create objects for schemas with inferred types
    var schemas = [];
    for (var _i = 0, _a = Object.entries(spec.components.schemas); _i < _a.length; _i++) {
        var _b = _a[_i], name_1 = _b[0], schema = _b[1];
        // schemas[name] = createObjectFromSchema(schema);
        schemas[name_1] = inferTypeFromSchema(schema);
    }
    // Create objects for paths (endpoints) and their request/response models
    var paths = {};
    for (var _c = 0, _d = Object.entries(spec.paths); _c < _d.length; _c++) {
        var _e = _d[_c], path = _e[0], pathObject = _e[1];
        paths[path] = {};
        for (var _f = 0, _g = Object.entries(pathObject); _f < _g.length; _f++) {
            var _h = _g[_f], method = _h[0], methodObject = _h[1];
            paths[path][method] = {};
            // Request body object (if defined)
            if (methodObject.requestBody) {
                var requestBodySchema = methodObject.requestBody.content['application/json'].schema;
                var requestBodyRef = void 0;
                if (requestBodySchema.type) {
                    if (requestBodySchema.type == 'array') {
                        requestBodyRef = requestBodySchema.items.$ref;
                    }
                }
                else {
                    requestBodyRef = requestBodySchema.$ref;
                }
                var requestBodyName = requestBodyRef.substring(requestBodyRef.lastIndexOf('/') + 1);
                paths[path][method].requestBody = schemas[requestBodyName];
            }
            // Response objects (for successful responses)
            for (var _j = 0, _k = Object.entries(methodObject.responses); _j < _k.length; _j++) {
                var _l = _k[_j], statusCode = _l[0], responseObject = _l[1];
                if (statusCode.startsWith('2')) { // Success codes (2xx)
                    var responseBody = responseObject.content['application/json'];
                    var responseBodySchema = responseBody.schema;
                    var responseBodyRef = void 0;
                    if (responseBodySchema.type) {
                        if (responseBodySchema.type == 'array') {
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
                        var responseBodyName = responseBodyRef.substring(responseBodyRef.lastIndexOf('/') + 1);
                        paths[path][method].response = schemas[responseBodyName];
                    }
                    else {
                        paths[path][method].response = responseBodyRef;
                    }
                }
            }
        }
    }
    return { schemas: schemas, paths: paths };
}
// Example usage: Load the YAML string and parse it
var yamlFilePath = './api.yml';
// Read the content of the file
var yamlString = fs_1.default.readFileSync(yamlFilePath, 'utf8');
var _a = parseSpec(yamlString), schemas = _a.schemas, paths = _a.paths;
console.log("#-------------------------------------#");
console.log("#----------- Sortie Final ------------#");
console.log("Schemas: ", schemas);
console.log("Paths: ", paths);
