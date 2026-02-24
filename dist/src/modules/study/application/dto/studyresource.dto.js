"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceStatisticsDTO = exports.StudyResourceFilterDTO = exports.UpdateStudyResourceDTO = exports.CreateStudyResourceDTO = exports.StudyResourceDTO = void 0;
class StudyResourceDTO {
    constructor(id, title, category, type, url, size, tutorId, isPublic, createdAt, updatedAt, tutorName, downloadCount) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.type = type;
        this.url = url;
        this.size = size;
        this.tutorId = tutorId;
        this.isPublic = isPublic;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.tutorName = tutorName;
        this.downloadCount = downloadCount;
    }
    toPublicDTO() {
        return {
            id: this.id,
            title: this.title,
            category: this.category,
            type: this.type,
            url: this.url,
            size: this.size,
            createdAt: this.createdAt,
            tutorName: this.tutorName,
            downloadCount: this.downloadCount
        };
    }
    toTutorDTO() {
        return this;
    }
    toMinimalDTO() {
        return {
            id: this.id,
            title: this.title,
            category: this.category,
            type: this.type,
            size: this.size,
            isPublic: this.isPublic,
            createdAt: this.createdAt
        };
    }
}
exports.StudyResourceDTO = StudyResourceDTO;
class CreateStudyResourceDTO {
    constructor(title, category, isPublic, file) {
        this.title = title;
        this.category = category;
        this.isPublic = isPublic;
        this.file = file;
    }
}
exports.CreateStudyResourceDTO = CreateStudyResourceDTO;
class UpdateStudyResourceDTO {
    constructor(title, category, isPublic) {
        this.title = title;
        this.category = category;
        this.isPublic = isPublic;
    }
}
exports.UpdateStudyResourceDTO = UpdateStudyResourceDTO;
class StudyResourceFilterDTO {
    constructor(category, type, search, isPublic, tutorId, limit, offset, sortBy, sortOrder) {
        this.category = category;
        this.type = type;
        this.search = search;
        this.isPublic = isPublic;
        this.tutorId = tutorId;
        this.limit = limit;
        this.offset = offset;
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
    }
}
exports.StudyResourceFilterDTO = StudyResourceFilterDTO;
class ResourceStatisticsDTO {
    constructor(totalResources, publicResources, privateResources, resourcesByType, resourcesByCategory, totalSize, averageSize) {
        this.totalResources = totalResources;
        this.publicResources = publicResources;
        this.privateResources = privateResources;
        this.resourcesByType = resourcesByType;
        this.resourcesByCategory = resourcesByCategory;
        this.totalSize = totalSize;
        this.averageSize = averageSize;
    }
}
exports.ResourceStatisticsDTO = ResourceStatisticsDTO;
//# sourceMappingURL=studyresource.dto.js.map