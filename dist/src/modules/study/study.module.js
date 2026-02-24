"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyRoutesDocs = exports.StudyController = exports.createStudyModule = exports.StudyModule = void 0;
const get_public_resources_usecase_1 = require("./application/use-cases/get-public-resources.usecase");
const get_my_resources_usecase_1 = require("./application/use-cases/get-my-resources.usecase");
const upload_resource_usecase_1 = require("./application/use-cases/upload-resource.usecase");
const delete_resource_usecase_1 = require("./application/use-cases/delete-resource.usecase");
const studyresource_repository_1 = require("./infrastructure/repositories/studyresource.repository");
const cloudinary_service_1 = require("./infrastructure/cloudinary/cloudinary.service");
const study_controller_1 = require("./presentation/study.controller");
const study_routes_1 = require("./presentation/study.routes");
class StudyModule {
    constructor() {
        this.initializeDependencies();
        this.router = this.createRouter();
    }
    initializeDependencies() {
        this.repository = new studyresource_repository_1.StudyResourceRepository();
        this.cloudinaryService = new cloudinary_service_1.CloudinaryService();
        this.getPublicResourcesUseCase = new get_public_resources_usecase_1.GetPublicResourcesUseCase(this.repository);
        this.getMyResourcesUseCase = new get_my_resources_usecase_1.GetMyResourcesUseCase(this.repository);
        this.uploadResourceUseCase = new upload_resource_usecase_1.UploadResourceUseCase(this.repository, this.cloudinaryService);
        this.deleteResourceUseCase = new delete_resource_usecase_1.DeleteResourceUseCase(this.repository, this.cloudinaryService);
        this.controller = new study_controller_1.StudyController(this.getPublicResourcesUseCase, this.getMyResourcesUseCase, this.uploadResourceUseCase, this.deleteResourceUseCase);
    }
    createRouter() {
        return (0, study_routes_1.createStudyRoutes)(this.controller);
    }
    getRouter() {
        return this.router;
    }
    getRepository() {
        return this.repository;
    }
    getCloudinaryService() {
        return this.cloudinaryService;
    }
    getController() {
        return this.controller;
    }
    async healthCheck() {
        try {
            const dependencies = {
                repository: !!this.repository,
                cloudinaryService: !!this.cloudinaryService,
                useCases: !!(this.getPublicResourcesUseCase &&
                    this.getMyResourcesUseCase &&
                    this.uploadResourceUseCase &&
                    this.deleteResourceUseCase),
                controller: !!this.controller
            };
            const allHealthy = Object.values(dependencies).every(dep => dep);
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                dependencies,
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                dependencies: {
                    repository: false,
                    cloudinaryService: false,
                    useCases: false,
                    controller: false
                },
                timestamp: new Date()
            };
        }
    }
}
exports.StudyModule = StudyModule;
const createStudyModule = () => {
    return new StudyModule();
};
exports.createStudyModule = createStudyModule;
var study_controller_2 = require("./presentation/study.controller");
Object.defineProperty(exports, "StudyController", { enumerable: true, get: function () { return study_controller_2.StudyController; } });
var study_routes_2 = require("./presentation/study.routes");
Object.defineProperty(exports, "studyRoutesDocs", { enumerable: true, get: function () { return study_routes_2.studyRoutesDocs; } });
//# sourceMappingURL=study.module.js.map