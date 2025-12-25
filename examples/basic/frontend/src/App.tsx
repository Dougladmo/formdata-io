import React from 'react';
import FormDataIOUpload from './components/FormDataIOUpload';
import GenericUpload from './components/GenericUpload';

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>FormData IO - React Example</h1>
        <p className="subtitle">
          Side-by-side comparison: formdata-io vs generic approach
        </p>
      </header>

      <div className="comparison-grid">
        <FormDataIOUpload />
        <GenericUpload />
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <p>
          <strong>Notice the difference:</strong> formdata-io automatically handles
          type conversion (age → number), nested objects (metadata → object),
          and arrays (tags → array). Generic approach requires manual serialization.
        </p>
      </footer>
    </div>
  );
}
