import { inflateRawSync } from "node:zlib";

/*
 * Reads the files out of a plain zip archive (stored or deflated), the form
 * the Office of the Law Revision Counsel publishes. A small reader over the
 * central directory is enough, so the law library needs no zip package.
 * ZIP64 and encrypted archives are refused.
 */

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT = 0xffff;
const ZIP64_MARK = 0xffffffff;
const STORED = 0;
const DEFLATED = 8;
const ENCRYPTED_FLAG = 0x1;

interface DirectoryEntry {
  name: string;
  method: number;
  flags: number;
  compressedSize: number;
  size: number;
  localOffset: number;
  /** Where the next directory entry starts. */
  next: number;
}

export function readZip(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = findEndOfDirectory(view);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  if (offset === ZIP64_MARK) throw new Error("zip: ZIP64 archives are not supported");
  const entries: ZipEntry[] = [];
  for (let index = 0; index < count; index++) {
    const entry = directoryEntry(view, bytes, offset);
    if (!entry.name.endsWith("/"))
      entries.push({ name: entry.name, data: entryData(view, bytes, entry) });
    offset = entry.next;
  }
  return entries;
}

// The end record sits last, after a comment of up to 64 KB.
function findEndOfDirectory(view: DataView): number {
  const lowest = Math.max(0, view.byteLength - END_RECORD_SIZE - MAX_COMMENT);
  for (let at = view.byteLength - END_RECORD_SIZE; at >= lowest; at--)
    if (view.getUint32(at, true) === END_OF_DIRECTORY) return at;
  throw new Error("zip: no end of central directory (not a zip file?)");
}

function directoryEntry(view: DataView, bytes: Uint8Array, at: number): DirectoryEntry {
  if (view.getUint32(at, true) !== DIRECTORY_ENTRY) throw new Error("zip: bad central directory");
  const nameLength = view.getUint16(at + 28, true);
  const extraLength = view.getUint16(at + 30, true);
  const commentLength = view.getUint16(at + 32, true);
  const entry = {
    name: new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength)),
    flags: view.getUint16(at + 8, true),
    method: view.getUint16(at + 10, true),
    compressedSize: view.getUint32(at + 20, true),
    size: view.getUint32(at + 24, true),
    localOffset: view.getUint32(at + 42, true),
    next: at + 46 + nameLength + extraLength + commentLength,
  };
  if ([entry.compressedSize, entry.size, entry.localOffset].includes(ZIP64_MARK))
    throw new Error(`zip: ${entry.name} needs ZIP64, which is not supported`);
  return entry;
}

function entryData(view: DataView, bytes: Uint8Array, entry: DirectoryEntry): Uint8Array {
  if (entry.flags & ENCRYPTED_FLAG) throw new Error(`zip: ${entry.name} is encrypted`);
  const at = entry.localOffset;
  if (view.getUint32(at, true) !== LOCAL_HEADER)
    throw new Error(`zip: bad header for ${entry.name}`);
  // The local header's own name and extra lengths can differ from the directory's.
  const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
  const raw = bytes.subarray(start, start + entry.compressedSize);
  const data = inflate(entry, raw);
  if (data.length !== entry.size)
    throw new Error(`zip: ${entry.name} is ${data.length} bytes, the directory says ${entry.size}`);
  return data;
}

function inflate(entry: DirectoryEntry, raw: Uint8Array): Uint8Array {
  if (entry.method === STORED) return raw;
  if (entry.method === DEFLATED) return new Uint8Array(inflateRawSync(raw));
  throw new Error(`zip: ${entry.name} uses compression method ${entry.method}`);
}
