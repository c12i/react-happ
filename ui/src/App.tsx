import { useContext } from 'react';
import { HolochainContext } from './contexts/HolochainContext';
import AllPosts from './forum/posts/AllPosts';
import CreatePost from './forum/posts/CreatePost';

import './App.css';

const App = () => {
  const { error, loading } = useContext(HolochainContext);
  if (loading) {
    return <progress />;
  }
  if (error) {
    return <article>Error starting app: {error.message}</article>;
  }
  return (
    <div>
      <h2>Welcome to the Forum hApp</h2>
      <CreatePost />
      <AllPosts />
    </div>
  )
}

export default App;
