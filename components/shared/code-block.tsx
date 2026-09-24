export function CodeBlock({
  code,
  language = "javascript",
  filename,
}: {
  code: string
  language?: string
  filename?: string
}) {
  return (
    <div className="code-block">
      <div>
        {filename ?? "Code snippet"}
        <span>{language}</span>
      </div>
      <pre tabIndex={0}>
        <code>
          {code
            .split(
              /(\b(?:const|let|var|return|function|if|for|new|await|async)\b|"[^"\n]*"|'[^'\n]*'|\b\d+\b)/g
            )
            .map((token, i) => (
              <span
                key={i}
                className={
                  /^(const|let|var|return|function|if|for|new|await|async)$/.test(
                    token
                  )
                    ? "code-keyword"
                    : /^["'0-9]/.test(token)
                      ? "code-value"
                      : undefined
                }
              >
                {token}
              </span>
            ))}
        </code>
      </pre>
    </div>
  )
}
