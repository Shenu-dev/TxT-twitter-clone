import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import TweetCard from '../components/TweetCard';
import TweetComposer from '../components/TweetComposer';

export default function TweetPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['tweet', id],
    queryFn: () => api.get(`/api/tweets/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="empty-state"><p>Loading...</p></div>;
  if (!data?.tweet) return <div className="empty-state"><p>Tweet not found</p></div>;

  return (
    <div>
      <div className="feed-header">
        <h2>Post</h2>
      </div>
      <TweetCard tweet={data.tweet} linkToTweet={false} />
      <div className="tweet-divider" />
      <TweetComposer parentId={id} placeholder="Post your reply" compact />
      {data.replies?.map((reply) => (
        <TweetCard key={reply.id} tweet={reply} linkToTweet={false} />
      ))}
      {(!data.replies || data.replies.length === 0) && (
        <div className="empty-state"><p>No replies yet</p></div>
      )}
    </div>
  );
}
