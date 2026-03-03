import multer from 'multer';

// File filter to accept images, PDFs and common document types
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    const allowedMimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain'
    ];

    if (
        allowedMimetypes.includes(file.mimetype) ||
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/')
    ) {
        cb(null, true);
    } else {
        cb(new Error('This file type is not supported in the Chat at this moment!'));
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for chat attachments as per requirements
    },
    fileFilter: fileFilter
});

// Support both single and multiple file uploads for chat
export const uploadChatAttachment = upload.single('file');
export const uploadChatAttachments = upload.array('files', 5); // Limit to 5 files
