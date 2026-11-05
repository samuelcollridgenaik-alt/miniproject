import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
const MathAnswerText = React.lazy(() => import("./MathAnswerText.js"));
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];
type MarkdownProps = React.ComponentProps<typeof Markdown>;
// Raw HTML is disabled; react-markdown also filters unsafe link protocols.
export function MarkdownContent({
  text,
  mathRemark = [],
  mathRehype = [],
}: {
  text: string;
  mathRemark?: MarkdownProps["remarkPlugins"];
  mathRehype?: MarkdownProps["rehypePlugins"];
}) {
  return (
    <div className="answer-text">
      <Markdown
        remarkPlugins={[...remarkPlugins, ...(mathRemark ?? [])]}
        rehypePlugins={[...rehypePlugins, ...(mathRehype ?? [])]}
        skipHtml
      >
        {text}
      </Markdown>
    </div>
  );
}
export default function AnswerText({ text }: { text: string }) {
  if (/\$[^$\n]+\$|\$\$/.test(text))
    return (
      <React.Suspense fallback={<MarkdownContent text={text} />}>
        <MathAnswerText text={text} />
      </React.Suspense>
    );
  return <MarkdownContent text={text} />;
}
