import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from './index.module.css';

export default function MyMarkdown({ text }:{text: string}) {
    return <div className={styles.markdown}><Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown></div>
}