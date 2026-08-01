/**
 * Storage abstraction for file uploads.
 * Supports local filesystem and S3-compatible object storage.
 */
export interface StorageProvider {
  /** Persist a file buffer under the given key/path. Returns the public URL. */
  save(key: string, buffer: Buffer, mimeType: string): Promise<string>

  /** Delete a file by its key/path. */
  delete(key: string): Promise<void>

  /** Check if a file exists. */
  exists(key: string): Promise<boolean>

  /**
   * Read a file's bytes back. Returns null when the key does not exist.
   * Used to stream private (non-public) objects through the API so stored
   * URLs stay stable and sensitive data (medical records) never gets a
   * public S3 URL.
   */
  read(key: string): Promise<{ data: Buffer; contentType: string } | null>
}
