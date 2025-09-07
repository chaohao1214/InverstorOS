import fs from "node:fs/promises";
import pdfParse from "pdf-parse";
/**
 * Parse a PDF file from disk and return text.
 * @param {Object} options
 * @param {string} options.filePath - Local filesystem path of the PDF
 * @param {boolean} [options.splitByPages=true] - Whether to return per-page text blocks
 * @returns {Promise<Object>} Parsed PDF text
 */

export async function pdfParsePath({ filePath, splitByPages = true }) {
  const fileBuffer = await fs.readFile(filePath);
  const parsedData = await pdfParse(fileBuffer);

  if (!splitByPages) return { text: parsedData.text };

  // Split by form-feed characters and map into structured pages
  const pages = String(parsedData.text)
    .split("\f")
    .map((pageText, pageIndex) => ({
      page: pageIndex + 1,
      text: pageText.trim(),
    }))
    .filter((page) => page.text.length > 0);

  return { pages };
}
