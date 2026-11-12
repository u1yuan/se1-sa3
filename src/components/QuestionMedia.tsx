import type { Question } from "@/lib/types";

/** Exhibits and code blocks attached to a question. Plain <img>: files are small static JPEGs. */
export default function QuestionMedia({ question }: { question: Question }) {
  return (
    <>
      {question.exhibits?.map((ex, i) => (
        <figure key={ex.src} className="exhibit">
          <figcaption className="exhibit__cap">Exhibit{question.exhibits!.length > 1 ? ` ${i + 1}` : ""}</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ex.src} alt={ex.alt} width={ex.width} height={ex.height} loading="eager" decoding="async" />
        </figure>
      ))}
      {question.code && question.code.length > 0 && (
        <pre className="codeblock" aria-label="Code">
          <code>{question.code.join("\n")}</code>
        </pre>
      )}
    </>
  );
}
