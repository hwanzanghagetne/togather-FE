const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

const MAX_SIZE_MB = 5

export async function uploadToCloudinary(file: File): Promise<string> {
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`파일 크기는 ${MAX_SIZE_MB}MB 이하만 가능해요`)
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  )
  if (!res.ok) throw new Error('업로드 실패')
  const data = await res.json()
  return data.secure_url as string
}
