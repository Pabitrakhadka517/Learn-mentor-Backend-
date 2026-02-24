import multer from 'multer';

// File filter to accept PDFs and common document types
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    const allowedMimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedMimetypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('This file type is not supported in the Library yet!'));
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for study materials
    },
    fileFilter: fileFilter
});

export const uploadStudyResource = upload.single('resource');
