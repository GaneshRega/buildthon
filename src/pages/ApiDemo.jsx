import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import './ApiDemo.css';

export default function ApiDemo() {
  const [postId, setPostId] = useState('');
  const debouncedId = useDebounce(postId, 400);

  const url = debouncedId ? `https://jsonplaceholder.typicode.com/posts/${debouncedId}` : null;
  const { data, loading, error, refetch } = useFetch(url);

  const { data: posts, loading: listLoading } = useFetch('https://jsonplaceholder.typicode.com/posts?_limit=6');

  return (
    <div className="container api-demo">
      <div className="api-demo__header">
        <h1>API Demo</h1>
        <p className="text-muted">useFetch hook + debounce in action — powered by JSONPlaceholder</p>
      </div>

      {/* Single post fetch */}
      <Card title="Fetch Post by ID" subtitle="Type a number 1–100 to fetch a post">
        <div className="flex gap-2 items-center">
          <Input
            id="postId"
            type="number"
            placeholder="e.g. 42"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            min="1" max="100"
          />
          <Button onClick={refetch} disabled={!postId}>Refetch</Button>
        </div>
        {loading && <Loading text="Fetching post..." />}
        {error && <p className="api-demo__error">Error: {error}</p>}
        {data && !loading && (
          <div className="api-demo__result">
            <p className="api-demo__result-id">#{data.id}</p>
            <h3>{data.title}</h3>
            <p className="text-muted text-sm mt-1">{data.body}</p>
          </div>
        )}
      </Card>

      {/* Posts list */}
      <div className="api-demo__header mt-4">
        <h2>Latest Posts</h2>
      </div>
      {listLoading ? <Loading /> : (
        <div className="grid grid-2 gap-3">
          {posts?.map((post) => (
            <Card key={post.id} hoverable title={`#${post.id} ${post.title}`}>
              <p className="text-sm text-muted">{post.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
