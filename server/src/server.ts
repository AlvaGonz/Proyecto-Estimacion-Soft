import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        const server = app.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${env.PORT}/api/health`);
        });

        // Graceful shutdown handlers
        const shutdown = (): void => {
            console.log('Shutting down gracefully...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
