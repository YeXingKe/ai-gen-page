import { createBrowserRouter } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'
import HomePage from '@/pages/HomePage'
import UserLoginPage from '@/pages/UserLoginPage'
import UserRegisterPage from '@/pages/UserRegisterPage'
import UserManagePage from '@/pages/UserManagePage'
// import AppManagePage from '@/pages/admin/AppManagePage'
// import AppChatPage from '@/pages/app/AppChatPage'
// import AppEditPage from '@/pages/app/AppEditPage'
// import ChatManagePage from '@/pages/admin/ChatManagePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/user/login',
        element: <UserLoginPage />,
      },
      {
        path: '/user/register',
        element: <UserRegisterPage />,
      },
      {
        path: '/admin/userManage',
        element: <UserManagePage />,
      },
      // {
      //   path: '/admin/appManage',
      //   element: <AppManagePage />,
      // },
      // {
      //   path: '/admin/chatManage',
      //   element: <ChatManagePage />,
      // },
      // {
      //   path: '/app/chat/:id',
      //   element: <AppChatPage />,
      // },
      // {
      //   path: '/app/edit/:id',
      //   element: <AppEditPage />,
      // },
    ],
  },
])

export default router
