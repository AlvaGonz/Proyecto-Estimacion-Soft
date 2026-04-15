import { Comment } from '../models/Comment.model.js';
import { IComment } from '../types/models.types.js';
import { auditService } from './audit.service.js';

export const discussionService = {
    async addComment(
        userId: string, 
        content: string, 
        isAnonymous: boolean, 
        taskId?: string, 
        roundId?: string,
        userRole?: string
    ): Promise<IComment> {
        const comment = await Comment.create({
            roundId,
            taskId,
            userId,
            userRole,
            content,
            isAnonymous
        });

        await auditService.log({ 
            userId, 
            action: 'comment:create', 
            resource: 'Comment', 
            resourceId: comment.id, 
            details: { taskId, roundId, isAnonymous } 
        });
        return comment;
    },

    async getCommentsByTask(taskId: string): Promise<any[]> {
        const comments = await Comment.find({ taskId }).populate('userId', 'name role').sort({ createdAt: 1 });
        return this.processComments(comments);
    },

    async getCommentsByRound(roundId: string): Promise<any[]> {
        const comments = await Comment.find({ roundId }).populate('userId', 'name role').sort({ createdAt: 1 });
        return this.processComments(comments);
    },

    processComments(comments: any[]): any[] {
        return comments.map(c => {
            const doc = c.toObject();
            if (doc.isAnonymous) {
                // If it has historical role, use it; otherwise use current populated role
                const role = doc.userRole || (doc.userId as any)?.role || 'experto';
                const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
                (doc.userId as any).name = roleLabel;
            }
            return doc;
        });
    }
};
