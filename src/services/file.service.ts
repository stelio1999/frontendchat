import api from './api'

export const fileService = {
  async uploadFile(file: File, chatId: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatId', chatId)

    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 100)
        )
        // Emit progress event
        window.dispatchEvent(new CustomEvent('uploadProgress', { detail: { percentCompleted } }))
      },
    })
    return response.data
  },

  async downloadFile(fileId: string) {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', response.headers['x-file-name'] || 'file')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async deleteFile(fileId: string) {
    const response = await api.delete(`/files/${fileId}`)
    return response.data
  },

  async getFileInfo(fileId: string) {
    const response = await api.get(`/files/${fileId}`)
    return response.data
  },
}