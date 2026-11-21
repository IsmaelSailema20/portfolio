export interface ContactMessage {
  name: string;
  subject: string;
  message: string;
}

export function composeMessageBody(contactMessage: ContactMessage): string {
  const message = contactMessage.message.trim();
  const name = contactMessage.name.trim();
  return name ? `${message}\n\n${name}` : message;
}

export function buildMailtoUrl(recipient: string, contactMessage: ContactMessage): string {
  const subject = encodeURIComponent(contactMessage.subject.trim());
  const body = encodeURIComponent(composeMessageBody(contactMessage));
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

function readField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === 'string' ? value : '';
}

export function initializeContactForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-contact-form]')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      window.location.assign(
        buildMailtoUrl(form.dataset.recipient ?? '', {
          name: readField(formData, 'name'),
          subject: readField(formData, 'subject'),
          message: readField(formData, 'message'),
        }),
      );
    });
  }
}
