// Anything from the database or the catalog goes through this before it reaches the
// page, so a name can never be read as markup.
export function escapeForPage(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
