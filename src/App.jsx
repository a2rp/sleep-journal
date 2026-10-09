import { useEffect, useState } from "react";
import styles from "./App.module.css";
import SiteHeader from "./components/siteHeader";
import SiteFooter from "./components/siteFooter";
import BackToTop from "./components/backToTop";
import SleepJournal from "./components/sleepJournal";

const repository = "https://github.com/a2rp/sleep-journal";
const App = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return <div className={styles["app-shell"]} id="top">
        <SiteHeader title="Nightside" mark="N" navItems={[["Overview", "#overview"], ["Sleep log", "#sleep-log"], ["Your rhythm", "#rhythm"]]} repoUrl={repository} />
        <main className={styles.pageContent}><SleepJournal /></main>
        <SiteFooter repoUrl={repository} />
        <BackToTop visible={showBackToTop} />
    </div>;
};
export default App;
