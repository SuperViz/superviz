import { TemplateResult } from 'lit';

export type ModalOptions = {
  title: string;
  confirm?: boolean;
  cancel?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  body: TemplateResult<1>;
  footer?: TemplateResult<1>;
};
