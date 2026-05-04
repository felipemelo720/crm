import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Import Prisma client from generated location
const { PrismaClient } = await import('../app/generated/prisma/client.js').catch(() => {
  return import('../app/generated/prisma/index.js')
})

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding...")

  const c1 = await prisma.cliente.create({
    data: {
      empresa: "Constructora Los Andes SpA",
      rut: "76.543.210-K",
      rubro: "Construcción",
      ciudad: "Santiago",
      contactoNombre: "Roberto Morales",
      email: "rmorales@losandes.cl",
      telefono: "+56 9 8765 4321",
      sitioWeb: "https://constructoralosandes.cl",
      dominio: "constructoralosandes.cl",
      estado: "ACTIVO",
      servicios: JSON.stringify(["SITIO_WEB_CORPORATIVO", "MANTENCION_WEB"]),
      observaciones: "Cliente desde 2022. Paga puntual. Requiere soporte mensual.",
    },
  })

  const c2 = await prisma.cliente.create({
    data: {
      empresa: "Dental Smile Centro Odontológico",
      rut: "77.123.456-7",
      rubro: "Salud",
      ciudad: "Viña del Mar",
      contactoNombre: "Dra. Patricia Soto",
      email: "psoto@dentalsmile.cl",
      telefono: "+56 9 7654 3210",
      dominio: "dentalsmile.cl",
      estado: "ACTIVO",
      servicios: JSON.stringify(["SITIO_WEB_CORPORATIVO"]),
    },
  })

  const c3 = await prisma.cliente.create({
    data: {
      empresa: "Tienda Outdoor Chile",
      rut: "78.901.234-5",
      rubro: "Retail",
      ciudad: "Concepción",
      contactoNombre: "Andrés Vega",
      email: "avega@outdoorchile.cl",
      telefono: "+56 9 6543 2109",
      dominio: "outdoorchile.cl",
      estado: "ACTIVO",
      servicios: JSON.stringify(["ECOMMERCE", "SOPORTE_TECNICO"]),
    },
  })

  const c4 = await prisma.cliente.create({
    data: {
      empresa: "Consultora HR Partners",
      rut: "79.234.567-8",
      rubro: "Recursos Humanos",
      ciudad: "Santiago",
      contactoNombre: "Carolina Reyes",
      email: "creyes@hrpartners.cl",
      estado: "PROSPECTO",
    },
  })

  await prisma.lead.createMany({
    data: [
      { nombre: "Mario Fuentes", empresa: "Agencia Inmobiliaria Norte", fuente: "REFERIDO", servicio: "SITIO_WEB_CORPORATIVO", dolorPrincipal: "Sitio web desactualizado, no es mobile", presupuesto: 850000, probabilidad: 75, estado: "PROPUESTA_ENVIADA", proximoSeguimiento: new Date(Date.now() + 2 * 86400000), notas: "Muy interesado. Espera propuesta formal." },
      { nombre: "Isabel Castro", empresa: "Clínica Veterinaria PetCare", fuente: "WEB", servicio: "SITIO_WEB_CORPORATIVO", dolorPrincipal: "Sin presencia web, perdiendo clientes", presupuesto: 450000, probabilidad: 60, estado: "DIAGNOSTICO", proximoSeguimiento: new Date(Date.now() + 4 * 86400000) },
      { nombre: "Pedro Alarcón", empresa: "Distribuidora Alimentos Sur", fuente: "REDES_SOCIALES", servicio: "ECOMMERCE", dolorPrincipal: "Quiere vender online", presupuesto: 2500000, probabilidad: 45, estado: "SEGUIMIENTO", proximoSeguimiento: new Date(Date.now() + 86400000) },
      { nombre: "Luis Herrera", empresa: "Taller Mecánico HerAuto", fuente: "REFERIDO", servicio: "SITIO_WEB_CORPORATIVO", presupuesto: 350000, probabilidad: 30, estado: "CONTACTADO" },
      { nombre: "Sofía Mendez", empresa: "Psicóloga independiente", fuente: "WEB", servicio: "SITIO_WEB_CORPORATIVO", presupuesto: 300000, probabilidad: 85, estado: "NEGOCIACION", proximoSeguimiento: new Date(Date.now() + 86400000), notas: "Negociando precio. Puede cerrar esta semana." },
    ],
  })

  const prop2 = await prisma.propuesta.create({
    data: { titulo: "E-commerce WooCommerce + migración", servicio: "ECOMMERCE", valor: 2200000, formaPago: "TRANSFERENCIA", fechaEnvio: new Date(Date.now() - 10 * 86400000), fechaVencimiento: new Date(Date.now() - 2 * 86400000), estado: "APROBADA", clienteId: c3.id },
  })

  await prisma.propuesta.create({
    data: { titulo: "Sitio Web Corporativo + SEO básico", servicio: "SITIO_WEB_CORPORATIVO", valor: 850000, formaPago: "TRANSFERENCIA", fechaEnvio: new Date(Date.now() - 3 * 86400000), fechaVencimiento: new Date(Date.now() + 12 * 86400000), estado: "ENVIADA", clienteId: c4.id, comentarios: "Incluye diseño, desarrollo, hosting primer año." },
  })

  const proj1 = await prisma.proyecto.create({
    data: { nombre: "E-commerce Outdoor Chile", descripcion: "Tienda WooCommerce completa con pasarela de pago.", servicio: "ECOMMERCE", estado: "DESARROLLO", prioridad: "ALTA", fechaInicio: new Date(Date.now() - 15 * 86400000), fechaEntrega: new Date(Date.now() + 20 * 86400000), valor: 2200000, horasEstimadas: 80, horasReales: 35, clienteId: c3.id, propuestaId: prop2.id, proximosPasos: "Integrar Webpay, subir catálogo, pruebas." },
  })

  await prisma.proyecto.create({
    data: { nombre: "Mantención Mensual Los Andes", servicio: "MANTENCION_WEB", estado: "DESARROLLO", prioridad: "MEDIA", fechaInicio: new Date(Date.now() - 60 * 86400000), fechaEntrega: new Date(Date.now() + 30 * 86400000), valor: 150000, clienteId: c1.id },
  })

  await prisma.proyecto.create({
    data: { nombre: "Sitio Web Dental Smile", servicio: "SITIO_WEB_CORPORATIVO", estado: "REVISION", prioridad: "ALTA", fechaInicio: new Date(Date.now() - 25 * 86400000), fechaEntrega: new Date(Date.now() + 5 * 86400000), valor: 720000, horasEstimadas: 40, horasReales: 38, clienteId: c2.id, proximosPasos: "Correcciones feedback cliente, ajuste formulario contacto." },
  })

  await prisma.tarea.createMany({
    data: [
      { titulo: "Integrar Webpay Plus en Outdoor Chile", tipo: "WOOCOMMERCE", prioridad: "ALTA", estado: "EN_PROGRESO", fechaLimite: new Date(Date.now() + 3 * 86400000), tiempoEstimado: 8, tiempoReal: 3, clienteId: c3.id, proyectoId: proj1.id },
      { titulo: "Configurar DNS correos Dental Smile", tipo: "DNS", prioridad: "ALTA", estado: "PENDIENTE", fechaLimite: new Date(Date.now() - 86400000), tiempoEstimado: 1, clienteId: c2.id, comentarios: "MX records para Google Workspace" },
      { titulo: "Actualizar plugins WordPress Los Andes", tipo: "WORDPRESS", prioridad: "MEDIA", estado: "PENDIENTE", fechaLimite: new Date(Date.now() + 7 * 86400000), tiempoEstimado: 0.5, clienteId: c1.id },
      { titulo: "Subir catálogo 200 productos Outdoor", tipo: "WOOCOMMERCE", prioridad: "ALTA", estado: "PENDIENTE", fechaLimite: new Date(Date.now() + 8 * 86400000), tiempoEstimado: 6, clienteId: c3.id, proyectoId: proj1.id },
      { titulo: "Enviar propuesta Agencia Inmobiliaria Norte", tipo: "COMERCIAL", prioridad: "URGENTE", estado: "PENDIENTE", fechaLimite: new Date(Date.now() + 86400000), tiempoEstimado: 2 },
      { titulo: "Backup mensual todos los sitios", tipo: "ADMINISTRACION", prioridad: "MEDIA", estado: "PENDIENTE", fechaLimite: new Date(Date.now() + 10 * 86400000), tiempoEstimado: 1 },
    ],
  })

  await prisma.pago.createMany({
    data: [
      { descripcion: "Mantención web Octubre 2024", tipo: "INGRESO", servicio: "MANTENCION_WEB", monto: 150000, fechaEmision: new Date(Date.now() - 35 * 86400000), fechaPago: new Date(Date.now() - 33 * 86400000), estado: "PAGADO", metodoPago: "TRANSFERENCIA", utilidadEstimada: 120000, clienteId: c1.id },
      { descripcion: "Anticipo 50% E-commerce Outdoor Chile", tipo: "INGRESO", servicio: "ECOMMERCE", monto: 1100000, fechaEmision: new Date(Date.now() - 14 * 86400000), fechaPago: new Date(Date.now() - 12 * 86400000), estado: "PAGADO", metodoPago: "TRANSFERENCIA", utilidadEstimada: 800000, clienteId: c3.id, proyectoId: proj1.id },
      { descripcion: "Saldo 50% E-commerce Outdoor Chile", tipo: "INGRESO", servicio: "ECOMMERCE", monto: 1100000, fechaEmision: new Date(Date.now() + 20 * 86400000), estado: "PENDIENTE", clienteId: c3.id, proyectoId: proj1.id },
      { descripcion: "Sitio Web Dental Smile - Pago total", tipo: "INGRESO", servicio: "SITIO_WEB_CORPORATIVO", monto: 720000, fechaEmision: new Date(Date.now() - 20 * 86400000), estado: "PENDIENTE", clienteId: c2.id },
      { descripcion: "Hosting anual Namecheap", tipo: "GASTO", monto: 85000, fechaEmision: new Date(Date.now() - 5 * 86400000), fechaPago: new Date(Date.now() - 5 * 86400000), estado: "PAGADO", metodoPago: "CREDITO" },
    ],
  })

  console.log("✅ Seed completado con datos de ejemplo")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
