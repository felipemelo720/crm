-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa" TEXT NOT NULL,
    "rut" TEXT,
    "rubro" TEXT,
    "ciudad" TEXT,
    "contactoNombre" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "sitioWeb" TEXT,
    "dominio" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "servicios" TEXT,
    "observaciones" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "fuente" TEXT NOT NULL DEFAULT 'WEB',
    "servicio" TEXT,
    "dolorPrincipal" TEXT,
    "presupuesto" REAL,
    "probabilidad" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "ultimoContacto" DATETIME,
    "proximoSeguimiento" DATETIME,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "clienteId" TEXT,
    CONSTRAINT "leads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "propuestas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "formaPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "fechaEnvio" DATETIME,
    "fechaVencimiento" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "comentarios" TEXT,
    "archivoUrl" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "clienteId" TEXT NOT NULL,
    "leadId" TEXT,
    CONSTRAINT "propuestas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "propuestas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "servicio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "fechaInicio" DATETIME,
    "fechaEntrega" DATETIME,
    "valor" REAL,
    "horasEstimadas" REAL,
    "horasReales" REAL,
    "riesgos" TEXT,
    "proximosPasos" TEXT,
    "repositorio" TEXT,
    "urlProduccion" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "clienteId" TEXT NOT NULL,
    "propuestaId" TEXT,
    CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "proyectos_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "propuestas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'DESARROLLO',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaLimite" DATETIME,
    "tiempoEstimado" REAL,
    "tiempoReal" REAL,
    "comentarios" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "clienteId" TEXT,
    "proyectoId" TEXT,
    CONSTRAINT "tareas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tareas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'INGRESO',
    "servicio" TEXT,
    "monto" REAL NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPago" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "utilidadEstimada" REAL,
    "numeroDocumento" TEXT,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "clienteId" TEXT,
    "proyectoId" TEXT,
    CONSTRAINT "pagos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pagos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rut_key" ON "clientes"("rut");
