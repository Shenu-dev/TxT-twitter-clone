import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, X } from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

export default function TweetComposer({ parentId, placeholder, onSuccess, compact }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const fileRef = useRef();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (form) => api.post('/api/tweets', form),
    onSuccess: (data) => {
      setText('');
      setImage(null);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['tweet', parentId] });
      }
      onSuccess?.(data);
    },
  });

  const handlePost = () => {
    if (!text.trim()) return;
    const form = new FormData();
    form.append('content', text);
    if (parentId) form.append('parent_id', parentId);
    if (image) form.append('image', image);
    mutation.mutate(form);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const charsLeft = 280 - text.length;

  return (
    <motion.div
      initial={compact ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tweet-composer"
    >
      <div className="composer-row">
        <Avatar user={user} size={compact ? 32 : 40} />
        <textarea
          placeholder={placeholder || "What's happening?"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          maxLength={280}
          rows={compact ? 2 : 3}
          autoFocus={compact}
        />
      </div>
      {image && (
        <div className="composer-image">
          <img src={URL.createObjectURL(image)} alt="preview" />
          <button onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ''; }}><X size={16} /></button>
        </div>
      )}
      {(text.length > 0 || image) && (
        <div className="composer-footer">
          <button className="btn-icon" onClick={() => fileRef.current?.click()}>
            <Image size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files[0])} />
          <span className={`char-count ${charsLeft < 20 ? 'warn' : ''} ${charsLeft < 0 ? 'over' : ''}`}>
            {charsLeft}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-post"
            disabled={!text.trim() || charsLeft < 0 || mutation.isPending}
            onClick={handlePost}
          >
            {mutation.isPending ? '...' : 'Post'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
