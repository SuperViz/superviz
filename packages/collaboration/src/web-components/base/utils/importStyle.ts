export default function importStyle(componentName: string) {
  const commentsStyles = document.getElementById(`superviz-${componentName}-styles`);
  if (!commentsStyles) return;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(commentsStyles.textContent);
  this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sheet];
}
