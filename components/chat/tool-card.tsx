type ToolLike = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function ToolCard({ part }: { part: ToolLike }) {
  const name = part.type.replace(/^tool-/, "");
  const input = asRecord(part.input);
  const output = asRecord(part.output);
  const pending = part.state !== "output-available" && part.state !== "output-error";

  return (
    <div className="my-2 rounded-2xl border border-border bg-card px-3 py-3 text-sm">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{name}</p>
      {part.state === "output-error" ? (
        <p className="mt-1 text-destructive">{part.errorText ?? "Tool failed"}</p>
      ) : pending ? (
        <p className="mt-1 text-muted-foreground">Running…</p>
      ) : name === "weather" ? (
        <div className="mt-1">
          {output.found === false ? (
            <p>No forecast for {String(input.location ?? "that place")}.</p>
          ) : (
            <>
              <p className="font-heading text-2xl">
                {output.temperatureC == null ? "—" : String(output.temperatureC)}°C · {String(output.conditions ?? "")}
              </p>
              <p className="text-muted-foreground">
                {String(output.location ?? input.location ?? "")}
                {output.windKph != null ? ` · wind ${String(output.windKph)} km/h` : ""}
              </p>
            </>
          )}
        </div>
      ) : name === "calculator" ? (
        <p className="mt-1 font-mono">
          {String(output.expression ?? input.expression ?? "")} = {String(output.value ?? "")}
        </p>
      ) : name === "webFetch" ? (
        <div className="mt-1 space-y-1">
          <p className="truncate text-xs text-muted-foreground">{String(output.url ?? input.url ?? "")}</p>
          <p className="line-clamp-6 leading-6">{String(output.error ?? output.text ?? "")}</p>
        </div>
      ) : name === "searchKnowledge" ? (
        <ul className="mt-2 space-y-2">
          {Array.isArray(output.sources) && output.sources.length > 0 ? (
            (output.sources as Array<Record<string, unknown>>).map((source) => (
              <li key={String(source.index)} className="rounded-xl bg-muted/70 px-3 py-2">
                <p className="text-xs text-primary">
                  [{String(source.index)}] {String(source.documentName)} · {Number(source.score).toFixed(2)}
                </p>
                <p className="mt-1 leading-6">{String(source.excerpt)}</p>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No matching passages.</li>
          )}
        </ul>
      ) : (
        <pre className="mt-1 overflow-x-auto text-xs">{JSON.stringify(output, null, 2)}</pre>
      )}
    </div>
  );
}
