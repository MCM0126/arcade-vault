import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { name, email, msg } = body

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'max.collazosm@gmail.com',
      subject: 'Nuevo mensaje de contacto — Arcade Vault',
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
