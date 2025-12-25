// ============================================================================
// IMPLEMENTATION B: Generic approach
// Total: ~45 linhas de código (+28% mais código!)
// ============================================================================
import React, { useState, FormEvent } from 'react';

interface UploadResult {
  success: boolean;
  received?: any;
  error?: string;
}

export default function GenericUpload() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // ⚠️ MANUAL: Precisa construir FormData manualmente e serializar objetos
      const formData = new FormData();
      formData.append('name', name);
      if (age) formData.append('age', age); // Será string no servidor
      if (file) formData.append('avatar', file);

      // 🔧 SERIALIZAÇÃO MANUAL: Arrays e objetos precisam de JSON.stringify
      formData.append('tags', JSON.stringify(['react-example', 'generic']));
      formData.append('metadata', JSON.stringify({
        source: 'react-vite',
        timestamp: new Date().toISOString()
      }));

      const response = await fetch('/api/upload-generic', {
        method: 'POST',
        body: formData
      });

      setResult(await response.json());
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <h2>Implementation B: Generic Approach</h2>
      <p className="description">
        Uses native <code>FormData</code> - manual serialization required.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="generic-name">Name *</label>
          <input
            id="generic-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="generic-age">Age</label>
          <input
            id="generic-age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
          />
        </div>

        <div className="form-group">
          <label htmlFor="generic-file">Avatar</label>
          <input
            id="generic-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload with Generic Approach'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Success!' : '❌ Error'}</h3>
          {result.success ? (
            <pre>{JSON.stringify(result.received, null, 2)}</pre>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
