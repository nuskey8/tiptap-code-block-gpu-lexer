# tiptap-code-block-gpu-lexer

[![npm version](https://img.shields.io/npm/v/tiptap-code-block-gpu-lexer)](https://www.npmjs.com/package/tiptap-code-block-gpu-lexer)

[Example](https://nuskey8.github.io/tiptap-code-block-gpu-lexer/)

Tiptap 3 CodeBlock extension with syntax highlighting powered by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer). Standard CodeBlock commands, keyboard shortcuts, fenced-code input rules, language attributes, and paste handling are inherited from `@tiptap/extension-code-block`.

## Requirements

- Tiptap 3 with `@tiptap/core`, `@tiptap/pm`, and `@tiptap/extension-code-block`
- A browser with WebGPU support and an available GPU adapter.

## Installation

```sh
npm add tiptap-code-block-gpu-lexer
```

## Usage

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockGpuLexer from "tiptap-code-block-gpu-lexer";

const editor = new Editor({
  element: document.querySelector("#editor"),
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockGpuLexer.configure({
      enableTabIndentation: true,
      onError: (error) => console.warn("Highlighting unavailable", error),
    }),
  ],
});
```

Use this extension once in place of CodeBlock or CodeBlockLowlight.

## Styling

Add token styles to your application's stylesheet:

```css
.hljs-comment {
  color: #6a737d;
}

.hljs-string {
  color: #22863a;
}

.hljs-number,
.hljs-variable.constant_ {
  color: #005cc5;
}

.hljs-keyword,
.hljs-operator {
  color: #d73a49;
}

.hljs-type,
.hljs-title.function_ {
  color: #6f42c1;
}
```

## License

This library is released under the [MIT License](LICENSE).
