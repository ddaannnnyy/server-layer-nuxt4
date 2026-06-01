export type AllowedMediaType = `${string}/${string}` | `${string}/*`

export function mediaTypeCheck(debugString: string, allowed: AllowedMediaType[]) {
  const file = {
    type: debugString,
  }
  if (!file.type) {
    throw createError({
      status: 400,
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'No file found when checking media type',
    })
  }

  if (allowed.length === 0) {
    throw createError({
      status: 400,
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'No allowed media types passed to check',
    })
  }

  let result = false

  if (allowed.includes(file.type as AllowedMediaType)) {
    result = true
  }
  else {
    const applicableAllowedList = allowed.filter((type) => {
      const fileFormat = type.split('/')[0]
      if (!fileFormat) {
        throw createError({
          status: 500,
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          message: `Failed to parse allowed list of Media Types - read ${type}, retrieved format of undefined`,
        })
      }
      return file.type?.startsWith(fileFormat)
    })

    // This is slow because it's searching one after the other
    // it does at least filter above so it won't check application/* if the file type is image/*
    // and some will return true on first match
    // but it could be better. TODO this to an actual lookup
    // theres probably a Map I can use
    result = applicableAllowedList.some((type) => {
      const [typeFormat, typeFileType] = type.split('/')
      if (!typeFormat || !typeFileType) {
        throw createError({
          status: 500,
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          message: `Failed to parse allowed list of Media Types - read ${type}, split into ${typeFormat} and ${typeFileType}`,
        })
      }

      const fileInAllowedList = file.type.includes(typeFormat) && typeFileType === '*'
      return fileInAllowedList
    })
  }

  return result
}
