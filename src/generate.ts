// Import statements
import fs from 'fs';
import jsYaml from 'js-yaml';

// Interface for Schema properties
interface SchemaProperty {
  type: string;
  example?: any;
}

// Interface for a Schema definition
interface Schema {
  type: string;
  properties?: { [key: string]: SchemaProperty };
}

// Function to create an object from a schema definition
function createObjectFromSchema(schema: Schema): any {
  const obj = {};
  if (schema.type === 'object' && schema.properties) {
    for (const [key, property] of Object.entries(schema.properties)) {
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
function inferTypeFromSchema(schema: Schema): any {
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (schema.properties) {
        const propertiesType: { [key: string]: any } = {};
        for (const [key, property] of Object.entries(schema.properties)) {
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
function parseSpec(yamlString: string): { schemas: { [key: string]: any }; paths: any } {
  const spec = jsYaml.load(yamlString);

  // Create objects for schemas with inferred types
  const schemas: [ {key: any} ] = [];
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    // schemas[name] = createObjectFromSchema(schema);
    schemas[name] = inferTypeFromSchema(schema);
  }

  // Create objects for paths (endpoints) and their request/response models
  const paths = {};
   for (const [path, pathObject] of Object.entries(spec.paths)) {
     paths[path] = {};
     for (const [method, methodObject] of Object.entries(pathObject)) {
       paths[path][method] = {};

       // Request body object (if defined)
       if (methodObject.requestBody) {
         const requestBodySchema = methodObject.requestBody.content['application/json'].schema;
         let requestBodyRef;
         if (requestBodySchema.type) {
           if (requestBodySchema.type == 'array') {
             requestBodyRef = requestBodySchema.items.$ref;
           }
         } else {
           requestBodyRef = requestBodySchema.$ref;
         }
         const requestBodyName = requestBodyRef.substring(requestBodyRef.lastIndexOf('/') + 1);
         paths[path][method].requestBody = schemas[requestBodyName];
       }


       // Response objects (for successful responses)
       for (const [statusCode, responseObject] of Object.entries(methodObject.responses)) {
         if (statusCode.startsWith('2')) { // Success codes (2xx)
           const responseBody = responseObject.content['application/json'];
           const responseBodySchema = responseBody.schema;
           let responseBodyRef;
           if (responseBodySchema.type) {
             if (responseBodySchema.type == 'array') {
               responseBodyRef = responseBodySchema.items.$ref;
             } else {
               responseBodyRef = responseBodySchema.type;
             }
           } else {
             responseBodyRef = responseBodySchema.$ref;
           }
           if (String(responseBodyRef).includes("#")) {
              const responseBodyName = responseBodyRef.substring(responseBodyRef.lastIndexOf('/') + 1);
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

// Example usage: Load the YAML string and parse it
const yamlFilePath = './api.yml';

// Read the content of the file
const yamlString = fs.readFileSync(yamlFilePath, 'utf8');

const { schemas, paths } = parseSpec(yamlString);

console.log("#-------------------------------------#")
console.log("#----------- Sortie Final ------------#")
console.log("Schemas: ", schemas);
console.log("Paths: ", paths);