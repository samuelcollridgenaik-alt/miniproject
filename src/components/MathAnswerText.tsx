import React from "react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MarkdownContent } from "./AnswerText.js";
const mathRemark = [remarkMath];
const mathRehype = [rehypeKatex];
export default function MathAnswerText({ text }: { text: string }) {
  return (
    <MarkdownContent
      text={text}
      mathRemark={mathRemark}
      mathRehype={mathRehype}
    />
  );
}
