import { Globe } from "lucide-react"
import styles from "./index.module.css"
import React from "react"
import { openUrl } from "@tauri-apps/plugin-opener"

function SocialMedias({ socialMedias }:{socialMedias: string[]}) {
    const getIconByLink = (link: string) => {
        const domain = new URL(link).host
        switch (domain) {
            case "vk.ru":
                return (
                <svg width="36" height="13" viewBox="0 0 56 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M54.7151 2.23455C55.1043 0.946487 54.7151 0 52.8624 0H46.736C45.1783 0 44.4601 0.817622 44.0706 1.71921C44.0706 1.71921 40.9549 9.25431 36.5414 14.1487C35.1137 15.5656 34.4645 16.0166 33.6857 16.0166C33.2962 16.0166 32.712 15.5656 32.712 14.2777V2.23455C32.712 0.688875 32.2805 0 30.9823 0H21.355C20.3815 0 19.7961 0.717373 19.7961 1.39727C19.7961 2.86254 22.0028 3.20046 22.2302 7.32225V16.2742C22.2302 18.2367 21.873 18.5927 21.0941 18.5927C19.0172 18.5927 13.9652 11.0239 10.9688 2.3633C10.3816 0.679966 9.79268 0 8.22695 0H2.10051C0.350103 0 0 0.817622 0 1.71921C0 3.32932 2.077 11.3152 9.67084 21.8771C14.7334 29.09 21.8661 33 28.3566 33C32.2509 33 32.7327 32.1316 32.7327 30.6358V25.1842C32.7327 23.4474 33.1016 23.1007 34.3348 23.1007C35.2434 23.1007 36.8011 23.5516 40.4358 27.0294C44.5898 31.1511 45.2746 33 47.611 33H53.7377C55.4879 33 56.3631 32.1316 55.8582 30.4177C55.3057 28.7098 53.3226 26.2317 50.691 23.294C49.263 21.6195 47.121 19.8163 46.4719 18.9144C45.5633 17.7554 45.823 17.2401 46.4719 16.2098C46.4719 16.2098 53.9362 5.77658 54.7151 2.23455Z" fill="white"/>
                </svg>

                )
            default:
                return (
                    <Globe size={20} color="var(--bg)" />
                )
        }
    }
    return (
        <div className={styles.socialLinks}>
            {socialMedias.map((link, i)=>(
                <div key={i} onClick={async ()=> await openUrl(link)} className={styles.socialLink}>
                    {getIconByLink(link)}
                </div>
            ))}
        </div>
    )
}

export default React.memo(SocialMedias)