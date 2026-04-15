
import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Users, Send, Flag, ThumbsUp, Sparkles } from 'lucide-react';
import { discussionCommentSchema } from '../utils/schemas';
import { z } from 'zod';
import { EmptyState } from './ui/EmptyState';
import { AppErrorBoundary } from './ui/AppErrorBoundary';
import { discussionService } from '../services/discussionService';
import { Comment } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface DiscussionSpaceProps {
   projectId: string;
   taskId: string;
   roundId?: string;
}

const DiscussionSpace: React.FC<DiscussionSpaceProps> = ({ projectId, taskId, roundId }) => {
   const [comment, setComment] = useState('');
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [comments, setComments] = useState<Comment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [submitError, setSubmitError] = useState('');

   const getRoleLabel = (rawRole?: string): string => {
      if (!rawRole) return 'Expert';
      const normalized = rawRole.toLowerCase();
      if (normalized === 'admin' || normalized === 'administrator') return 'Administrator';
      if (normalized === 'facilitador' || normalized === 'facilitator') return 'Facilitator';
      return 'Expert';
   };

   const getRoleClass = (rawRole?: string): string => {
      const role = getRoleLabel(rawRole);
      if (role === 'Administrator') return 'bg-slate-900 text-white';
      if (role === 'Facilitator') return 'bg-delphi-keppel text-white';
      return 'bg-delphi-vanilla text-delphi-orange';
   };

   const formatDateTime = (value?: string | number): string => {
      const date = new Date(value || Date.now());
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${d}/${m}/${y} ${h}:${min}:${s}`;
   };

   useEffect(() => {
      let isMounted = true;
      const fetchComments = async () => {
         try {
            setIsLoading(true);
            const data = await discussionService.getCommentsByTask(projectId, taskId);
            if (isMounted) setComments(data);
         } catch (err) {
            console.error("Failed to load comments", err);
         } finally {
            if (isMounted) setIsLoading(false);
         }
      };
      if (taskId) {
         fetchComments();
      }
      return () => { isMounted = false; };
   }, [projectId, taskId]);

   const handleSendComment = async () => {
      try {
         discussionCommentSchema.parse({ content: comment });
         setErrors({});
         
         // RF015: Support task-level discussion persistence
         const newComment = await discussionService.addCommentToTask(projectId, taskId, comment, true);
         
         setComments([...comments, newComment]);
         setComment('');
         setSubmitError('');
      } catch (error: any) {
         if (error instanceof z.ZodError) {
            const newErrors: Record<string, string> = {};
            error.issues.forEach((err: any) => {
               if (err.path[0]) {
                  newErrors[err.path[0].toString()] = err.message;
               }
            });
            setErrors(newErrors);
            setSubmitError('');
         } else {
            setSubmitError(error?.message || 'No se pudo enviar el comentario.');
         }
      }
   };

   if (isLoading) {
      return <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner /></div>;
   }

   return (
      <AppErrorBoundary>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* Discussion List */}
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="bg-delphi-keppel p-3 rounded-2xl">
                           <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Debate Técnico Anónimo</h3>
                     </div>
                     <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">EX</div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-10">
                     {comments.length === 0 ? (
                        <EmptyState
                           icon={<MessageSquare className="w-8 h-8" />}
                           title="Aún no hay debate"
                           description="Sé el primero en iniciar la discusión técnica anónima."
                        />
                     ) : (
                        <>
                           {comments.map((c) => (
                              <div key={c.id} className="flex gap-6">
                                 <div className={`shrink-0 w-14 h-14 rounded-3xl text-xl flex items-center justify-center font-black shadow-inner ${getRoleClass(c.userRole)}`}>
                                    {getRoleLabel(c.userRole).substring(0, 2).toUpperCase()}
                                 </div>
                                 <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-3">
                                          <span className="text-sm font-black text-slate-900">
                                            {c.isAnonymous ? getRoleLabel(c.userRole) : (c as any).userId?.name}
                                          </span>
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {formatDateTime(c.createdAt || c.timestamp)}
                                          </span>
                                       </div>
                                       <button className="text-slate-300 hover:text-delphi-orange transition-colors"><Flag className="w-4 h-4" /></button>
                                    </div>
                                    <div className="bg-slate-50 border-slate-100 p-6 rounded-[2rem] rounded-tl-none border relative">
                                       <p className="text-slate-600 font-medium leading-relaxed">
                                          {c.content}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </>
                     )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                           <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-1 relative">
                           <input
                              type="text"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                              placeholder="Aporta tus argumentos técnicos aquí..."
                              aria-label="Escribir comentario"
                              aria-describedby="comment-error"
                              className={`w-full bg-slate-50 border ${errors.content ? 'border-red-500' : 'border-slate-200'} rounded-[2rem] px-8 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 pr-16`}
                           />
                           <button
                              onClick={handleSendComment}
                              aria-label="Enviar comentario"
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-delphi-keppel text-white p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-delphi-keppel/20"
                           >
                              <Send className="w-5 h-5" />
                           </button>
                           {errors.content && <p id="comment-error" role="alert" className="text-red-500 text-xs mt-1 ml-4 absolute -bottom-6">{errors.content}</p>}
                           {submitError && <p role="alert" className="text-red-500 text-xs mt-2 ml-4">{submitError}</p>}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                     <div className="bg-delphi-keppel/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                        <Shield className="w-6 h-6 text-delphi-keppel" />
                     </div>
                     <h4 className="text-xl font-black">Reglas de Debate</h4>
                     <ul className="space-y-4">
                        {[
                           'Mantén el anonimato total',
                           'Enfócate en la técnica, no en personas',
                           'Usa datos y arquitectura como base',
                           'Sé constructivo con los outliers'
                        ].map((rule, i) => (
                           <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-delphi-keppel mt-2 shrink-0" />
                              {rule}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 opacity-20 rotate-12 group-hover:scale-125 transition-transform" />
               </div>

               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h4 className="font-black mb-6 flex items-center justify-between text-sm uppercase tracking-widest text-slate-400">
                     Consenso Actual
                     <span className="text-delphi-orange">MEDIO</span>
                  </h4>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Participación</span>
                        <span className="text-sm font-black text-delphi-keppel">85%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-delphi-keppel w-[85%] rounded-full shadow-[0_0_10px_rgba(43,186,165,0.5)]" />
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed pt-2">
                        * El debate asíncrono mejora la precisión de la estimación final en un 30% según estudios del método Delphi.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </AppErrorBoundary>
   );
};

export default DiscussionSpace;
