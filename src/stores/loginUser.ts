import { create } from 'zustand'
import { getLoginUser } from '@/api/userController'

interface LoginUserStore {
  loginUser: API.LoginUserVO
  fetchLoginUser: () => Promise<void>
  setLoginUser: (newLoginUser: API.LoginUserVO) => void
}

/**
 * 登录用户信息存储
 */
export const useLoginUserStore = create<LoginUserStore>((set) => ({
  loginUser: {
    userName: '未登录',
    userAvatar: '',
  },

  // 获取登录用户信息
  fetchLoginUser: async () => {
    const res = await getLoginUser()
    if (res.data.code === 0 && res.data.data) {
      set({ loginUser: res.data.data })
    }
  },

  // 更新登录用户信息
  setLoginUser: (newLoginUser) => {
    set({ loginUser: newLoginUser })
  },
}))
