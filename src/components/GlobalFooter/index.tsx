import { Layout } from 'antd'
import styles from './index.module.css'

const { Footer } = Layout

const GlobalFooter: React.FC = () => {
  return (
    <Footer className={styles.footer}>
      <div className="footer-content">
        <p className={styles.copyright}>
          <a
            href="https://www.codefather.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="author-link"
          >
            活动页快速生成器 by Mason.Zhu
          </a>
        </p>
      </div>
    </Footer>
  )
}

export default GlobalFooter
