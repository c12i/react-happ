import { Link, HolochainError, AppSignal } from '@holochain/client';
import  { FC, useCallback, useState, useEffect, useContext } from 'react';

import type { PostsSignal } from './types';
import PostDetail from './PostDetail';
import { HolochainContext } from '../../contexts/HolochainContext';

const AllPosts: FC = () => {
  const {client} = useContext(HolochainContext);
  const [hashes, setHashes] = useState<Uint8Array[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HolochainError | undefined>();

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const links: Link[] = await client?.callZome({
        cap_secret: null,
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'get_all_posts',
        payload: null,
      });
      if (links?.length) {
        setHashes(links.map((l) => l.target));
      }
    } catch (e) {
      setError(e as HolochainError);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const handleSignal = useCallback((signal: AppSignal) => {
    if (signal.zome_name !== 'posts') return;
    const payload = signal.payload as PostsSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'Post') return;
    setHashes((prevHashes) => [...prevHashes, payload.action.hashed.hash]);
  }, [setHashes]);

  useEffect(() => {
    fetchPosts();
    client?.on('signal', handleSignal);
  }, [client, handleSignal, fetchPosts]);

  if (loading) {
    return <progress />;
  }

  return (
    <div>
      {error ? (
        <span>Error fetching the posts: {error.message}</span>
      ) : hashes.length > 0 ? (
        <div>
          {hashes.map((hash, i) => (
            <PostDetail key={i} postHash={hash} onPostDeleted={fetchPosts} />
          ))}
        </div>
      ) : (
        <article>No posts found.</article>
      )}
    </div>
  );
};


export default AllPosts;
