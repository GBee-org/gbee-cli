"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEndpoint = generateEndpoint;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONTROLLER_TEMPLATE = (name, routes) => `
import { Request, Response, NextFunction } from "express";
import { Controller, Route } from "../decorators";
import { ${name}Service } from "../services";

@Controller('${name}')
export class ${capitalize(name)}Controller {
${routes}
}
`;
const SERVICE_TEMPLATE = (name, methods) => `
import { TypeORM } from '../decorators';

${methods}

export const ${name}Service = {
${getServiceMethodNames(methods).join(',\n')}
};
`;
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function getServiceMethodNames(code) {
    const match = [...code.matchAll(/async (\w+)/g)];
    return match.map((m) => m[1]);
}
function generateControllerRoute(name, method, route, operationId) {
    const fnName = generateFunctionName(method, route);
    return `
  @Route('${method}', '${route.replace(/{(\w+)}/g, ':$1')}')
  async ${fnName}(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ${name}Service.${fnName}(req);
      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
      return res.status(500).json({ message: errorMessage });
    }
  }
`;
}
function generateServiceMethod(method, route) {
    const fnName = generateFunctionName(method, route);
    return `
async function ${fnName}(req: Request) {
  try {
    // Implement logic here based on req.params or req.body
    return {}; // or throw new Error("Not implemented");
  } catch (error) {
    throw error;
  }
}
`;
}
function generateFunctionName(method, route) {
    const segments = route
        .split("/")
        .filter(Boolean)
        .map((seg) => (seg.startsWith("{") ? "By" + capitalize(seg.slice(1, -1)) : seg));
    return method.toLowerCase() + capitalize(segments.join(""));
}
function generateEndpoint(paths) {
    const controllerRoutes = [];
    const serviceMethods = [];
    for (const route in paths) {
        const pathItem = paths[route];
        for (const method in pathItem) {
            const operationId = pathItem[method].operationId || generateFunctionName(method, route);
            const tag = pathItem[method].tag;
            const routeCode = generateControllerRoute(tag, method, route, operationId);
            const serviceCode = generateServiceMethod(method, route);
            controllerRoutes.push(routeCode);
            serviceMethods.push(serviceCode);
        }
    }
    const controllerCode = CONTROLLER_TEMPLATE("users", controllerRoutes.join("\n"));
    const serviceCode = SERVICE_TEMPLATE("user", serviceMethods.join("\n"));
    fs_1.default.writeFileSync(path_1.default.join("src-test", "UsersController.ts"), controllerCode);
    fs_1.default.writeFileSync(path_1.default.join("src-test", "userService.ts"), serviceCode);
    console.log("Controller and service generated successfully.");
}
