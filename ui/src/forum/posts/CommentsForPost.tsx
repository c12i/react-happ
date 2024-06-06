
import { Link, HolochainError, AppSignal } from '@holochain/client';
import  { FC, useCallback, useState, useEffect, useContext } from 'react';

import CommentDetail from './CommentDetail';
import type { PostsSignal } from './types';
import { HolochainContext } from '../../contexts/HolochainContext';

const CommentsForPost: FC<CommentsForPostProps> = ({postHash}) => {
  const {client} = useContext(HolochainContext);
  const [hashes, setHashes] = useState<Uint8Array[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HolochainError | undefined>();

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const links: Link[] = await client?.callZome({
        cap_secret: null,
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'get_comments_for_post',
        payload: postHash
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

  const handleSignal = useCallback(async (signal: AppSignal) => {
    if (signal.zome_name !== 'posts') return;
    const payload = signal.payload as PostsSignal;
    if (!(payload.type === 'EntryCreated' && payload.app_entry.type === 'Comment')) return;
    await fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchComments();
    client?.on('signal', handleSignal);
  }, [client, handleSignal]);

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      {error ? (
        <span>Error fetching the comments: {error.message}</span>
      ) : hashes.length > 0 ? (
        <div>
          {hashes.map((hash, i) => (
            <CommentDetail key={i} commentHash={hash} onCommentDeleted={fetchComments} />
          ))}
        </div>
      ) : (
        <span>No comments found for this post.</span>
      )}
    </div>
  );
};

interface CommentsForPostProps {
  postHash: Uint8Array
}

export default CommentsForPost;
