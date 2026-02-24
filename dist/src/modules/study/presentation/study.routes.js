"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyRoutesDocs = exports.createStudyRoutes = exports.StudyRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../auth/auth.middleware");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} is not supported`));
        }
    }
});
class StudyRoutes {
    constructor(studyController) {
        this.studyController = studyController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', this.studyController.getPublicResources.bind(this.studyController));
        this.router.get('/my', auth_middleware_1.authenticate, this.studyController.getMyResources.bind(this.studyController));
        this.router.post('/upload', auth_middleware_1.authenticate, upload.single('file'), this.handleUploadErrors, this.studyController.uploadResource.bind(this.studyController));
        this.router.delete('/:id', auth_middleware_1.authenticate, this.studyController.deleteResource.bind(this.studyController));
        this.router.post('/batch-delete', auth_middleware_1.authenticate, this.studyController.batchDeleteResources.bind(this.studyController));
    }
    handleUploadErrors(req, res, next) {
        if (req.file && req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 10MB limit'
            });
        }
        next();
    }
    getRouter() {
        return this.router;
    }
}
exports.StudyRoutes = StudyRoutes;
const createStudyRoutes = (studyController) => {
    const studyRoutes = new StudyRoutes(studyController);
    return studyRoutes.getRouter();
};
exports.createStudyRoutes = createStudyRoutes;
exports.studyRoutesDocs = {
    '/api/study': {
        get: {
            tags: ['Study Resources'],
            summary: 'Get public study resources',
            description: 'Retrieve all public study resources with optional filtering',
            parameters: [
                {
                    name: 'category',
                    in: 'query',
                    description: 'Filter by resource category',
                    required: false,
                    schema: { type: 'string' }
                },
                {
                    name: 'type',
                    in: 'query',
                    description: 'Filter by resource type (PDF, MODULE, OTHER)',
                    required: false,
                    schema: { type: 'string', enum: ['PDF', 'MODULE', 'OTHER'] }
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Search in title and category',
                    required: false,
                    schema: { type: 'string' }
                }
            ],
            responses: {
                '200': {
                    description: 'Public resources retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            resources: { type: 'array' },
                                            count: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/study/my': {
        get: {
            tags: ['Study Resources'],
            summary: 'Get my study resources',
            description: 'Retrieve study resources owned by the authenticated tutor',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Tutor resources retrieved successfully'
                },
                '401': {
                    description: 'Authentication required'
                },
                '403': {
                    description: 'Only tutors and admins can access this resource'
                }
            }
        }
    },
    '/api/study/upload': {
        post: {
            tags: ['Study Resources'],
            summary: 'Upload study resource',
            description: 'Upload a new study resource file',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'The file to upload'
                                },
                                title: {
                                    type: 'string',
                                    description: 'Resource title (2-200 characters)'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Resource category (optional)'
                                },
                                isPublic: {
                                    type: 'boolean',
                                    description: 'Whether the resource should be public'
                                }
                            },
                            required: ['file', 'title']
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Resource uploaded successfully'
                },
                '400': {
                    description: 'Invalid request data or file'
                },
                '401': {
                    description: 'Authentication required'
                },
                '403': {
                    description: 'Only tutors and admins can upload resources'
                }
            }
        }
    },
    '/api/study/{id}': {
        delete: {
            tags: ['Study Resources'],
            summary: 'Delete study resource',
            description: 'Delete a study resource by ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Resource ID',
                    schema: { type: 'string' }
                }
            ],
            responses: {
                '200': {
                    description: 'Resource deleted successfully'
                },
                '401': {
                    description: 'Authentication required'
                },
                '403': {
                    description: 'Only resource owner can delete'
                },
                '404': {
                    description: 'Resource not found'
                }
            }
        }
    }
};
//# sourceMappingURL=study.routes.js.map