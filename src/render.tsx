import { renderToStaticMarkup } from 'react-dom/server';

export function renderHtml(element: React.ReactElement): string {
  return '<!DOCTYPE html>' + renderToStaticMarkup(element);
}
