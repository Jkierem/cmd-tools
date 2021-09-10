import { normalize, dirname, fromFileUrl } from "https://deno.land/std@0.106.0/path/mod.ts";

export const resolveFolder = (fileUrl: string) => normalize(dirname(fromFileUrl(fileUrl)));