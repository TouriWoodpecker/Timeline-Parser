export function renderMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  
  // Using a simple replace for bold. More complex markdown would need a proper library.
  // The global flag ensures all instances are replaced.
  let html = markdownText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace newlines with <br> tags for proper HTML line breaks.
  return html.split('\n').join('<br />');
}