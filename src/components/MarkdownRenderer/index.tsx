import React, { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import './index.module.css'

interface MarkdownRendererProps {
  content: string
}

interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const md: MarkdownIt = useMemo(() => {
    const instance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre class="hljs"><code>' +
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
              '</code></pre>'
            )
          } catch {
            // Ignore error, use default handling
          }
        }
        // 使用 instance 而不是闭包中的 md
        return '<pre class="hljs"><code>' + instance.utils.escapeHtml(str) + '</code></pre>'
      },
    })
    return instance
  }, [])

  const renderedMarkdown = useMemo(() => {
    return md.render(content)
  }, [content, md])

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
    />
  )
}

export default MarkdownRenderer
