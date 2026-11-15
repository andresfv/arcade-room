"use server";

import { Resend } from "resend";

export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string } // name ya recortado
  | { status: "error"; message: string; fields: ContactFields };

const CONTACT_TO = "andresfallasv@gmail.com";
const CONTACT_FROM = "Arcade Room <onboarding@resend.dev>";

const NAME_MAX = 80;
const MSG_MAX = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SEND_ERROR = "[ERROR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO.";
const fieldError = (what: string) => `[ERROR] REVISA LOS CAMPOS: ${what}`;

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Devuelve el mensaje de error del primer campo que falle, o null si todo es válido. */
function validate({ name, email, msg }: ContactFields): string | null {
  if (!name) return fieldError("NOMBRE VACÍO.");
  if (name.length > NAME_MAX) return fieldError(`NOMBRE DEMASIADO LARGO (MÁX. ${NAME_MAX}).`);
  if (!EMAIL_RE.test(email)) return fieldError("CORREO NO VÁLIDO.");
  if (!msg) return fieldError("MENSAJE VACÍO.");
  if (msg.length > MSG_MAX) return fieldError(`MENSAJE DEMASIADO LARGO (MÁX. ${MSG_MAX}).`);
  return null;
}

/** Server Action del formulario de contacto de /acerca: valida y envía el mensaje con Resend. */
export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Lo escrito tal cual, para devolverlo al formulario si hay error.
  const fields: ContactFields = {
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    msg: readField(formData, "msg"),
  };
  const name = fields.name.trim();
  const email = fields.email.trim();
  const msg = fields.msg.trim();

  // Honeypot: fingir éxito para no dar señal al bot.
  if (readField(formData, "website")) return { status: "success", name };

  const invalid = validate({ name, email, msg });
  if (invalid) return { status: "error", message: invalid, fields };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contacto] Falta RESEND_API_KEY: no se envía el mensaje.");
    return { status: "error", message: SEND_ERROR, fields };
  }

  // Sin saltos de línea en el asunto.
  const subjectName = name.replace(/[\r\n]+/g, " ");

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `[Arcade Room] Mensaje de ${subjectName}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}\n`,
      html: [
        `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>`,
        `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
        `<p><strong>Mensaje:</strong></p>`,
        `<p style="white-space: pre-wrap">${escapeHtml(msg)}</p>`,
      ].join("\n"),
    });

    if (error) {
      console.error("[contacto] Resend devolvió un error:", error);
      return { status: "error", message: SEND_ERROR, fields };
    }
  } catch (err) {
    console.error("[contacto] Excepción al enviar con Resend:", err);
    return { status: "error", message: SEND_ERROR, fields };
  }

  return { status: "success", name };
}
