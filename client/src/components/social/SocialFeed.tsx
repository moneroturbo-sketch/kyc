import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWithAuth, isAuthenticated, getUser } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  BadgeCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Author {
  id: string;
  username: string;
  isVerifiedVendor: boolean;
}

interface SocialPost {
  id: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  originalPostId: string | null;
  quoteText: string | null;
  createdAt: string;
  author: Author;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: Author;
}

function renderContentWithMentions(content: string) {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span key={index} className="text-primary font-medium">
          @{part}
        </span>
      );
    }
    return part;
  });
}

function PostCard({
  post,
  onLike,
  onUnlike,
  onDelete,
  onComment,
  onShare,
  isLiked,
}: {
  post: SocialPost;
  onLike: () => void;
  onUnlike: () => void;
  onDelete: () => void;
  onComment: () => void;
  onShare: () => void;
  isLiked: boolean;
}) {
  const user = getUser();
  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === "admin";
  const canDelete = isAuthor || isAdmin;

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 space-y-3"
      data-testid={`post-card-${post.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground font-bold">
            {post.author.username[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">
                {post.author.username}
              </span>
              {post.author.isVerifiedVendor && (
                <BadgeCheck className="h-4 w-4 text-primary" data-testid={`verified-badge-${post.id}`} />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            data-testid={`delete-post-${post.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {post.originalPostId && post.quoteText && (
        <div className="bg-muted/50 rounded-md p-3 border-l-2 border-primary">
          <p className="text-sm text-muted-foreground italic">
            {renderContentWithMentions(post.quoteText)}
          </p>
        </div>
      )}

      <p className="text-foreground whitespace-pre-wrap">
        {renderContentWithMentions(post.content)}
      </p>

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          }`}
          onClick={isLiked ? onUnlike : onLike}
          disabled={!isAuthenticated()}
          data-testid={`like-btn-${post.id}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{post.likesCount}</span>
        </button>

        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={onComment}
          data-testid={`comment-btn-${post.id}`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>

        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={onShare}
          disabled={!isAuthenticated()}
          data-testid={`share-btn-${post.id}`}
        >
          <Share2 className="h-4 w-4" />
          <span>{post.sharesCount}</span>
        </button>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onDelete,
}: {
  comment: Comment;
  onDelete: () => void;
}) {
  const user = getUser();
  const isAuthor = user?.id === comment.authorId;
  const isAdmin = user?.role === "admin";
  const canDelete = isAuthor || isAdmin;

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0" data-testid={`comment-${comment.id}`}>
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
        {comment.author.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm text-foreground">
            {comment.author.username}
          </span>
          {comment.author.isVerifiedVendor && (
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="text-xs text-muted-foreground">
            · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground mt-0.5">
          {renderContentWithMentions(comment.content)}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={onDelete}
          data-testid={`delete-comment-${comment.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default function SocialFeed() {
  const [newPost, setNewPost] = useState("");
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [sharePost, setSharePost] = useState<SocialPost | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery<SocialPost[]>({
    queryKey: ["socialPosts"],
    queryFn: async () => {
      const res = await fetch("/api/social/posts");
      return res.json();
    },
  });

  const { data: likedPosts } = useQuery<Record<string, boolean>>({
    queryKey: ["likedPosts"],
    queryFn: async () => {
      if (!isAuthenticated() || !posts) return {};
      const likes: Record<string, boolean> = {};
      for (const post of posts) {
        const res = await fetchWithAuth(`/api/social/posts/${post.id}/liked`);
        const data = await res.json();
        likes[post.id] = data.liked;
      }
      return likes;
    },
    enabled: isAuthenticated() && !!posts,
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["postComments", selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return [];
      const res = await fetch(`/api/social/posts/${selectedPost.id}/comments`);
      return res.json();
    },
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; originalPostId?: string; quoteText?: string }) => {
      const res = await fetchWithAuth("/api/social/posts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      setNewPost("");
      setSharePost(null);
      setQuoteText("");
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetchWithAuth(`/api/social/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetchWithAuth(`/api/social/posts/${postId}/like`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetchWithAuth(`/api/social/posts/${postId}/like`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await fetchWithAuth(`/api/social/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["postComments", selectedPost?.id] });
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetchWithAuth(`/api/social/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments", selectedPost?.id] });
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate({ content: newPost });
  };

  const handleShare = () => {
    if (!sharePost) return;
    createPostMutation.mutate({
      content: sharePost.content,
      originalPostId: sharePost.id,
      quoteText: quoteText || undefined,
    });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedPost) return;
    createCommentMutation.mutate({
      postId: selectedPost.id,
      content: commentText,
    });
  };

  return (
    <div className="space-y-4">
      {isAuthenticated() && (
        <div className="bg-card border border-border rounded-lg p-4" data-testid="create-post-form">
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            maxLength={800}
            className="min-h-[80px] resize-none"
            data-testid="post-input"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {newPost.length}/800
            </span>
            <Button
              onClick={handleCreatePost}
              disabled={!newPost.trim() || createPostMutation.isPending}
              size="sm"
              data-testid="submit-post-btn"
            >
              <Send className="h-4 w-4 mr-1" />
              Post
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={likedPosts?.[post.id] || false}
              onLike={() => likeMutation.mutate(post.id)}
              onUnlike={() => unlikeMutation.mutate(post.id)}
              onDelete={() => deletePostMutation.mutate(post.id)}
              onComment={() => setSelectedPost(post)}
              onShare={() => setSharePost(post)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No posts yet</p>
          <p className="text-sm">Be the first to share something!</p>
        </div>
      )}

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {selectedPost.author.username[0].toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">
                      {selectedPost.author.username}
                    </span>
                    {selectedPost.author.isVerifiedVendor && (
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                </div>
                <p className="text-sm">{renderContentWithMentions(selectedPost.content)}</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="pr-4">
                  {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        onDelete={() => deleteCommentMutation.mutate(comment.id)}
                      />
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No comments yet
                    </p>
                  )}
                </div>
              </ScrollArea>

              {isAuthenticated() && (
                <div className="flex gap-2 pt-2 border-t">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={500}
                    className="min-h-[60px] resize-none flex-1"
                    data-testid="comment-input"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                    size="icon"
                    className="self-end"
                    data-testid="submit-comment-btn"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sharePost} onOpenChange={() => setSharePost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
          </DialogHeader>
          
          {sharePost && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3 border-l-2 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">
                    {sharePost.author.username}
                  </span>
                  {sharePost.author.isVerifiedVendor && (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sharePost.content.length > 200
                    ? sharePost.content.slice(0, 200) + "..."
                    : sharePost.content}
                </p>
              </div>

              <Textarea
                placeholder="Add your thoughts (optional)..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                maxLength={800}
                className="min-h-[80px] resize-none"
                data-testid="quote-input"
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSharePost(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={createPostMutation.isPending}
                  data-testid="confirm-share-btn"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
