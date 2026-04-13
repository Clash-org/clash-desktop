import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from './index.module.css';
import { openUrl } from "@tauri-apps/plugin-opener";

export default function MyMarkdown({ text }:{text: string}) {
    return <div className={styles.markdown}>
        <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
        a(props) {
            const { children, href, ...rest } = props;
            return (
            //@ts-ignore
            <a {...rest} onClick={async (e) => { e.preventDefault(); await openUrl(href) }}>
                {children}
            </a>
            )
        }
        }}
        >
            {text}
        </Markdown>
    </div>
}