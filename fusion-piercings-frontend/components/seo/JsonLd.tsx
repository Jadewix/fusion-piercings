// components/seo/JsonLd.tsx
// Renders one or more schema.org objects as a JSON-LD <script>. Server component.

type Json = Record<string, unknown>;

export default function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      // We control `data`; escape "<" so it can't break out of the <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
