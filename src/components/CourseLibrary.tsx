"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import AttemptBadge from "./AttemptBadge";
import type { CatalogCourse } from "@/lib/types";
import { courseStudyGuidesHref, studyGuideHref } from "@/lib/study-guides";

type Tab = "mock-exams" | "study-guides";
const tabs: Tab[] = ["mock-exams", "study-guides"];

function navigateTabs(event: KeyboardEvent<HTMLAnchorElement>, selected: Tab) {
  let index = tabs.indexOf(selected);
  if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") index = (index + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = tabs.length - 1;
  else if (event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
    return;
  } else return;
  event.preventDefault();
  const target = document.getElementById(`tab-${tabs[index]}`);
  target?.focus();
  target?.click();
}

export function CourseLibraryContent({ course, selected = "mock-exams" }: { course: CatalogCourse; selected?: Tab }) {
  return (
    <>
      <div className="course-tabs" role="tablist" aria-label="Course library">
        {tabs.map((tab) => (
          <Link key={tab} id={`tab-${tab}`} role="tab" aria-selected={selected === tab}
            aria-controls={`panel-${tab}`} tabIndex={selected === tab ? 0 : -1}
            className="course-tabs__tab" scroll={false}
            href={tab === "study-guides" ? courseStudyGuidesHref(course.id) : `/courses/${course.id}/`}
            onKeyDown={(event) => navigateTabs(event, tab)}>
            {tab === "mock-exams" ? "Mock exams" : "Study guides"}
            <span className="course-tabs__count">{tab === "mock-exams" ? course.assessments.length : course.studyGuides.length}</span>
          </Link>
        ))}
      </div>
      <div role="tabpanel" id="panel-mock-exams" aria-labelledby="tab-mock-exams" hidden={selected !== "mock-exams"} tabIndex={0}>
        {selected === "mock-exams" && <ul className="cards" role="list">
          {course.assessments.map((a) => (
            <li key={a.id}>
              <Link className="card" href={`/courses/${course.id}/${a.id}`}>
                <span className="card__title card__title--lg">{a.title}</span>
                {a.examLabel && <span className="card__label">{a.examLabel}</span>}
                {a.topic && <span className="card__topic">{a.topic}</span>}
                <span className="card__meta">
                  {a.questionCount} questions
                  {a.examTimerMinutes ? <> · {a.examTimerMinutes}-minute exam timer</> : null}
                </span>
                <AttemptBadge bankId={a.bankId} total={a.questionCount} />
              </Link>
            </li>
          ))}
        </ul>}
      </div>
      <div role="tabpanel" id="panel-study-guides" aria-labelledby="tab-study-guides" hidden={selected !== "study-guides"} tabIndex={0}>
        {selected === "study-guides" && (course.studyGuides.length ? (
          <ul className="cards" role="list">
            {course.studyGuides.map((guide) => <li key={guide.id}>
              <Link className="card" href={studyGuideHref(course.id, guide.id)}>
                <span className="card__title card__title--lg">{guide.title}</span>
                <span className="card__topic">{guide.description}</span>
              </Link>
            </li>)}
          </ul>
        ) : <p className="library-empty panel">No study guides yet.</p>)}
      </div>
    </>
  );
}

export default function CourseLibrary({ course }: { course: CatalogCourse }) {
  const searchParams = useSearchParams();
  return <CourseLibraryContent course={course} selected={searchParams.get("tab") === "study-guides" ? "study-guides" : "mock-exams"} />;
}
