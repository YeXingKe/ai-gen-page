import { message } from 'antd'
import { useLoginUserStore } from '@/stores/loginUser'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// 是否为首次获取登录用户
let firstFetchLoginUser = true

/**
 * 权限校验钩子
 */
export function useAccess() {
  const loginUserStore = useLoginUserStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAccess = async () => {
      // 确保页面刷新，首次加载时，能够等后端返回用户信息后再校验权限
      if (firstFetchLoginUser) {
        await loginUserStore.fetchLoginUser()
        firstFetchLoginUser = false
      }

      const loginUser = loginUserStore.loginUser
      const toUrl = location.pathname

      if (toUrl.startsWith('/admin')) {
        if (!loginUser || loginUser.userRole !== 'admin') {
          message.error('没有权限')
          navigate(`/user/login?redirect=${toUrl}`)
          return
        }
      }
    }

    checkAccess()
  }, [location.pathname, loginUserStore, navigate])
}

/**
 * 管理员权限检查
 */
export function checkAdminAccess(loginUser: { userRole: string }): boolean {
  return loginUser && loginUser.userRole === 'admin'
}
