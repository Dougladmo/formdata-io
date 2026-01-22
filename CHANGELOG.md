# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Base64 Converters**: New utilities for bidirectional conversion between Files/Blobs and base64 strings
  - `fileToBase64()` - Convert File or Blob to base64 data URI with MIME type preservation
  - `base64ToBlob()` - Convert base64 data URI to Blob with MIME type extraction
  - `base64ToFile()` - Convert base64 data URI to File with filename and metadata
  - `blobToFile()` - Convert Blob to File with specified filename
  - `fileToBlob()` - Convert File to Blob for type conversion
- Flexibility to choose between FormData/multipart or JSON/base64 approaches
- Support for all File/Blob types: images, documents, media, text files

### Changed
- Enhanced multipart parsing by adding field normalization and content-type validation
- Improved error handling in multipart parsing logic

### Fixed
- Field value normalization for consistent data handling
