import { useState } from 'react';
import { api } from '../lib/api.js';

export function PostComposer({ onCreated }) {
  const [caption, setCaption] = useState('');
  const [locationText, setLocationText] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (files.length === 0) {
      setError('Select at least one image or video');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('locationText', locationText);
      formData.append('tags', tags);
      files.forEach((file) => formData.append('media', file));

      await api.createPost(formData);
      setCaption('');
      setLocationText('');
      setTags('');
      setFiles([]);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel composer" onSubmit={handleSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Create post</p>
          <h3>Store media directly in MongoDB</h3>
        </div>
      </div>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Write a caption..."
        rows={4}
      />
      <input
        value={locationText}
        onChange={(event) => setLocationText(event.target.value)}
        placeholder="Location"
      />
      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="Tags, comma separated"
      />
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(event) => setFiles(Array.from(event.target.files || []))}
      />
      {files.length ? <p className="subtle-text">{files.length} file(s) selected</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Uploading...' : 'Publish post'}
      </button>
    </form>
  );
}
