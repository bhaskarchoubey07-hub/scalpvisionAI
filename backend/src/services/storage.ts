import { randomUUID } from "node:crypto";

export async function uploadChartBuffer(fileName: string): Promise<string> {
  const id = randomUUID();
  return `https://storage.example.com/scalpvision/${id}-${fileName}`;
}
