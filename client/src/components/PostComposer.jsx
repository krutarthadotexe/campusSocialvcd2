import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: 'Square 1:1' },
  { value: '4:5', label: 'Portrait 4:5' },
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '3:2', label: 'Classic 3:2' }
];

export function PostComposer({ onCreated }) {
  const [caption, setCaption] = useState('');
  const [locationText, setLocationText] = useState('');
  const [tags, setTags] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!files.length) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [files]);

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
      formData.append('aspectRatio', aspectRatio);
      formData.append('locationText', locationText);
      formData.append('tags', tags);
      files.forEach((file) => formData.append('media', file));

      await api.createPost(formData);
      setCaption('');
      setAspectRatio('1:1');
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

  const previewFile = files[0];

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
      <label>
        Post ratio
        <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
      {previewUrl && previewFile ? (
        <div className="media-frame" style={{ '--post-aspect-ratio': aspectRatio }}>
          {previewFile.type.startsWith('video/') ? (
            <video controls src={previewUrl} />
          ) : (
            <img src={previewUrl} alt="Post preview" />
          )}
        </div>
      ) : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? 'Uploading...' : 'Publish post'}
      </button>
    </form>
  );
}
