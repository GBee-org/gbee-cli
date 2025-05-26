"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelService = void 0;
const decorators_1 = require("../decorators");
async function getAll() {
    try {
        const models = await decorators_1.TypeORM.GetAll('models');
        return models;
    }
    catch (error) {
        logging.error(error);
        new Error('Error while getting all {{models}}' +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
async function getById(id) {
    try {
        const model = await decorators_1.TypeORM.GetById('models', id);
        if (!model)
            return null;
        return model;
    }
    catch (error) {
        logging.error(error);
        new Error('Error while getting {{models}} by id' +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
async function create(models) {
    try {
        // TODO: Add your validation logic here
        const modelCreated = await decorators_1.TypeORM.Create('models', models);
        return modelCreated;
    }
    catch (error) {
        logging.error(error);
        new Error(`Error while creating {{user}} with model=${models}` +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
async function getByQuery(queryParams) {
    try {
        let models = await decorators_1.TypeORM.Query('models', queryParams);
        if (models?.length === 0 || models === null)
            return [];
        return models;
    }
    catch (error) {
        logging.error(error);
        new Error(`Error while getting {{model}} by query=${queryParams}` +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
async function update(id, updatedData) {
    try {
        const model = await decorators_1.TypeORM.Update('models', id, updatedData);
        return model;
    }
    catch (error) {
        logging.error(error);
        new Error('Error while updating {{model}}' +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
async function remove(id) {
    try {
        const isDeleted = await decorators_1.TypeORM.Delete('models', id);
        return isDeleted;
    }
    catch (error) {
        logging.error(error);
        new Error('Error while deleting {{model}}' +
            { message: error instanceof Error ? error.message : 'Unexpected error' });
    }
}
exports.modelService = {
    getAll,
    getById,
    create,
    getByQuery,
    update,
    remove
};
