import fs from "fs";
import path from "path";

const CONTROLLER_TEMPLATE = (name: string, routes: string) => `
import { Request, Response, NextFunction } from "express";
import { Controller, Route } from "../decorators";
import { ${name}Service } from "../services";

@Controller('${name}')
export class ${capitalize(name)}Controller {
${routes}
}
`;

const SERVICE_TEMPLATE = (name: string, methods: string) => `
import { TypeORM } from '../decorators';

${methods}

export const ${name}Service = {
${getServiceMethodNames(methods).join(',\n')}
};
`;

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getServiceMethodNames(code: string): string[] {
  const match = [...code.matchAll(/async (\w+)/g)];
  return match.map((m) => m[1]);
}

function generateControllerRoute(name: string, method: string, route: string, operationId: string) {
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

function generateServiceMethod(method: string, route: string) {
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

function generateFunctionName(method: string, route: string) {
  const segments = route
    .split("/")
    .filter(Boolean)
    .map((seg) => (seg.startsWith("{") ? "By" + capitalize(seg.slice(1, -1)) : seg));
  return method.toLowerCase() + capitalize(segments.join(""));
}

export function generateEndpoint(paths) {
  const controllerRoutes: string[] = [];
  const serviceMethods: string[] = [];

  for (const route in paths) {
    const pathItem = paths[route];
    for (const method in pathItem) {
      console.log(route);
      
      const routeCode = generateControllerRoute("name", method, route, "");
      const serviceCode = generateServiceMethod(method, route);
      controllerRoutes.push(routeCode);
      serviceMethods.push(serviceCode);
    }
  }
  
  const controllerCode = CONTROLLER_TEMPLATE("users", controllerRoutes.join("\n"));
  const serviceCode = SERVICE_TEMPLATE("user", serviceMethods.join("\n"));

  // fs.writeFileSync(path.join("src-test", "UsersController.ts"), controllerCode);
  // fs.writeFileSync(path.join("src-test", "userService.ts"), serviceCode);
  console.log("✅ Controller and service generated successfully.");
}
