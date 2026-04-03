import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        const server = app.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${env.PORT}/api/health`);
        });

        // 1. Graceful shutdown handlers (B-009)
        const shutdown = async (signal: string): Promise<void> => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            
            // Close the server first (don't accept new connections)
            server.close(async () => {
                console.log('HTTP server closed');
                
                // Close DB connection last
                await disconnectDatabase();
                
                console.log('Server process terminating');
                process.exit(0);
            });

            // If server takes too long to close, force exit after timeout
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // 2. Unhandled promise rejections (B-008)
        process.on('unhandledRejection', (reason: Error) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(reason.name, reason.message);
            // In many production envs, it's safer to restart the process
            server.close(() => {
                process.exit(1);
            });
        });

        // 3. Uncaught exceptions (B-008)
        process.on('uncaughtException', (err: Error) => {
            console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            process.exit(1);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
