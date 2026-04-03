import React from 'react'
import { Avatar } from 'antd'
import './index.module.css'

interface UserInfoProps {
  user?: API.UserVO
  size?: number | 'small' | 'default' | 'large'
  showName?: boolean
}

const UserInfo: React.FC<UserInfoProps> = ({ user, size = 'default', showName = true }) => {
  return (
    <div className="user-info">
      <Avatar src={user?.userAvatar} size={size}>
        {user?.userName?.charAt(0) || 'U'}
      </Avatar>
      {showName && <span className="user-name">{user?.userName || '未知用户'}</span>}
    </div>
  )
}

export default UserInfo
