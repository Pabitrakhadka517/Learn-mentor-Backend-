declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;

    NODE_ENV?: 'development' | 'test' | 'production';
    PORT?: string;
    API_URL?: string;
    CORS_ORIGIN?: string;

    JWT_ACCESS_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    JWT_SECRET?: string;

    FRONTEND_URL?: string;

    ESEWA_SECRET?: string;
    ESEWA_PRODUCT_CODE?: string;

    MONGO_URI?: string;
    MONGODB_URI_TEST?: string;
    DATABASE_URL?: string;

    DB_HOST?: string;
    DB_PORT?: string;
    DB_NAME?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;

    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;

    MAIL_HOST?: string;
    MAIL_PORT?: string;
    MAIL_SECURE?: string;
    MAIL_USER?: string;
    MAIL_PASS?: string;
    MAIL_FROM?: string;

    ADMIN_EMAIL?: string;
    ADMIN_PASSWORD?: string;

    RATE_LIMIT_WHITELIST?: string;
    TRANSACTION_SERVICE_URL?: string;
    PLATFORM_FEE_PERCENTAGE?: string;
    LOG_LEVEL?: string;
  }
}
