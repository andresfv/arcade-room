"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { sendContactMessage, type ContactFields, type ContactState } from "@/app/acerca/actions";

const EMPTY: ContactFields = { name: "", email: "", msg: "" };
const IDLE: ContactState = { status: "idle" };

// Honeypot: invisible para personas, visible para bots que rellenan todos los campos.
const HONEYPOT_STYLE = { position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" } as const;

/**
 * Formulario de contacto de /acerca (marcado portado de references/templates/home-about/about.jsx).
 * "ENVIAR OTRO MENSAJE" cambia la `key` para remontarlo: estado de la acción y campos vuelven a cero.
 */
export function ContactForm() {
  const [formKey, setFormKey] = useState(0);
  return <ContactFormBody key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}

function ContactFormBody({ onReset }: { onReset: () => void }) {
  const [form, setForm] = useState<ContactFields>(EMPTY);
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    setShake(true);
    shakeTimer.current = setTimeout(() => setShake(false), 400);
  };

  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
  }, []);

  const [state, formAction, pending] = useActionState(async (prev: ContactState, formData: FormData) => {
    const next = await sendContactMessage(prev, formData);
    if (next.status === "error") {
      // Lo escrito se conserva: se repone desde lo que devuelve el servidor.
      setForm(next.fields);
      triggerShake();
    }
    return next;
  }, IDLE);

  // Validación de vacíos en cliente: sin petición al servidor, solo shake (como la plantilla).
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      triggerShake();
    }
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} action={formAction} onSubmit={onSubmit}>
      {state.status !== "success" ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@room.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>
          <div style={HONEYPOT_STYLE} aria-hidden="true">
            <label htmlFor="contact-website">Sitio web</label>
            <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          </div>
          <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={pending}>
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
          {state.status === "error" && !pending && (
            <p className="contact-error" role="alert">
              {state.message}
            </p>
          )}
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="term-title">ROOM-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">room@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success" role="status">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
