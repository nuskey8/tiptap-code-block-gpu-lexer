import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { parse } from "gpu-lexer";
import CodeBlockGpuLexer from "../src/index.ts";
import "./style.css";

const element = document.querySelector<HTMLElement>("#editor")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle-code")!;

const editor = new Editor({
  element,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockGpuLexer.configure({
      enableTabIndentation: true,
      tabSize: 2,
      async parse(code) {
        const spans = await parse(code);
        return spans;
      },
      onError(error) {
        console.error("gpu-lexer highlighting failed", error);
      },
    }),
  ],
  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "That’s a boring paragraph followed by a fenced code block:" },
        ],
      },
      {
        type: "codeBlock",
        attrs: { language: "javascript" },
        content: [
          {
            type: "text",
            text: 'for (var i=1; i <= 20; i++)\n{\n  if (i % 15 == 0)\n    console.log("FizzBuzz");\n  else if (i % 3 == 0)\n    console.log("Fizz");\n  else if (i % 5 == 0)\n    console.log("Buzz");\n  else\n    console.log(i);\n}',
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Press Command/Ctrl + Enter to leave the fenced code block and continue typing in boring paragraphs.",
          },
        ],
      },
    ],
  },
  onTransaction({ editor: current }) {
    toggle.setAttribute("aria-pressed", String(current.isActive("codeBlock")));
  },
});

toggle.addEventListener("click", () => {
  editor.chain().focus().toggleCodeBlock().run();
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => editor.destroy());
}
