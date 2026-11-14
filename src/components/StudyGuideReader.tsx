"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CatalogCourse, CatalogStudyGuide } from "@/lib/types";
import { courseStudyGuidesHref, findStudyGuide, studyGuideArtifactUrl, studyGuideHref } from "@/lib/study-guides";

type ReaderCourse = Pick<CatalogCourse, "id" | "code" | "studyGuides">;
type ArtifactState = { status: "loading" } | { status: "error" } | { status: "ready"; html: string };

function GuideArtifact({ guide, onRetry }: { guide: CatalogStudyGuide; onRetry: () => void }) {
  const [state, setState] = useState<ArtifactState>({ status: "loading" });
  const [rendered, setRendered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    timeout.current = setTimeout(() => {
      controller.abort();
      setState({ status: "error" });
    }, 20_000);
    async function load() {
      try {
        const response = await fetch(studyGuideArtifactUrl(guide.artifactPath), {
          signal: controller.signal, credentials: "omit", redirect: "error",
        });
        if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error("HTML unavailable");
        const html = await response.text();
        if (!html.trim()) throw new Error("HTML empty");
        if (!disposed && !controller.signal.aborted) setState({ status: "ready", html });
      } catch {
        if (!disposed) {
          clearTimeout(timeout.current);
          setState({ status: "error" });
        }
      }
    }
    void load();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timeout.current);
    };
  }, [guide.artifactPath]);

  if (state.status === "error") return <div className="reader-state" role="alert">
    <h2>Couldn’t load this study guide.</h2>
    <p>Check your connection, then try again.</p>
    <button className="btn btn--primary" onClick={onRetry}>Retry</button>
  </div>;

  return <>
    {(!rendered || state.status === "loading") && <div className="reader-state reader-state--loading" role="status">Loading study guide…</div>}
    {state.status === "ready" && <iframe className="reader-artifact" title={guide.title}
      sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={state.html}
      onLoad={() => { clearTimeout(timeout.current); setRendered(true); }} />}
  </>;
}

function GuideList({ course, selectedId, onSelect }: { course: ReaderCourse; selectedId: string | null; onSelect: () => void }) {
  return <nav aria-label={`${course.code} study guides`}>
    <h2 className="reader-sidebar__heading">{course.code} · Study guides ({course.studyGuides.length})</h2>
    {course.studyGuides.length ? <ul className="reader-sidebar__list" role="list">
      {course.studyGuides.map((guide) => <li key={guide.id}>
        <Link className="reader-sidebar__link" href={studyGuideHref(course.id, guide.id)}
          aria-current={guide.id === selectedId ? "page" : undefined} onClick={onSelect} scroll={false}>
          {guide.title}
        </Link>
      </li>)}
    </ul> : <p className="reader-sidebar__empty">No study guides yet.</p>}
  </nav>;
}

export default function StudyGuideReader({ course }: { course: ReaderCourse }) {
  const selectedId = useSearchParams().get("guide");
  const guide = selectedId ? findStudyGuide(course, selectedId) : undefined;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (mobile && sidebarOpen && !element.open) element.showModal();
    else if ((!mobile || !sidebarOpen) && element.open) element.close();
  }, [mobile, sidebarOpen]);

  function closeSidebar() {
    dialog.current?.close();
    setSidebarOpen(false);
    toggle.current?.focus();
  }

  const list = <GuideList course={course} selectedId={selectedId} onSelect={() => { if (mobile) closeSidebar(); }} />;
  return <div className="guide-reader">
    <header className="reader-toolbar">
      <button className="btn reader-toolbar__toggle" ref={toggle} aria-label={sidebarOpen ? "Hide guide sidebar" : "Show guide sidebar"}
        aria-expanded={sidebarOpen} aria-controls={mobile ? "guide-drawer" : "guide-sidebar"} onClick={() => setSidebarOpen((open) => !open)}>
        <span aria-hidden="true">☰</span>
      </button>
      <span className="reader-toolbar__course">{course.code}</span>
      <h1 className="reader-toolbar__title">{guide?.title ?? "Study guides"}</h1>
      <Link className="reader-toolbar__back" href={courseStudyGuidesHref(course.id)}>← Back to study guides</Link>
    </header>
    <div className="reader-body">
      <aside id="guide-sidebar" className="reader-sidebar" hidden={!sidebarOpen || mobile}>
        {list}
      </aside>
      <dialog ref={dialog} id="guide-drawer" className="reader-drawer" aria-label={`${course.code} study guides`}
        onCancel={(event) => { event.preventDefault(); closeSidebar(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeSidebar(); }}>
        <div className="reader-drawer__panel">
          <button className="btn reader-drawer__close" onClick={closeSidebar}>Close sidebar</button>
          {list}
        </div>
      </dialog>
      <main className="reader-main" aria-label="Study guide">
        {guide ? <GuideArtifact key={`${guide.id}:${retry}`} guide={guide} onRetry={() => setRetry((value) => value + 1)} /> : (
          <div className="reader-state">
            <h2>{selectedId ? "Study guide not found." : course.studyGuides.length ? "Choose a study guide." : "No study guides yet."}</h2>
            <p>{selectedId ? "This guide isn’t in this course’s library." : course.studyGuides.length ? "Open the sidebar to browse this course’s guides." : "This course’s library is ready for future guides."}</p>
            {course.studyGuides.length > 0 && <button className="btn" onClick={() => setSidebarOpen(true)}>Browse guides</button>}
            <Link href={courseStudyGuidesHref(course.id)}>Back to study guides</Link>
          </div>
        )}
      </main>
    </div>
  </div>;
}
