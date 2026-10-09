import { useEffect, useState } from "react";
import { FiCalendar, FiClock, FiMoon, FiPlus, FiSearch, FiStar, FiTarget, FiTrash2, FiX } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const entriesKey = "nightside-entries";
const goalKey = "nightside-reference-hours";
const ratingNames = ["Very tired", "A little tired", "Okay", "Rested", "Very rested"];
const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const shiftDate = (value, amount) => { const date = new Date(value + "T12:00:00"); date.setDate(date.getDate() + amount); return dateKey(date); };
const formatDay = (value, options = { weekday: "short", month: "short", day: "numeric" }) => new Intl.DateTimeFormat("en", options).format(new Date(value + "T12:00:00"));
const readStorage = (key, fallback) => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; } };
const durationMinutes = (bed, wake) => { const [bedHour, bedMinute] = bed.split(":").map(Number); const [wakeHour, wakeMinute] = wake.split(":").map(Number); return (wakeHour * 60 + wakeMinute - bedHour * 60 - bedMinute + 1440) % 1440; };
const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
const id = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now());

const SleepJournal = () => {
    const today = dateKey(new Date());
    const [entries, setEntries] = useState(() => readStorage(entriesKey, []));
    const [goal, setGoal] = useState(() => readStorage(goalKey, 8));
    const [period, setPeriod] = useState("7d");
    const [ratingFilter, setRatingFilter] = useState("Any feeling");
    const [query, setQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [formError, setFormError] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    useEffect(() => localStorage.setItem(entriesKey, JSON.stringify(entries)), [entries]);
    useEffect(() => localStorage.setItem(goalKey, String(goal)), [goal]);

    const rangeStart = period === "7d" ? shiftDate(today, -6) : period === "30d" ? shiftDate(today, -29) : "0000-01-01";
    const filtered = entries.filter((entry) => entry.date >= rangeStart && entry.date <= today && (ratingFilter === "Any feeling" || entry.rating === ratingNames.indexOf(ratingFilter) + 1) && `${entry.note} ${entry.bedtime}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const totalMinutes = filtered.reduce((sum, entry) => sum + entry.minutes, 0);
    const averageMinutes = filtered.length ? Math.round(totalMinutes / filtered.length) : 0;
    const averageRating = filtered.length ? filtered.reduce((sum, entry) => sum + entry.rating, 0) / filtered.length : 0;
    const goalDifference = Math.round(goal - averageMinutes / 60);
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = shiftDate(today, index - 6);
        return { date, label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(date + "T12:00:00")), minutes: entries.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.minutes, 0) };
    });

    const addEntry = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const minutes = durationMinutes(String(data.get("bedtime")), String(data.get("wake")));
        if (!minutes) { setFormError("Bedtime and wake time need to be different."); return; }
        if (minutes > 16 * 60) { setFormError("Sleep windows over 16 hours are not supported by this journal."); return; }
        const entry = { id: id(), date: String(data.get("date")), bedtime: String(data.get("bedtime")), wake: String(data.get("wake")), minutes, rating: Number(data.get("rating")), note: String(data.get("note")).trim(), createdAt: Date.now() };
        setEntries((current) => [entry, ...current]);
        setFormError(""); setIsAdding(false);
    };
    const removeEntry = () => { setEntries((current) => current.filter((entry) => entry.id !== pendingDelete.id)); setPendingDelete(null); };

    return <div className={styles.sleepJournal}>
        <section className={styles.hero} id="overview"><div><span className={styles.kicker}><FiMoon aria-hidden="true" /> YOUR REST, NOT A SCORECARD</span><h1>Close the day.<br /><span>Keep the feeling.</span></h1><p>A little space to remember how your nights unfold and how you wake up.</p></div><div className={styles.moonCard}><div className={styles.moonArt}><i /><i /><span>☾</span></div><small>YOUR PERSONAL JOURNAL</small><strong>Rest at your own pace.</strong></div></section>

        <section className={styles.summaryGrid} aria-label="Sleep summary"><article><span className={styles.summaryIcon}><FiClock aria-hidden="true" /></span><div><strong>{averageMinutes ? formatDuration(averageMinutes) : "—"}</strong><small>AVERAGE PER NIGHT</small></div></article><article><span className={styles.summaryIcon}><FiCalendar aria-hidden="true" /></span><div><strong>{filtered.length}<small> nights</small></strong><small>IN THIS RANGE</small></div></article><article><span className={styles.summaryIcon}><FiStar aria-hidden="true" /></span><div><strong>{averageRating ? `${averageRating.toFixed(1)} / 5` : "—"}</strong><small>RESTFULNESS RATING</small></div></article><span className={styles.privateBadge}>PRIVATE ON THIS DEVICE</span></section>

        <div className={styles.mainGrid}>
            <section className={styles.journalCard} id="sleep-log" aria-labelledby="log-title"><div className={styles.journalHeading}><div><span className={styles.eyebrow}>A RECORD OF YOUR REST</span><h2 id="log-title">Sleep journal</h2></div><button className={styles.addEntryButton} type="button" onClick={() => { setFormError(""); setIsAdding(true); }}><FiPlus aria-hidden="true" /> Log a night</button></div>
                <div className={styles.filters}><div className={styles.periodFilters}>{[["7d", "7 days"], ["30d", "30 days"], ["all", "All entries"]].map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} className={period === value ? styles.selectedPeriod : ""} onClick={() => setPeriod(value)}>{label}</button>)}</div><label className={styles.search}><FiSearch aria-hidden="true" /><span>Search journal</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your notes" /></label><label className={styles.ratingFilter}><span>Feeling</span><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>{["Any feeling", ...ratingNames].map((value) => <option key={value}>{value}</option>)}</select></label></div>
                <div className={styles.entryList}>{filtered.map((entry, index) => <article className={styles.entryRow} key={entry.id}><div className={`${styles.entryDate} ${index % 2 ? styles.entryDateAlt : ""}`}><span>{entry.date.split("-")[2]}</span><small>{formatDay(entry.date, { month: "short" }).toUpperCase()}</small></div><div className={styles.entryInfo}><h3>{formatDay(entry.date, { weekday: "long", month: "short", day: "numeric" })}</h3><p><FiClock aria-hidden="true" /> {entry.bedtime} <span>to</span> {entry.wake}<i>·</i> {ratingNames[entry.rating - 1]}</p>{entry.note && <small>{entry.note}</small>}</div><div className={styles.durationPill}><strong>{formatDuration(entry.minutes)}</strong><span>sleep window</span></div><div className={styles.stars} aria-label={`${entry.rating} out of 5 restfulness`}><span>{"✦".repeat(entry.rating)}<i>{"✦".repeat(5 - entry.rating)}</i></span></div><button className={styles.deleteButton} type="button" aria-label={`Remove sleep entry from ${formatDay(entry.date)}`} onClick={() => setPendingDelete(entry)}><FiTrash2 aria-hidden="true" /></button></article>)}{filtered.length === 0 && <div className={styles.emptyEntries}><div>☾</div><h3>{entries.length ? "No nights fit those filters." : "A new day starts with rest."}</h3><p>{entries.length ? "Try a wider range or a different search." : "Add a sleep window to begin noticing your own rhythm."}</p>{!entries.length && <button type="button" onClick={() => setIsAdding(true)}><FiPlus aria-hidden="true" /> Log your first night</button>}</div>}</div>
            </section>

            <aside className={styles.rhythmCard} id="rhythm" aria-labelledby="rhythm-title"><div className={styles.rhythmHeading}><span className={styles.targetIcon}><FiTarget aria-hidden="true" /></span><div><span className={styles.eyebrow}>A PERSONAL REFERENCE</span><h2 id="rhythm-title">Your rhythm</h2></div></div><div className={styles.goalTotal}><strong>{averageMinutes ? (averageMinutes / 60).toFixed(1) : "0.0"}<small> hrs</small></strong><span>nightly average</span></div><div className={styles.goalTrack}><i style={{ width: `${Math.min(100, averageMinutes / (goal * 60) * 100)}%` }} /></div><label className={styles.goalInput}>Reference goal<input type="number" min="4" max="12" step="0.5" value={goal} onChange={(event) => setGoal(Math.min(12, Math.max(4, Number(event.target.value) || 4)))} /><span>hours</span></label><div className={styles.chartTitle}><div><h3>Last seven days</h3><p>Each bar is one wake-up date</p></div><small>HOURS</small></div><div className={styles.weekChart} role="img" aria-label="Sleep duration by wake-up date over the last seven days">{days.map((day) => <div className={styles.dayColumn} key={day.date}><span>{day.minutes ? (day.minutes / 60).toFixed(1) : ""}</span><div><i style={{ height: `${Math.min(100, day.minutes / (goal * 60) * 100)}%` }} /></div><small>{day.label}</small></div>)}</div><p className={styles.rhythmNote}>{averageMinutes ? goalDifference > 0 ? `${goalDifference} hours below your reference, on average.` : "At or above your reference, on average." : "Your pattern will take shape as you log a few nights."} This is your personal reference, not a target for everyone.</p></aside>
        </div>

        {isAdding && <div className={styles.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAdding(false); }}><section className={styles.entryModal} role="dialog" aria-modal="true" aria-labelledby="entry-modal-title"><div className={styles.modalHeading}><div><span className={styles.eyebrow}>MAKE A NOTE OF THE NIGHT</span><h2 id="entry-modal-title">How did you rest?</h2></div><button type="button" aria-label="Close" onClick={() => setIsAdding(false)}><FiX aria-hidden="true" /></button></div><form onSubmit={addEntry}><div className={styles.formRow}><label>Wake-up date<input name="date" type="date" defaultValue={today} max={today} required /></label><label>Restfulness<select name="rating" defaultValue="3">{ratingNames.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select></label></div><div className={styles.formRow}><label>Bedtime<input name="bedtime" type="time" defaultValue="22:30" required /></label><label>Wake-up time<input name="wake" type="time" defaultValue="06:30" required /></label></div><label className={styles.noteField}>A note <small>Optional</small><textarea name="note" maxLength="240" placeholder="A thought to set down, or something that helped." /></label>{formError && <p className={styles.formError} role="alert">{formError}</p>}<div className={styles.modalActions}><button type="button" onClick={() => setIsAdding(false)}>Cancel</button><button type="submit"><FiPlus aria-hidden="true" /> Save night</button></div></form></section></div>}
        {pendingDelete && <ConfirmDialog title="Remove this sleep entry?" description={`${formatDuration(pendingDelete.minutes)} and its restfulness note will be removed from your journal.`} confirmLabel="Remove night" onCancel={() => setPendingDelete(null)} onConfirm={removeEntry} />}
    </div>;
};

export default SleepJournal;
