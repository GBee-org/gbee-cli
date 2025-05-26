import fs from "fs";
import path from "path";

// Utilitaires pour capitaliser le nom du modèle
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadTemplate(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function renderTemplate(template: string, model: string): string {
  const Model = capitalize(model);
  return template
    .replace(/{{model}}/g, model)
    .replace(/{{Model}}/g, Model);
}

export function generateEndpointFromTemplate(model: string) {
  const controllerTemplate = loadTemplate(path.join("src", "templates", "controller.model"));
  const serviceTemplate = loadTemplate(path.join("src", "templates", "service.model"));

  const renderedController = renderTemplate(controllerTemplate, model);
  const renderedService = renderTemplate(serviceTemplate, model);

  const controllerFileName = `${capitalize(model)}sController.ts`;
  const serviceFileName = `${model}Service.ts`;

  fs.writeFileSync(path.join("src-test", controllerFileName), renderedController);
  fs.writeFileSync(path.join("src-test", serviceFileName), renderedService);

  console.log(`${controllerFileName} and ${serviceFileName} generated successfully.`);
}
