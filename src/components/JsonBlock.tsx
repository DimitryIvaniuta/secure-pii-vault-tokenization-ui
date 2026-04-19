interface JsonBlockProps {
  data: unknown;
}

export function JsonBlock({ data }: JsonBlockProps) {
  return <pre className="json-block">{JSON.stringify(data, null, 2)}</pre>;
}
