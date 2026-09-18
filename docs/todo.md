## Directiva de Construcción y Flujo Paso a Paso (Semana 5)

Actúa como el Ingeniero de Software Backend del proyecto **CAPSTONE-TUR-2026** para la empresa **MISTIK TOURS & TRAVEL S.A.C.** Tu objetivo es implementar exclusivamente la capa de persistencia relacional y el núcleo de seguridad backend correspondiente a la **Semana 5**.

### Reglas de Ejecución y Control de Avance

- **Límite Estricto de Alcance (< 30%):** Solo debes implementar los paquetes de la Semana 5 (`3.2.1.2`, `3.2.1.4`, `5.1.2.1`, `5.1.2.2`). Queda **estrictamente prohibido** programar vistas en Angular 22, módulos de clientes CRM, reservas PNR o citas consulares, ya que corresponden a la Semana 6 en adelante.

- **Entorno Obligatorio:** NestJS v11 en **CommonJS (`CJS`) con Jest**, Prisma ORM v6 sobre PostgreSQL (Supabase).

- **Protocolo de Hitos y Confirmación:** Debes ejecutar el trabajo dividiéndolo en los **4 hitos secuenciales** detallados a continuación. Al culminar cada hito, **debes detenerte**, mostrar un resumen técnico de lo implementado, proponer el mensaje de `git commit` bajo la convención *Conventional Commits* y **esperar la indicación expresa del usuario antes de pasar al siguiente**.

---

## Desglose de Hitos de Implementación

### Hito 1: Setup del Entorno NestJS y Dependencias Core

**Alcance:**

- Inicializar el backend con Nest CLI seleccionando `CJS (CommonJS) [ with jest ]`.
- Instalar dependencias operativas: `@prisma/client`, `prisma`, `bcrypt`, `@types/bcrypt`, `@nestjs/jwt`, `passport`, `@nestjs/passport`, `passport-jwt`, `@types/passport-jwt`, `class-validator`, `class-transformer` y `@nestjs/swagger`.
- Configurar `ValidationPipe` global en `main.ts` con `whitelist: true` y `forbidNonWhitelisted: true`.
- Habilitar Swagger en la ruta `/api/docs` para la posterior demostración interactiva.

**Pausa requerida:** Detenerse y proponer el commit:

- `feat(core): setup nestjs cjs project with dependencies and swagger`

---

### Hito 2: Persistencia Relacional con Prisma ORM (`3.2.1.2` y `3.2.1.4`)

**Alcance:**

- Inicializar Prisma (`npx prisma init`) y configurar `DATABASE_URL` hacia Supabase PostgreSQL en `.env`.
- Definir en `prisma/schema.prisma` el modelo relacional en 3FN con los enums (`Role`, `ServiceType`, `BookingStatus`, `TaskStatus`, `Priority`, `Currency`) y las entidades: `User`, `Customer`, `Booking`, `Passenger`, `ServiceTask`, `Appointment`, `VisaProcess`, `PaymentRecord` y `AuditLog`.
- Ejecutar la migración inicial: `npx prisma migrate dev --name init_db_schema`.
- Crear el servicio y módulo global `PrismaService` (`prisma.service.ts`, `prisma.module.ts`).
- Crear un script seed (`prisma/seed.ts`) que inserte un usuario administrador inicial con contraseña hasheada con Bcrypt (`ADMIN`) para pruebas de acceso.

**Pausa requerida:** Detenerse y proponer el commit:

- `feat(database): configure schema prisma 3fn models migrations and seed`

---

### Hito 3: Servicio de Autenticación y Cifrado Bcrypt (`5.1.2.1` y `5.1.2.2`)

**Alcance:**

- Generar el módulo `AuthModule` y `UsersModule`.
- En `UsersService`: implementar la búsqueda de usuario por correo institucional y método de creación con hash de contraseña vía `bcrypt.hash(password, 10)`.
- En `AuthService`: implementar la validación de credenciales con `bcrypt.compare()` y generación del token JWT firmado con payload (`sub: user.id`, `email`, `role`) y tiempo de expiración (ej. 1h o 15m).
- En `AuthController`: crear el endpoint `POST /auth/login` documentado en Swagger, recibiendo `LoginDto` (`email` validado con `@IsEmail()`, `password` validado con `@MinLength(6)`) y retornando `{ accessToken, user: { id, email, name, role } }`.

**Pausa requerida:** Detenerse y proponer el commit:

- `feat(auth): implement bcrypt password hashing and jwt login endpoint`

---

### Hito 4: Protección de Rutas con Guards y Validación Funcional

**Alcance:**

- Implementar la estrategia Passport JWT (`jwt.strategy.ts`) validando la cabecera `Authorization: Bearer <token>`.
- Implementar `JwtAuthGuard` extendiendo de `AuthGuard('jwt')`.
- Crear un endpoint de verificación `GET /auth/profile` protegido con `JwtAuthGuard` que retorne los datos del usuario autenticado a través de un decorador personalizado `@CurrentUser()`.
- Verificar en local/Swagger que:
  1. Una petición a `/auth/profile` sin token retorne `401 Unauthorized`.
  2. La petición a `POST /auth/login` con credenciales de seed retorne el `accessToken`.
  3. Una petición a `/auth/profile` con el token generado retorne `200 OK`.

**Pausa requerida:** Detenerse y proponer el commit:

- `feat(auth): add jwt strategy guards and protected profile endpoint`

---

## Línea de Parada Obligatoria (Stop Line)

Al finalizar el **Hito 4**, no generes más código. El sistema alcanzará exactamente el **23.00%** de avance funcional, permitiendo realizar la demostración en vivo exigida para la Semana 5 mediante Swagger/Postman y Supabase, dejando las pantallas de Angular 22 y los servicios CRM intactos para la entrega formal T1 de la Semana 6.