import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import type { Order } from '../orders/order.entity';

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    this.transporter = host
      ? createTransport({
          host,
          port: config.get<number>('SMTP_PORT'),
          secure: config.get<boolean>('SMTP_SECURE'),
          auth: user
            ? { user, pass: config.get<string>('SMTP_PASSWORD') }
            : undefined,
        })
      : null;
  }

  async sendPasswordReset(
    to: string,
    fullName: string,
    resetUrl: string,
    ttlMinutes: number,
  ): Promise<void> {
    const subject = 'Restablece tu contraseña de Psico T.O ando';
    const text = [
      `Hola, ${fullName}:`,
      '',
      'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.',
      `Abre este enlace para elegir una nueva (caduca en ${ttlMinutes} minutos):`,
      resetUrl,
      '',
      'Si no lo has pedido tú, puedes ignorar este correo: tu contraseña no cambiará.',
      '',
      'Psico T.O ando · Crecemos en familia',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; color: #16385c; max-width: 520px">
        <h1 style="color: #004956; font-size: 22px">Restablece tu contraseña</h1>
        <p>Hola, ${escapeHtml(fullName)}:</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
          El enlace caduca en ${ttlMinutes} minutos.</p>
        <p><a href="${escapeHtml(resetUrl)}" style="display: inline-block; padding: 12px 22px; border-radius: 100px; background: #008380; color: #fff; font-weight: bold; text-decoration: none">Elegir nueva contraseña</a></p>
        <p style="font-size: 13px">Si no lo has pedido tú, puedes ignorar este correo: tu contraseña no cambiará.</p>
        <p style="font-size: 13px; color: #657170">Psico T.O ando · Crecemos en familia</p>
      </div>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP no configurado. Enlace de restablecimiento para ${to}: ${resetUrl}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject,
      text,
      html,
    });
  }

  /** Confirmación al cliente cuando Wompi aprueba el pago. */
  async sendOrderConfirmation(order: Order): Promise<void> {
    const subject = `Recibimos tu pedido ${order.reference} · Psico T.O ando`;
    const text = [
      `Hola, ${order.customerName}:`,
      '',
      `¡Gracias por tu compra! Tu pago fue aprobado y ya estamos preparando tu pedido ${order.reference}.`,
      '',
      ...orderTextLines(order),
      '',
      `Lo enviaremos a: ${order.shippingAddress}, ${order.shippingCity} (${order.shippingDepartment}).`,
      'Te avisaremos cuando salga. Si tienes preguntas, responde a este correo.',
      '',
      'Psico T.O ando · Crecemos en familia',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; color: #16385c; max-width: 560px">
        <h1 style="color: #004956; font-size: 22px">¡Gracias por tu compra!</h1>
        <p>Hola, ${escapeHtml(order.customerName)}:</p>
        <p>Tu pago fue aprobado y ya estamos preparando tu pedido
          <strong>${escapeHtml(order.reference)}</strong>.</p>
        ${orderHtmlTable(order)}
        <p>Lo enviaremos a: ${escapeHtml(order.shippingAddress)},
          ${escapeHtml(order.shippingCity)} (${escapeHtml(order.shippingDepartment)}).</p>
        <p style="font-size: 13px">Te avisaremos cuando salga. Si tienes preguntas, responde a este correo.</p>
        <p style="font-size: 13px; color: #657170">Psico T.O ando · Crecemos en familia</p>
      </div>`;
    await this.send(order.customerEmail, subject, text, html);
  }

  /** Aviso a la administración de un pedido pagado. */
  async sendNewOrderNotification(to: string, order: Order): Promise<void> {
    const subject = `Nuevo pedido pagado ${order.reference} · ${COP.format(order.totalCop)}`;
    const text = [
      `Nuevo pedido pagado: ${order.reference}`,
      `Cliente: ${order.customerName} · ${order.customerEmail} · ${order.customerPhone}`,
      `Envío: ${order.shippingAddress}, ${order.shippingCity} (${order.shippingDepartment})`,
      '',
      ...orderTextLines(order),
      '',
      'Gestiónalo en el panel: Pedidos.',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; color: #16385c; max-width: 560px">
        <h1 style="color: #004956; font-size: 20px">Nuevo pedido pagado</h1>
        <p><strong>${escapeHtml(order.reference)}</strong></p>
        <p>${escapeHtml(order.customerName)} · ${escapeHtml(order.customerEmail)} · ${escapeHtml(order.customerPhone)}<br>
          ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.shippingCity)} (${escapeHtml(order.shippingDepartment)})</p>
        ${orderHtmlTable(order)}
        <p style="font-size: 13px; color: #657170">Gestiónalo en el panel, sección Pedidos.</p>
      </div>`;
    await this.send(to, subject, text, html);
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP no configurado. Correo no enviado a ${to}: ${subject}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject,
      text,
      html,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function orderTextLines(order: Order): string[] {
  return [
    ...order.items.map(
      (i) =>
        `• ${i.quantity} × ${i.productName}: ${COP.format(i.lineTotalCop)}`,
    ),
    `Subtotal: ${COP.format(order.subtotalCop)}`,
    `Envío: ${order.shippingCop ? COP.format(order.shippingCop) : 'Gratis'}`,
    `Total: ${COP.format(order.totalCop)}`,
  ];
}

function orderHtmlTable(order: Order): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding: 6px 0">${label}</td><td style="padding: 6px 0; text-align: right${strong ? '; font-weight: bold' : ''}">${value}</td></tr>`;
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px">
      ${order.items
        .map((i) =>
          row(
            `${i.quantity} × ${escapeHtml(i.productName)}`,
            COP.format(i.lineTotalCop),
          ),
        )
        .join('')}
      ${row('Subtotal', COP.format(order.subtotalCop))}
      ${row('Envío', order.shippingCop ? COP.format(order.shippingCop) : 'Gratis')}
      ${row('Total', COP.format(order.totalCop), true)}
    </table>`;
}
