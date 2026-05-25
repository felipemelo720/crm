export const ESTADOS_CLIENTE = {
  ACTIVO: { label: "Activo", color: "bg-green-100 text-green-800" },
  INACTIVO: { label: "Inactivo", color: "bg-gray-100 text-gray-800" },
  PROSPECTO: { label: "Prospecto", color: "bg-blue-100 text-blue-800" },
  PAUSADO: { label: "Pausado", color: "bg-yellow-100 text-yellow-800" },
} as const

export const ESTADOS_LEAD = {
  NUEVO: { label: "Nuevo", color: "bg-blue-100 text-blue-800" },
  CONTACTADO: { label: "Contactado", color: "bg-indigo-100 text-indigo-800" },
  DIAGNOSTICO: { label: "Diagnóstico", color: "bg-purple-100 text-purple-800" },
  PROPUESTA_ENVIADA: { label: "Propuesta Enviada", color: "bg-yellow-100 text-yellow-800" },
  SEGUIMIENTO: { label: "Seguimiento", color: "bg-orange-100 text-orange-800" },
  NEGOCIACION: { label: "Negociación", color: "bg-amber-100 text-amber-800" },
  GANADO: { label: "Ganado", color: "bg-green-100 text-green-800" },
  PERDIDO: { label: "Perdido", color: "bg-red-100 text-red-800" },
} as const

export const FUENTES_LEAD = {
  REFERIDO: "Referido",
  WEB: "Web",
  REDES_SOCIALES: "Redes Sociales",
  EMAIL: "Email",
  LLAMADA: "Llamada",
  EVENTO: "Evento",
  OTRO: "Otro",
} as const

export const ESTADOS_PROPUESTA = {
  BORRADOR: { label: "Borrador", color: "bg-gray-100 text-gray-800" },
  ENVIADA: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
  NEGOCIACION: { label: "Negociación", color: "bg-yellow-100 text-yellow-800" },
  APROBADA: { label: "Aprobada", color: "bg-green-100 text-green-800" },
  RECHAZADA: { label: "Rechazada", color: "bg-red-100 text-red-800" },
  VENCIDA: { label: "Vencida", color: "bg-orange-100 text-orange-800" },
} as const

export const ESTADOS_PROYECTO = {
  PENDIENTE_INFO: { label: "Pendiente Info", color: "bg-gray-100 text-gray-800" },
  PLANIFICADO: { label: "Planificado", color: "bg-blue-100 text-blue-800" },
  DESARROLLO: { label: "Desarrollo", color: "bg-indigo-100 text-indigo-800" },
  REVISION: { label: "Revisión", color: "bg-purple-100 text-purple-800" },
  CORRECCIONES: { label: "Correcciones", color: "bg-yellow-100 text-yellow-800" },
  ENTREGADO: { label: "Entregado", color: "bg-teal-100 text-teal-800" },
  CERRADO: { label: "Cerrado", color: "bg-green-100 text-green-800" },
  PAUSADO: { label: "Pausado", color: "bg-orange-100 text-orange-800" },
} as const

export const PRIORIDADES_PROYECTO = {
  BAJA: { label: "Baja", color: "bg-gray-100 text-gray-700" },
  MEDIA: { label: "Media", color: "bg-blue-100 text-blue-700" },
  ALTA: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  CRITICA: { label: "Crítica", color: "bg-red-100 text-red-700" },
} as const

export const ESTADOS_TAREA = {
  PENDIENTE: { label: "Pendiente", color: "bg-gray-100 text-gray-800" },
  EN_PROGRESO: { label: "En Progreso", color: "bg-blue-100 text-blue-800" },
  EN_REVISION: { label: "En Revisión", color: "bg-purple-100 text-purple-800" },
  BLOQUEADA: { label: "Bloqueada", color: "bg-red-100 text-red-800" },
  COMPLETADA: { label: "Completada", color: "bg-green-100 text-green-800" },
  CANCELADA: { label: "Cancelada", color: "bg-gray-100 text-gray-500" },
} as const

export const TIPOS_TAREA = {
  COMERCIAL: "Comercial",
  DESARROLLO: "Desarrollo",
  WORDPRESS: "WordPress",
  WOOCOMMERCE: "WooCommerce",
  SOPORTE: "Soporte",
  DNS: "DNS",
  CORREOS: "Correos",
  AUTOMATIZACION: "Automatización",
  CONTENIDO: "Contenido",
  SEO: "SEO",
  ADMINISTRACION: "Administración",
  FINANZAS: "Finanzas",
  MARKETING: "Marketing",
} as const

export const PRIORIDADES_TAREA = {
  BAJA: { label: "Baja", color: "bg-gray-100 text-gray-700" },
  MEDIA: { label: "Media", color: "bg-blue-100 text-blue-700" },
  ALTA: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  URGENTE: { label: "Urgente", color: "bg-red-100 text-red-700" },
} as const

export const ESTADOS_PAGO = {
  PENDIENTE: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  PAGADO: { label: "Pagado", color: "bg-green-100 text-green-800" },
  VENCIDO: { label: "Vencido", color: "bg-red-100 text-red-800" },
  PARCIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800" },
  ANULADO: { label: "Anulado", color: "bg-gray-100 text-gray-500" },
} as const

export const TIPOS_SERVICIO = {
  SITIO_WEB_CORPORATIVO: "Sitio Web Corporativo",
  ECOMMERCE: "E-commerce",
  MANTENCION_WEB: "Mantención Web",
  SOPORTE_TECNICO: "Soporte Técnico",
  AUTOMATIZACION: "Automatización",
  CONSULTORIA: "Consultoría",
  SEO: "SEO",
  EMAIL_MARKETING: "Email Marketing",
  OTRO: "Otro",
} as const

export const FORMAS_PAGO = {
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  EFECTIVO: "Efectivo",
  CHEQUE: "Cheque",
} as const

export const AREAS_PRODUCTIVIDAD = {
  CARRERA: { label: "Carrera", color: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
  CRECIMIENTO: { label: "Crecimiento", color: "bg-purple-500", badge: "bg-purple-100 text-purple-800" },
  NEGOCIO: { label: "Negocio", color: "bg-orange-500", badge: "bg-orange-100 text-orange-800" },
  SALUD: { label: "Salud", color: "bg-green-500", badge: "bg-green-100 text-green-800" },
  OTRO: { label: "Otro", color: "bg-gray-400", badge: "bg-gray-100 text-gray-700" },
} as const

export const TIPOS_PAGO = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
} as const

export function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function isOverdue(date: Date | string | null | undefined) {
  if (!date) return false
  return new Date(date) < new Date()
}
