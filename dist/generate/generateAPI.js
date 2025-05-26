"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEndpointFromTemplate = generateEndpointFromTemplate;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Utilitaires pour capitaliser le nom du modèle
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function loadTemplate(filePath) {
    return fs_1.default.readFileSync(filePath, "utf-8");
}
function renderTemplate(template, model) {
    const Model = capitalize(model);
    return template
        .replace(/{{model}}/g, model)
        .replace(/{{Model}}/g, Model);
}
function generateEndpointFromTemplate(model) {
    const controllerTemplate = loadTemplate(path_1.default.join("src", "templates", "controller.model"));
    const serviceTemplate = loadTemplate(path_1.default.join("src", "templates", "service.model"));
    const renderedController = renderTemplate(controllerTemplate, model);
    const renderedService = renderTemplate(serviceTemplate, model);
    const controllerFileName = `${capitalize(model)}sController.ts`;
    const serviceFileName = `${model}Service.ts`;
    fs_1.default.writeFileSync(path_1.default.join("src-test", controllerFileName), renderedController);
    fs_1.default.writeFileSync(path_1.default.join("src-test", serviceFileName), renderedService);
    console.log(`${controllerFileName} and ${serviceFileName} generated successfully.`);
}
