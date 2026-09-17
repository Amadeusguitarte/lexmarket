# LexMarket

**El siguiente paso, en buenas manos.**

MVP de un marketplace de asuntos jurídicos para Colombia. Diseño en lavanda suave, ciruela y blanco cálido. Clientes comparten un resumen, abogados verificados solicitan acceso y proponen acompañamiento. No exige tener un expediente terminado ni usar IA.

## Estado real

Aplicación implementada y preparada para configurar una **beta por invitación**. El repositorio por sí solo no equivale a un servicio desplegado. Sin configurar Supabase se puede ver la portada, pero no crear cuentas ni guardar casos. No hay cuentas, expedientes ni abogados ficticios que simulen un backend.

Puedes descargar y abrir [la vista HTML de la portada](docs/preview.html) sin configurar servicios. Se genera desde el mismo componente del sitio con `npm run preview:html`; los botones de registro de ese archivo solo explican que es una vista de diseño.

Incluye:

- Registro, confirmación de correo, inicio/cierre de sesión y recuperación de contraseña mediante Supabase Auth.
- Perfiles de cliente y abogado; tarjeta profesional, especialidades, presentación y verificación administrativa manual.
- Creación y edición de casos; borradores, publicación, pausa, acompañamiento y cierre.
- Marketplace solo para profesionales verificados, con filtros y búsqueda. El resumen publicado se almacena separado del relato privado.
- Solicitud, autorización y revocación de acceso al expediente. La autorización abarca los documentos que se agreguen después; el cliente lo confirma expresamente.
- Archivos PDF, DOCX y TXT privados (10 MB por archivo, 30 por caso), cuarentena, escaneo antivirus y extracción de texto en un proceso limitado.
- Propuestas con alcance, exclusiones, honorarios COP, tiempo estimado y condiciones de pago. Selección transaccional: una sola propuesta aceptada por caso.
- Conversaciones separadas por caso y abogado; actualización cada 15 segundos mientras la pestaña está visible.
- Seguimiento con novedades registradas por el profesional seleccionado. Cierre y valoración del cliente vinculada al encargo.
- Organización opcional con OpenAI: sugerencias privadas de categoría, título, hechos, dudas y resumen; consentimiento por solicitud y revisión humana antes de publicar.
- Exportación de la información visible en JSON; descarga de los archivos por separado.
- Rate limits persistentes, auditoría de accesos y verificaciones, cola de trabajos con reintentos, pruebas y CI.

## Arranque local

Necesitas Node.js 22 o posterior y un proyecto de Supabase.

```bash
npm ci
cp .env.example .env.local
# Completa las variables de Supabase en .env.local.
npm run dev
```

Abre `http://localhost:3000`. Para el worker, configura también sus variables en el entorno o en `.env`:

```bash
node --env-file=.env --import tsx worker/index.ts
```

La web no necesita el worker para registro, casos, propuestas y mensajes. Los archivos permanecen sin descarga hasta pasar el escaneo; la organización asistida también depende del worker.

## 1. Configura Supabase

1. Crea un proyecto y ejecuta, en orden, los archivos de `supabase/migrations/` desde el editor SQL. Son migraciones iniciales para un proyecto nuevo; no las ejecutes dos veces.
2. Las migraciones crean tablas, funciones y el bucket privado `case-files`. **No lo conviertas en público ni agregues políticas de lectura anónima.**
3. En Auth, habilita email/contraseña y confirmación de correo. Define Site URL y Redirect URLs para `http://localhost:3000` y tu dominio final. Configura SMTP para enviar correos reales y revisa los límites del proveedor.
4. Para esta primera beta, desactiva registros abiertos en Supabase y crea/invita usuarios desde su panel. Prueba el flujo con cuentas de ensayo antes de recibir expedientes reales. Ajusta el texto de registro cuando abras las altas al público.
5. Copia URL y clave pública a `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Copia la clave **service_role** únicamente a `SUPABASE_SERVICE_ROLE_KEY` en el servidor y el worker.
6. Añade a `ADMIN_EMAILS` el correo exacto de una cuenta confirmada, separando varios correos por coma. Esa cuenta también debe completar un perfil normal. La sección Verificaciones aparecerá para ella; no existe una contraseña de administrador en el código.

La verificación requiere comprobar identidad y habilitación en fuentes oficiales y registrar fuente, fecha y resultado. Una tarjeta escrita por el usuario no verifica por sí sola a nadie. Cambiar nombre o tarjeta devuelve el perfil a pendiente.

## 2. Configura el procesamiento de archivos

El worker se conecta a un daemon ClamAV por red privada mediante `CLAMAV_HOST` y `CLAMAV_PORT`. ClamAV necesita memoria y espacio para sus firmas; asigna recursos y verifica su actualización. No expongas el puerto 3310 a Internet.

Con Docker, copia `.env.example` a `.env`, completa los valores y ejecuta:

```bash
docker compose up --build -d
```

Esto levanta web, worker y scanner. Supabase sigue siendo el servicio externo de datos/autenticación/almacenamiento. La descarga inicial de firmas puede tardar; no uses la demora como motivo para desactivar la cuarentena.

Un archivo pasa a `clean` solo con respuesta positiva del antivirus. Un fallo de extracción no impide descargar un archivo limpio; se explica al usuario que ese archivo no aportará texto a la IA. PDFs escaneados no tienen OCR en esta beta. La extracción se ejecuta en un proceso con límite de memoria y tiempo.

## 3. Habilita IA si la necesitas

Configura `OPENAI_API_KEY` y `OPENAI_MODEL` tanto en la web como en el worker. Elige un modelo de tu cuenta que admita Responses API con Structured Outputs. No se fija un modelo por defecto para evitar contratar o asumir una opción sin configurarla.

Cada solicitud pide consentimiento. Envía el relato y el texto disponible de archivos ya limpios; máximo 80.000 caracteres por solicitud, con aviso si el material se recortó. Hay un límite inicial de 5 solicitudes por usuario/día. Establece también un presupuesto y límites en el proveedor: el límite por usuario no es un presupuesto global.

La llamada usa `store:false`. Esto no significa retención cero en todos los sistemas del proveedor. Revisa tus condiciones de tratamiento antes de procesar información real. La salida no se publica sola ni calcula viabilidad jurídica. Consulta la [documentación oficial de Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

Importar de ChatGPT/Claude en esta versión significa **pegar texto o cargar una exportación PDF/TXT**. No accede a cuentas Plus, chats privados ni enlaces compartidos automáticamente.

## 4. Despliega desde GitHub

Puedes usar Railway u otro host compatible con Docker. GitHub Pages no ejecuta este backend.

En Railway:

1. Crea el servicio web desde este repositorio y usa `Dockerfile`.
2. Define las variables de `.env.example` que correspondan. Las variables `NEXT_PUBLIC_*` se incorporan **durante el build** mediante Docker ARG; comprueba que Railway las pase al build y vuelve a construir cuando cambien.
3. Agrega un segundo servicio desde el mismo repositorio, seleccionando `Dockerfile.worker` como Dockerfile. Copia las variables privadas necesarias. No asignes un dominio público al worker.
4. Despliega el scanner en la red privada (imagen de `compose.yaml`, sin publicar 3310), asigna recursos suficientes y configura su hostname interno en el worker. Usa volumen persistente para las firmas.
5. Genera el dominio HTTPS del servicio web. Actualiza las URLs autorizadas de Supabase Auth y prueba confirmación de correo y recuperación de contraseña desde ese dominio.
6. Ejecuta el recorrido de `docs/ACCEPTANCE.md` con dos cuentas diferentes y confirma que la cola está procesando.

No hay credenciales ni proyecto de hosting incluidos. El dominio y cualquier servicio de pago se configuran en tus propias cuentas.

## Estructura

```text
app/                       Página principal, estilos y API de servidor
components/                Portada, formularios, portal y expediente
lib/browser.ts             Cliente Auth y solicitudes autenticadas
lib/server.ts              Autenticación, autorización y acceso al backend
lib/shared.ts              Validadores y reglas compartidas
supabase/migrations/       Tablas, permisos y operaciones transaccionales
worker/                    Cola, antivirus, extracción y organización opcional
tests/                     Seguridad, PostgreSQL embebido y estructura de UI
docs/                      Arquitectura y criterios de aceptación
Dockerfile                 Web de producción con usuario sin privilegios
Dockerfile.worker          Proceso de trabajos de fondo
compose.yaml               Entorno web + worker + antivirus
```

## Verificación

```bash
npm test
npm run typecheck
npm run build
```

Las pruebas ejecutan migraciones y transacciones en PostgreSQL embebido (PGlite), validan límites de acceso, intentos de autoverificación, estructura de la UI y el protocolo de escaneo con un transporte simulado. No sustituyen la prueba con tus servicios de Supabase, ClamAV y OpenAI. La versión inicial se comprobó sin credenciales de esos servicios y sin navegador gráfico disponible; no se afirma una validación visual o integral desplegada que no se haya realizado.

## Límites deliberados de la beta

No procesa pagos, no radica ante juzgados, no firma poderes, no ofrece asesoría automática, no importa chats por OAuth, no calcula vencimientos y no envía notificaciones de actividad por email/WhatsApp. Los emails de acceso los gestiona Supabase Auth. No hay búsqueda semántica, OCR, llamadas ni agenda. Las propuestas son inmutables después del envío; acuerden detalles por mensaje antes de enviarlas. Las listas iniciales muestran hasta 100 casos y hasta 500 mensajes por expediente; ampliar a paginación antes de superar esos volúmenes.

Antes de una apertura pública: completar textos legales con identidad del operador y canales de atención, determinar retención/borrado/exportación completa de datos, instrumentar moderación y reclamaciones sobre reseñas, acordar contratos y responsabilidades, configurar backups de **base de datos y objetos** y ensayar restauración. Una copia de la base no respalda automáticamente los archivos. Documentar el esquema comercial aplicable antes de cobrar por intermediación o tomar comisiones.

Este repositorio es público: no agregues expedientes reales, claves, archivos `.env` ni datos personales a commits o issues.
