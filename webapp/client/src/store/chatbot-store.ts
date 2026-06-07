import { create } from 'zustand'

interface ChatbotFormData {
  name: string
  phone: string
  subject: string
  message: string
}

interface ChatbotStore {
  isOpen: boolean
  formData: ChatbotFormData
  setIsOpen: (open: boolean) => void
  updateFormData: (data: Partial<ChatbotFormData>) => void
  resetFormData: () => void
  submitForm: () => void
}

const initialFormData: ChatbotFormData = {
  name: '',
  phone: '',
  subject: '',
  message: ''
}

export const useChatbotStore = create<ChatbotStore>((set) => ({
  isOpen: false,
  formData: initialFormData,

  setIsOpen: (open) => set({ isOpen: open }),

  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),

  resetFormData: () => set({ formData: initialFormData }),

  submitForm: () => {
    // Here you can add API call logic later
    set({ formData: initialFormData, isOpen: false })
  }
}))
