import type { H3Event } from 'h3'

export async function readFormData(event: H3Event) {
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      status: 400,
      statusMessage: 'Bad Request',
      message: 'No Files Uploaded',
    })
  }
  return formData
}
