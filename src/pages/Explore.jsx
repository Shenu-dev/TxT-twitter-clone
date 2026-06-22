import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import Feed from '../components/Feed';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [input, setInput] = useState(q);

  const { data: tweets, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => q ? api.get(`/api/tweets/search/${encodeURIComponent(q)}`) : api.get('/api/tweets'),
    enabled: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div>
      <div className="feed-header explore-header">
        <form className="search-box explore-search" onSubmit={handleSearch}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search TxT"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
      </div>
      <div className="explore-tabs">
        <button className="tab active">{q ? 'Results' : 'For you'}</button>
      </div>
      <Feed
        tweets={tweets}
        loading={isLoading}
        empty={q ? `No results for "${q}"` : 'Nothing to see here'}
      />
    </div>
  );
}
