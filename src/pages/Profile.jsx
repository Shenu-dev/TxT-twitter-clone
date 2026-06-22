import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import Avatar from '../components/Avatar';
import Feed from '../components/Feed';

function EditProfileModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');

  const mutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append('display_name', displayName);
      form.append('bio', bio);
      return api.patch(`/api/users/${user.id}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <button onClick={onClose} className="btn-close"><X size={18} /></button>
          <h3>Edit profile</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-save"
            disabled={mutation.isPending}
            onClick={mutation.mutate}
          >
            {mutation.isPending ? '...' : 'Save'}
          </motion.button>
        </div>
        <div className="edit-modal-body">
          <label>Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const profileUsername = username || me?.username;
  const [showEdit, setShowEdit] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', profileUsername],
    queryFn: () => api.get(`/api/users/${profileUsername}`),
    enabled: !!profileUsername,
  });

  const { data: tweets } = useQuery({
    queryKey: ['tweets', 'user', profile?.id],
    queryFn: () => api.get(`/api/tweets/user/${profile.id}`),
    enabled: !!profile?.id,
  });

  const toggleFollow = useMutation({
    mutationFn: () =>
      profile.is_following
        ? api.del(`/api/users/${profile.id}/follow`)
        : api.post(`/api/users/${profile.id}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', profileUsername] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (isLoading) {
    return <div className="empty-state"><p>Loading...</p></div>;
  }
  if (!profile) {
    return <div className="empty-state"><p>User not found</p></div>;
  }

  const isOwn = profile.id === me?.id;

  return (
    <div>
      <div className="feed-header">
        <h2>{profile.display_name}</h2>
        <span className="tweet-count">{tweets?.length || 0} posts</span>
      </div>
      <div className="profile-header">
        <div className="profile-banner" style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
        <div className="profile-avatar-row">
          <Avatar user={profile} size={100} />
          {!isOwn && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`btn-follow ${profile.is_following ? 'following' : ''}`}
              onClick={toggleFollow.mutate}
            >
              {toggleFollow.isPending ? '...' : profile.is_following ? 'Following' : 'Follow'}
            </motion.button>
          )}
          {isOwn && (
            <button className="btn-edit-profile" onClick={() => setShowEdit(true)}>Edit profile</button>
          )}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{profile.display_name}</h2>
          <span className="profile-username">@{profile.username}</span>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <span><strong>{profile.following_count || 0}</strong> Following</span>
            <span><strong>{profile.followers_count || 0}</strong> Followers</span>
          </div>
        </div>
      </div>
      <div className="profile-tabs">
        <button className="tab active">Posts</button>
      </div>
      <Feed tweets={tweets} empty="No posts yet" />
      {showEdit && <EditProfileModal user={profile} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
