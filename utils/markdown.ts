import DOMPurify from 'dompurify';

export function renderMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  
  // 1. Convert simple markdown to HTML
  let html = markdownText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.split('\n').join('<br />');
  
  // 2. Sanitize the HTML before returning it to prevent XSS
  return DOMPurify.sanitize(html);
}
