import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import Feed from '../components/Feed';
import TweetComposer from '../components/TweetComposer';

export default function Home() {
  const { data: tweets, isLoading } = useQuery({
    queryKey: ['tweets', 'timeline'],
    queryFn: () => api.get('/api/tweets'),
  });

  return (
    <div>
      <div className="feed-header">
        <h2>Home</h2>
      </div>
      <TweetComposer />
      <div className="tweet-divider" />
      <Feed
        tweets={tweets}
        loading={isLoading}
        empty="No tweets yet! Follow some people to see their posts here."
      />
    </div>
  );
}
