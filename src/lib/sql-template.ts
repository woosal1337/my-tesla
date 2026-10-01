export type Row = Record<string, unknown>;

export type Executor = (text: string, params: unknown[]) => Promise<Row[]>;

class Identifier {
  constructor(readonly name: string) {}
}

export function escapeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""').replace(/\./g, '"."')}"`;
}

function parameter(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value === undefined ? null : value;
}

export class Fragment implements PromiseLike<Row[]> {
  constructor(
    private readonly strings: readonly string[],
    private readonly values: readonly unknown[],
    private readonly run: Executor,
  ) {}

  compile(params: unknown[] = []): string {
    let text = this.strings[0];
    this.values.forEach((value, index) => {
      if (value instanceof Fragment) {
        text += value.compile(params);
      } else if (value instanceof Identifier) {
        text += escapeIdentifier(value.name);
      } else {
        params.push(parameter(value));
        text += `$${params.length}`;
      }
      text += this.strings[index + 1];
    });
    return text;
  }

  then<Fulfilled = Row[], Rejected = never>(
    onFulfilled?: ((rows: Row[]) => Fulfilled | PromiseLike<Fulfilled>) | null,
    onRejected?: ((reason: unknown) => Rejected | PromiseLike<Rejected>) | null,
  ): Promise<Fulfilled | Rejected> {
    const params: unknown[] = [];
    const text = this.compile(params);
    return this.run(text, params).then(onFulfilled, onRejected);
  }

  catch<Rejected = never>(
    onRejected?: ((reason: unknown) => Rejected | PromiseLike<Rejected>) | null,
  ): Promise<Row[] | Rejected> {
    return this.then(undefined, onRejected);
  }
}

export function createSql(run: Executor) {
  function sql(name: string): Identifier;
  function sql(strings: TemplateStringsArray, ...values: unknown[]): Fragment;
  function sql(
    first: string | TemplateStringsArray,
    ...values: unknown[]
  ): Identifier | Fragment {
    if (typeof first === "string") return new Identifier(first);
    return new Fragment(first, values, run);
  }
  return sql;
}
