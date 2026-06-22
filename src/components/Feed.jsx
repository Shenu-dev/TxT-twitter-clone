import TweetCard from './TweetCard';

export default function Feed({ tweets, loading, empty }) {
  if (loading) {
    return (
      <div className="feed">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="tweet-card skeleton">
            <div className="skeleton-avatar" />
            <div className="skeleton-body">
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-80" />
              <div className="skeleton-line w-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tweets || tweets.length === 0) {
    return (
      <div className="empty-state">
        <p>{empty || 'Nothing here yet'}</p>
      </div>
    );
  }

  return (
    <div className="feed">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}
