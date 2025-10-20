import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Storage client initialized');
} else {
  console.warn('⚠️  Supabase URL or KEY not configured. Storage features will be disabled.');
}

export { supabase };

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name (e.g., 'hotel-logos')
 * @param filePath - The path where the file should be stored
 * @param file - The file buffer or blob
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      upsert: true, // Overwrite if file exists
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path of the file to delete
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get public URL for a file
 * @param bucket - The storage bucket name
 * @param filePath - The file path
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Initialize storage buckets if they don't exist
 */
export async function initializeStorageBuckets() {
  if (!supabase) {
    console.log('⚠️  Skipping bucket initialization - Supabase not configured');
    return;
  }

  const bucketsToCreate = ['hotel-logos', 'hotel-assets'];

  for (const bucketName of bucketsToCreate) {
    const { data: buckets, error: listError} = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets: ${listError.message}`);
      continue;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make bucket public for easy access to logos
      });

      if (createError) {
        console.error(`Failed to create bucket ${bucketName}: ${createError.message}`);
      } else {
        console.log(`✅ Created storage bucket: ${bucketName}`);
      }
    }
  }
}
