import CodeBlock, { type CodeBlockOptions } from "@tiptap/extension-code-block";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { parse } from "gpu-lexer";

export type SyntaxSpan = Awaited<ReturnType<typeof parse>>[number];

export interface CodeBlockGpuLexerOptions extends CodeBlockOptions {
  /** Override the parser, for example with gpu-lexer/lite. */
  parse: (code: string) => Promise<readonly SyntaxSpan[]>;
  /** Prefix for token CSS classes. */
  classPrefix: string;
  /** Called when parsing fails. The code block remains editable. */
  onError: (error: unknown) => void;
}

const highlightKey = new PluginKey<DecorationSet>("codeBlockGpuLexer");

export const CodeBlockGpuLexer = CodeBlock.extend<CodeBlockGpuLexerOptions>({
  addOptions() {
    return {
      ...this.parent!(),
      parse,
      classPrefix: "hljs-",
      onError: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { parse: parser, classPrefix, onError } = this.options;
    const nodeName = this.name;

    return [
      ...(this.parent?.() ?? []),
      new Plugin<DecorationSet>({
        key: highlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, decorations) {
            const result = transaction.getMeta(highlightKey) as
              | { doc: ProseMirrorNode; decorations: DecorationSet }
              | undefined;
            if (result?.doc === transaction.doc) return result.decorations;

            return transaction.docChanged ? DecorationSet.empty : decorations;
          },
        },
        props: {
          decorations: (state) => highlightKey.getState(state),
        },
        view(view) {
          let destroyed = false;
          let generation = 0;
          // Retain only sources present in the current document, including pending work.
          let cache = new Map<string, Promise<readonly SyntaxSpan[]>>();

          const highlight = async () => {
            const currentGeneration = ++generation;
            const doc = view.state.doc;
            const blocks: { pos: number; code: string }[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name !== nodeName) return;
              if (node.textContent) blocks.push({ pos, code: node.textContent });
              return false;
            });

            const nextCache = new Map<string, Promise<readonly SyntaxSpan[]>>();
            for (const { code } of blocks) {
              if (nextCache.has(code)) continue;
              nextCache.set(
                code,
                cache.get(code) ??
                  Promise.resolve()
                    .then(() => parser(code))
                    .catch((error: unknown) => {
                      if (!destroyed) onError(error);
                      return [];
                    }),
              );
            }
            cache = nextCache;

            const spans = await Promise.all(blocks.map(({ code }) => nextCache.get(code)!));
            if (destroyed || currentGeneration !== generation || view.state.doc !== doc) return;

            const decorations: Decoration[] = [];
            blocks.forEach(({ pos, code }, index) => {
              for (const span of spans[index]!) {
                if (
                  span.type === "plain" ||
                  !Number.isInteger(span.start) ||
                  !Number.isInteger(span.end) ||
                  span.start < 0 ||
                  span.end > code.length ||
                  span.start >= span.end
                )
                  continue;
                decorations.push(
                  Decoration.inline(pos + 1 + span.start, pos + 1 + span.end, {
                    class:
                      span.type === "function"
                        ? `${classPrefix}title function_`
                        : span.type === "constant"
                          ? `${classPrefix}variable constant_`
                          : `${classPrefix}${span.type}`,
                  }),
                );
              }
            });

            view.dispatch(
              view.state.tr
                .setMeta(highlightKey, {
                  doc,
                  decorations: DecorationSet.create(doc, decorations),
                })
                .setMeta("addToHistory", false),
            );
          };

          const schedule = () => {
            void highlight().catch((error: unknown) => {
              if (!destroyed) onError(error);
            });
          };
          schedule();

          return {
            update(nextView, previousState) {
              if (nextView.state.doc !== previousState.doc) schedule();
            },
            destroy() {
              destroyed = true;
              generation++;
              cache.clear();
            },
          };
        },
      }),
    ];
  },
});

export default CodeBlockGpuLexer;
