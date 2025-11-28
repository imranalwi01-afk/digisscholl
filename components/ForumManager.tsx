
import React, { useState } from 'react';
import { AppState, ForumPost, ForumComment } from '../types';
import { MessageCircle, Trash2, Send, CheckCircle, User, Clock, Heart } from 'lucide-react';

interface ForumManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

const ForumManager: React.FC<ForumManagerProps> = ({ data, onUpdate }) => {
  const [replyContent, setReplyContent] = useState<Record<string, string>>({}); // Map postId -> content

  const handleDeletePost = (postId: string) => {
    if (confirm("Hapus postingan ini?")) {
      onUpdate({
        ...data,
        forumPosts: data.forumPosts.filter(p => p.id !== postId)
      });
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (confirm("Hapus komentar ini?")) {
      const updatedPosts = data.forumPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      });
      onUpdate({ ...data, forumPosts: updatedPosts });
    }
  };

  const handleReplySubmit = (postId: string) => {
    const content = replyContent[postId];
    if (!content?.trim()) return;

    const newComment: ForumComment = {
      id: Date.now().toString(),
      author: data.settings.teacherName || 'Ustadzah',
      role: 'TEACHER',
      content: content,
      date: new Date().toISOString()
    };

    const updatedPosts = data.forumPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    });

    onUpdate({ ...data, forumPosts: updatedPosts });
    setReplyContent(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Halaqah Online</h1>
          <p className="text-gray-500">Pantau diskusi dan jawab pertanyaan santriwati.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2">
           <MessageCircle size={20} />
           <span className="font-bold">{data.forumPosts.length} Topik Diskusi</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.forumPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Belum ada diskusi</h3>
            <p className="text-gray-500">Diskusi dari santri akan muncul di sini.</p>
          </div>
        ) : (
          data.forumPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${post.role === 'TEACHER' ? 'bg-emerald-600' : 'bg-rose-400'}`}>
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-gray-900">{post.author}</h3>
                       {post.role === 'TEACHER' && <CheckCircle size={14} className="text-emerald-500" />}
                       <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {post.role === 'TEACHER' ? 'Ustadzah' : 'Santriwati'}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Clock size={12}/>
                      {new Date(post.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
                <button 
                   onClick={() => handleDeletePost(post.id)}
                   className="text-gray-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded transition"
                   title="Hapus Postingan"
                >
                   <Trash2 size={18} />
                </button>
              </div>

              {/* Post Content */}
              <div className="p-6">
                <p className="text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                   {post.content}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-rose-500 font-medium">
                   <Heart size={16} fill="currentColor" /> {post.likes} Suka
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-gray-50/50 p-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                   <MessageCircle size={16}/> {post.comments.length} Balasan
                </h4>
                
                <div className="space-y-4 mb-6">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${comment.role === 'TEACHER' ? 'bg-emerald-600' : 'bg-gray-400'}`}>
                          {comment.author.charAt(0)}
                       </div>
                       <div className="flex-1">
                          <div className="bg-white p-3 rounded-r-xl rounded-bl-xl border border-gray-200 shadow-sm relative group-hover:border-emerald-200 transition-colors">
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                                  {comment.author}
                                  {comment.role === 'TEACHER' && <CheckCircle size={10} className="text-emerald-500"/>}
                                </span>
                                <span className="text-[10px] text-gray-400">{new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <p className="text-sm text-gray-700">{comment.content}</p>
                             
                             <button 
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                className="absolute top-2 right-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                             >
                                <Trash2 size={12} />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {post.comments.length === 0 && (
                     <p className="text-sm text-gray-400 italic pl-11">Belum ada balasan.</p>
                  )}
                </div>

                {/* Reply Box */}
                <div className="flex gap-3 pl-11">
                   <input 
                      type="text" 
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="Tulis balasan sebagai Ustadzah..."
                      value={replyContent[post.id] || ''}
                      onChange={(e) => setReplyContent({...replyContent, [post.id]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post.id)}
                   />
                   <button 
                      onClick={() => handleReplySubmit(post.id)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                   >
                      <Send size={16} /> Balas
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ForumManager;
