// ============================================================================
// IMPLEMENTATION A: formdata-io
// Total: ~35 linhas de código
// ============================================================================
import React, { useState, FormEvent } from 'react';
import { payload } from 'formdata-io/client';

interface UploadResult {
  success: boolean;
  received?: any;
  error?: string;
}

export default function FormDataIOUpload() {
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
      // ✅ SIMPLES: Passa objetos nativos, formdata-io cuida do resto
      const formData = payload({
        name,
        age: age ? parseInt(age) : undefined,
        avatar: file || undefined,
        tags: ['react-example', 'formdata-io'],
        metadata: {
          source: 'react-vite',
          timestamp: new Date().toISOString()
        }
      });

      const response = await fetch('/api/upload-formdata-io', {
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
      <h2>Implementation A: formdata-io</h2>
      <p className="description">
        Uses <code>payload()</code> - automatic type conversion and serialization.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="formdata-name">Name *</label>
          <input
            id="formdata-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="formdata-age">Age</label>
          <input
            id="formdata-age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
          />
        </div>

        <div className="form-group">
          <label htmlFor="formdata-file">Avatar</label>
          <input
            id="formdata-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload with formdata-io'}
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
