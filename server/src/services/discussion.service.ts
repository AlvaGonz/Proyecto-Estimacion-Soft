import { Comment } from '../models/Comment.model.js';
import { IComment } from '../types/models.types.js';
import { auditService } from './audit.service.js';

export const discussionService = {
    async addComment(roundId: string, userId: string, content: string, isAnonymous: boolean): Promise<IComment> {
        const comment = await Comment.create({
            roundId,
            userId,
            content,
            isAnonymous
        });

        await auditService.log({ userId, action: 'comment:create', resource: 'Comment', resourceId: comment.id, details: { roundId, isAnonymous } });
        return comment;
    },

    async getCommentsByRound(roundId: string): Promise<any[]> {
        const comments = await Comment.find({ roundId }).populate('userId', 'name role').sort({ createdAt: 1 });

        // Process results to hide names if anonymous
        return comments.map(c => {
            const doc = c.toObject();
            if (doc.isAnonymous) {
                // Determine display string based on role optionally, or just leave as Anónimo
                const roleString = (doc.userId as any)?.role ? ` (${(doc.userId as any).role})` : '';
                (doc.userId as any).name = `Anónimo${roleString}`;
            }
            return doc;
        });
    }
};
