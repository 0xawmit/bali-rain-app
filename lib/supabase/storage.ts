import { createClient } from './client'

/**
 * Storage helper functions for uploading files to Supabase Storage
 */

const BUCKET_NAME = 'social-screenshots'

/**
 * Upload a screenshot for a social submission
 * @param file - The file to upload
 * @param userId - The user ID (used in file path)
 * @returns The public URL of the uploaded file
 */
export async function uploadScreenshot(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient()

  // Create a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload screenshot: ${error.message}`)
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload a profile avatar
 * @param file - The avatar image file
 * @param userId - The user ID (used in file path)
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient()
  const bucketName = 'avatars'

  // Create a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true, // Allow overwriting existing avatar
    })

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(data.path)

  return publicUrl
}

