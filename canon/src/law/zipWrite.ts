import { crc32, deflateRawSync } from "node:zlib";
import type { ZipEntry } from "./unzip";

/*
 * Writes a plain zip (deflated entries) that unzip.ts reads back. Law.db
 * stores one source blob per document; a document published in several
 * files (the regulations, one per CFR part) stores them as one zip. Every
 * entry has the same fixed date, so the same files make the same bytes.
 */

const LOCAL_HEADER = 0x04034b50;
const DIRECTORY_ENTRY = 0x02014b50;
const END_OF_DIRECTORY = 0x06054b50;
const DEFLATED = 8;
const VERSION = 20;
const UTF8_NAMES = 0x0800;
/** 1980-01-01 00:00, the zip format's first date. */
const DOS_DATE = (0 << 9) | (1 << 5) | 1;
const DOS_TIME = 0;
const ZIP32_LIMIT = 0xffffffff;

interface Packed {
  name: Uint8Array;
  data: Uint8Array;
  crc: number;
  size: number;
  offset: number;
}

export function writeZip(entries: ZipEntry[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const packed = entries.map((entry): Packed => {
    const name = new TextEncoder().encode(entry.name);
    const data = new Uint8Array(deflateRawSync(entry.data));
    const item = { name, data, crc: crc32(entry.data), size: entry.data.length, offset };
    const header = localHeader(item);
    chunks.push(header, data);
    offset += header.length + data.length;
    return item;
  });
  if (offset > ZIP32_LIMIT) throw new Error("zip: archive needs ZIP64, which is not supported");
  const directory = packed.map(directoryEntry);
  const directorySize = directory.reduce((total, entry) => total + entry.length, 0);
  chunks.push(...directory, endRecord(packed.length, directorySize, offset));
  return concat(chunks);
}

/** The fields a local header and a directory entry share, from "version needed" on. */
function common(view: DataView, at: number, item: Packed): void {
  view.setUint16(at, VERSION, true);
  view.setUint16(at + 2, UTF8_NAMES, true);
  view.setUint16(at + 4, DEFLATED, true);
  view.setUint16(at + 6, DOS_TIME, true);
  view.setUint16(at + 8, DOS_DATE, true);
  view.setUint32(at + 10, item.crc, true);
  view.setUint32(at + 14, item.data.length, true);
  view.setUint32(at + 18, item.size, true);
  view.setUint16(at + 22, item.name.length, true);
}

function localHeader(item: Packed): Uint8Array {
  const bytes = new Uint8Array(30 + item.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, LOCAL_HEADER, true);
  common(view, 4, item);
  bytes.set(item.name, 30);
  return bytes;
}

function directoryEntry(item: Packed): Uint8Array {
  const bytes = new Uint8Array(46 + item.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, DIRECTORY_ENTRY, true);
  view.setUint16(4, VERSION, true);
  common(view, 6, item);
  view.setUint32(42, item.offset, true);
  bytes.set(item.name, 46);
  return bytes;
}

function endRecord(count: number, directorySize: number, directoryOffset: number): Uint8Array {
  const bytes = new Uint8Array(22);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, END_OF_DIRECTORY, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, directorySize, true);
  view.setUint32(16, directoryOffset, true);
  return bytes;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
