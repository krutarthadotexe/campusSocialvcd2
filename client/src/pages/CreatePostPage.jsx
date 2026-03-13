import { useNavigate } from 'react-router-dom';
import { PostComposer } from '../components/PostComposer.jsx';

export function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <section className="stack">
      <PostComposer
        onCreated={() => {
          navigate('/');
        }}
      />
    </section>
  );
}
