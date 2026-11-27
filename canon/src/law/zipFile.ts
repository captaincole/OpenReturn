import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

/*
 * Reads named files out of a large zip on disk, without loading the whole
 * archive. California's session archive is over 1 GB with about 200,000
 * files, so it needs ZIP64 (more than 65,535 entries). unzip.ts stays the
 * reader for the small zips that law.db stores. Stored or deflated
 * entries only; encrypted ones are refused.
 */

export interface ZipFile {
  names(): string[];
  /** The file's bytes; throws when the archive has no such file. */
  read(name: string): Uint8Array;
  /** The file's date as the archive records it: "2026-11-22". */
  dateOf(name: string): string;
  close(): void;
}

interface CentralEntry {
  method: number;
  flags: number;
  compressedSize: number;
  size: number;
  localOffset: number;
  dosDate: number;
}

const END_OF_DIRECTORY = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_END = 0x06064b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const END_RECORD_SIZE = 22;
const LOCATOR_SIZE = 20;
const MAX_COMMENT = 0xffff;
const MARK_32 = 0xffffffff;
const ZIP64_EXTRA = 0x0001;
const STORED = 0;
const DEFLATED = 8;
const ENCRYPTED_FLAG = 0x1;
const LOCAL_HEADER_SIZE = 30;

export function openZipFile(path: string): ZipFile {
  const fd = openSync(path, "r");
  try {
    const entries = readDirectory(fd);
    return {
      names: () => [...entries.keys()],
      read: (name) => readEntry(fd, name, entries.get(name)),
      dateOf: (name) => dosDateText(requireEntry(name, entries.get(name)).dosDate),
      close: () => closeSync(fd),
    };
  } catch (err) {
    closeSync(fd);
    throw err;
  }
}

function readAt(fd: number, position: number, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const got = readSync(fd, bytes, 0, length, position);
  if (got !== length) throw new Error("zip: the file ends early");
  return bytes;
}

const viewOf = (bytes: Uint8Array) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

interface Directory {
  offset: number;
  count: number;
  size: number;
}

function findDirectory(fd: number): Directory {
  const { size } = fstatSync(fd);
  const tailLength = Math.min(size, END_RECORD_SIZE + MAX_COMMENT + LOCATOR_SIZE);
  const tailStart = size - tailLength;
  const tail = viewOf(readAt(fd, tailStart, tailLength));
  let end = -1;
  for (let at = tailLength - END_RECORD_SIZE; at >= 0 && end < 0; at--)
    if (tail.getUint32(at, true) === END_OF_DIRECTORY) end = at;
  if (end < 0) throw new Error("zip: no end of central directory (not a zip file?)");
  const plain = {
    count: tail.getUint16(end + 10, true),
    size: tail.getUint32(end + 12, true),
    offset: tail.getUint32(end + 16, true),
  };
  const locator = end - LOCATOR_SIZE;
  const zip64 = locator >= 0 && tail.getUint32(locator, true) === ZIP64_LOCATOR;
  if (!zip64) return plain;
  const recordAt = Number(tail.getBigUint64(locator + 8, true));
  const record = viewOf(readAt(fd, recordAt, 56));
  if (record.getUint32(0, true) !== ZIP64_END) throw new Error("zip: bad ZIP64 end record");
  return {
    count: Number(record.getBigUint64(32, true)),
    size: Number(record.getBigUint64(40, true)),
    offset: Number(record.getBigUint64(48, true)),
  };
}

function readDirectory(fd: number): Map<string, CentralEntry> {
  const { offset, count, size } = findDirectory(fd);
  const bytes = readAt(fd, offset, size);
  const view = viewOf(bytes);
  const entries = new Map<string, CentralEntry>();
  let at = 0;
  for (let index = 0; index < count; index++) {
    if (view.getUint32(at, true) !== DIRECTORY_ENTRY) throw new Error("zip: bad central directory");
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const extra = bytes.subarray(at + 46 + nameLength, at + 46 + nameLength + extraLength);
    if (!name.endsWith("/")) entries.set(name, centralEntry(view, at, extra));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function centralEntry(view: DataView, at: number, extra: Uint8Array): CentralEntry {
  const sizes = {
    size: view.getUint32(at + 24, true),
    compressedSize: view.getUint32(at + 20, true),
    localOffset: view.getUint32(at + 42, true),
  };
  return {
    flags: view.getUint16(at + 8, true),
    method: view.getUint16(at + 10, true),
    dosDate: view.getUint16(at + 14, true),
    ...withZip64Sizes(sizes, extra),
  };
}

type Sizes = Pick<CentralEntry, "size" | "compressedSize" | "localOffset">;

// A field set to 0xffffffff has its real value in the ZIP64 extra field, in this order.
function withZip64Sizes(sizes: Sizes, extra: Uint8Array): Sizes {
  const marked = (["size", "compressedSize", "localOffset"] as const).filter(
    (key) => sizes[key] === MARK_32,
  );
  if (marked.length === 0) return sizes;
  const view = viewOf(extra);
  for (let at = 0; at + 4 <= extra.length; at += 4 + view.getUint16(at + 2, true)) {
    if (view.getUint16(at, true) !== ZIP64_EXTRA) continue;
    const out = { ...sizes };
    marked.forEach((key, i) => (out[key] = Number(view.getBigUint64(at + 4 + 8 * i, true))));
    return out;
  }
  throw new Error("zip: an entry needs ZIP64 sizes, and has none");
}

function requireEntry(name: string, entry: CentralEntry | undefined): CentralEntry {
  if (!entry) throw new Error(`zip: the archive has no ${name}`);
  return entry;
}

function readEntry(fd: number, name: string, found: CentralEntry | undefined): Uint8Array {
  const entry = requireEntry(name, found);
  if (entry.flags & ENCRYPTED_FLAG) throw new Error(`zip: ${name} is encrypted`);
  const header = viewOf(readAt(fd, entry.localOffset, LOCAL_HEADER_SIZE));
  if (header.getUint32(0, true) !== LOCAL_HEADER) throw new Error(`zip: bad header for ${name}`);
  const start =
    entry.localOffset + LOCAL_HEADER_SIZE + header.getUint16(26, true) + header.getUint16(28, true);
  const raw = readAt(fd, start, entry.compressedSize);
  const data = entry.method === STORED ? raw : inflated(name, entry.method, raw);
  if (data.length !== entry.size)
    throw new Error(`zip: ${name} is ${data.length} bytes, the directory says ${entry.size}`);
  return data;
}

function inflated(name: string, method: number, raw: Uint8Array): Uint8Array {
  if (method !== DEFLATED) throw new Error(`zip: ${name} uses compression method ${method}`);
  return new Uint8Array(inflateRawSync(raw));
}

/** A DOS date: bits 9–15 the year after 1980, 5–8 the month, 0–4 the day. */
function dosDateText(dosDate: number): string {
  const year = 1980 + (dosDate >> 9);
  const month = (dosDate >> 5) & 0xf;
  const day = dosDate & 0x1f;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
