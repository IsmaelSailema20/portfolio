const submissionEndpoint = 'https://api.web3forms.com/submit';
const senderLabel = 'Portafolio';

type SubmissionState = 'sending' | 'success' | 'failure';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactSubmission {
  access_key: string;
  from_name: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  botcheck: boolean;
}

export function buildContactSubmission(
  accessKey: string,
  contactMessage: ContactMessage,
  isBot: boolean,
): ContactSubmission {
  return {
    access_key: accessKey,
    from_name: senderLabel,
    name: contactMessage.name.trim(),
    email: contactMessage.email.trim(),
    subject: contactMessage.subject.trim(),
    message: contactMessage.message.trim(),
    botcheck: isBot,
  };
}

export function isSuccessfulSubmission(result: unknown): boolean {
  return typeof result === 'object' && result !== null && 'success' in result && result.success === true;
}

function readField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === 'string' ? value : '';
}

async function sendSubmission(submission: ContactSubmission): Promise<boolean> {
  try {
    const response = await fetch(submissionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(submission),
    });
    return isSuccessfulSubmission(await response.json());
  } catch {
    return false;
  }
}

function showSubmissionState(form: HTMLFormElement, state: SubmissionState): void {
  const status = form.querySelector<HTMLElement>('[data-contact-status]');
  if (status) {
    status.textContent = form.dataset[`${state}Message`] ?? '';
    status.dataset.state = state;
  }
}

async function submitContactForm(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);
  const submitButton = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const submission = buildContactSubmission(
    form.dataset.accessKey ?? '',
    {
      name: readField(formData, 'name'),
      email: readField(formData, 'email'),
      subject: readField(formData, 'subject'),
      message: readField(formData, 'message'),
    },
    formData.has('botcheck'),
  );

  if (submitButton) {
    submitButton.disabled = true;
  }
  showSubmissionState(form, 'sending');
  const isSent = await sendSubmission(submission);
  showSubmissionState(form, isSent ? 'success' : 'failure');
  if (isSent) {
    form.reset();
  }
  if (submitButton) {
    submitButton.disabled = false;
  }
}

export function initializeContactForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-contact-form]')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void submitContactForm(form);
    });
  }
}
