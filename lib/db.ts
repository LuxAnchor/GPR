import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  const query = strings.reduce((acc, str, i) => acc + str + (values[i] ? `$${i}` : ''), '');
  const result = await sql(query, values);
  return result as T[];
}

export async function queryOne<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T | null> {
  const results = await query<T>(strings, ...values);
  return results[0] || null;
}

export { sql };
