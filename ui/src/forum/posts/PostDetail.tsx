import { Record, HolochainError } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import  { FC, useState, useEffect, useContext, useCallback } from 'react';

import EditPost from './EditPost'; 
import type { Post } from './types';
import { HolochainContext } from '../../contexts/HolochainContext';
import CommentsForPost from './CommentsForPost';
import CreateComment from './CreateComment';

const PostDetail: FC<PostDetailProps> = ({ postHash, onPostDeleted }) => {
  const {client} = useContext(HolochainContext)
  const [record, setRecord] = useState<Record | undefined>(undefined);
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HolochainError | undefined>()

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setRecord(undefined);
    try {
      const result = await client?.callZome({
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'get_latest_post',
        payload: postHash,
      });
      setRecord(result);
      setLoading(false);
    } catch (e) {
      setError(e as HolochainError)
    } finally {
      setLoading(false)
    }
  }, [client, postHash]);

  const deletePost = async () => {
    setLoading(true)
    try {
      await client?.callZome({
        cap_secret: null,
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'delete_post',
        payload: postHash,
      });
      onPostDeleted && onPostDeleted(postHash)
    } catch (e) {
      setError(e as HolochainError)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!postHash) {
      throw new Error(`The postHash prop is required for this component`);
    }
    fetchPost();
  }, [fetchPost, postHash]);

  useEffect(() => {
    if (!record) return
    setPost(decode((record.entry as any).Present.entry) as Post);
  }, [record]);

  if (loading) {
    return <progress />
  }
  
  if (error) {
    return <article>Error: {error.message}</article>
  }
  
  return (
    <div>
      { editing ? (
        <div>
          <EditPost
            originalPostHash={ postHash }
            currentRecord={record}
            currentPost={ post }
            onPostUpdated={async () => {
              setEditing(false);
              await fetchPost();
            }}
            onEditCanceled={() => setEditing(false)}
          />
        </div>
      ) : record ? (
        <>
          <section>
            <div>
              <span><strong>Title: </strong></span>
              <span>{ post?.title }</span>
            </div>
            <div>
              <span><strong>Content: </strong></span>
              <span>{ post?.content }</span>
            </div>
            <div>
              <button onClick={() => setEditing(true)}>edit</button>
              <button onClick={deletePost}>delete</button>
            </div>

          </section>
          <h3>Comments</h3>
          <CommentsForPost postHash={postHash} />
          <CreateComment postHash={postHash} />
        </>
      ) : (
        <article>The requested post was not found.</article>
      )}
    </div>
  );
};

interface PostDetailProps {
  postHash: Uint8Array
  onPostDeleted?: (postHash: Uint8Array) => void
}

export default PostDetail;
