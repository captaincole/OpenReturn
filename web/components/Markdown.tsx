import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <h1 className="mt-1 mb-3 font-serif text-2xl">{children}</h1>,
        h2: ({ children }) => <h2 className="mt-3 mb-2 font-serif text-xl">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-3 mb-2 text-base font-medium">{children}</h3>,
        strong: ({ children }) => (
          <strong className="font-semibold text-ink-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[0.9em] text-ink-primary">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-bg-elevated p-3 font-mono text-sm">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-border-strong pl-4 text-ink-secondary italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-4 border-border-subtle" />,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-border-strong">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border-subtle">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children, style }) => (
          <th className="px-3 py-2 text-left font-semibold text-ink-primary" style={style}>
            {children}
          </th>
        ),
        td: ({ children, style }) => (
          <td className="px-3 py-2 align-top text-ink-secondary" style={style}>
            {children}
          </td>
        ),
        del: ({ children }) => <del className="text-ink-muted line-through">{children}</del>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
