import { connection } from "next/server";
import { database } from "@/lib/database";
import { checkHealth } from "@/lib/health";

export async function GET() {
  await connection();
  const { httpStatus, body } = await checkHealth(() => database()`select 1`);
  return Response.json(body, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
