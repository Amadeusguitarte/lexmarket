# Arquitectura de la beta

## Fronteras de acceso

El navegador solo usa la clave pública para Supabase Auth. Envía el access token en `Authorization: Bearer` a la API Next.js. La API verifica cada token con `auth.getUser`, exige correo confirmado y consulta el perfil del servidor: no confía en roles de metadata ni en IDs de propietario enviados por el navegador.

Las tablas tienen RLS habilitado, sin políticas ni permisos para `anon`/`authenticated`. La API y el worker usan `service_role`, que evita RLS; por ello **la autorización por recurso del servidor es obligatoria**, no una defensa opcional. La clave nunca debe importarse en componentes cliente ni exponerse como `NEXT_PUBLIC_*`. En una siguiente iteración se pueden trasladar más operaciones a clientes SQL con JWT y políticas por fila; esta versión escoge una frontera de servidor única, explícita y comprobable.

| Recurso | Cliente propietario | Abogado verificado | Otro usuario |
|---|---|---|---|
| Borrador y relato | Leer, editar en borrador | Solo con autorización vigente | Denegado |
| Marketplace | Ve su publicación en su espacio | Lee resumen publicado | Denegado |
| Documentos | Carga y descarga tras escaneo | Descarga con autorización; carga si es seleccionado | Denegado |
| Conversación | Accede a sus hilos | Solo su hilo autorizado | Denegado |
| Propuestas | Ve todas las propias del caso | Solo las que envió | Denegado |
| Verificación | No puede asignarla | No puede asignarla | Solo admin por allowlist de correo verificado |

Publicación y selección se realizan con funciones SQL que bloquean la fila del caso. La selección acepta una sola propuesta, cierra las demás, retira accesos alternativos y elimina el anuncio en una transacción. Un índice único parcial impide dos propuestas aceptadas para el mismo caso. Otra función comprueba estado y acceso al enviar propuestas.

## Archivos

Web valida tamaño real del request y del archivo, extensión y cabecera; escribe con ruta aleatoria en bucket privado, registra metadata y crea un trabajo. El archivo permanece en cuarentena. Si falla crear metadata se elimina el objeto recién subido; si falla encolar se marca el documento como fallido. La comprobación de límite usa un bloqueo SQL además del chequeo de interfaz.

Worker reclama un trabajo con `FOR UPDATE SKIP LOCKED`, asigna una ventana de diez minutos e incrementa intentos. Envía los bytes a ClamAV por INSTREAM; cualquier respuesta distinta de `OK` o `FOUND` es error y mantiene el archivo sin acceso. Extracción de PDF/DOCX/TXT ocurre en proceso separado, con 128 MB de heap y timeout de 25 s. Un antivirus no constituye garantía absoluta de seguridad; los archivos se descargan como adjuntos y nunca se insertan como HTML ejecutable.

La descarga vuelve a comprobar token, perfil, acceso y estado limpio cada vez y devuelve bytes a través del servidor con `no-store`. No se publican URLs permanentes ni enlaces firmados que sobrevivan a la revocación. Una revocación no puede borrar una descarga ya efectuada.

## IA

El usuario autoriza cada trabajo. El worker solo utiliza el texto que pasó por el flujo de seguridad, marca los recortes y errores de extracción y consulta Responses API con JSON Schema. La entrada se trata como datos no confiables; no se conceden herramientas, navegación o acciones al modelo. Se valida la estructura con Zod. La salida queda en `cases.ai_result` y no modifica el borrador ni el anuncio. El usuario abre el editor con la sugerencia y decide qué guardar y publicar.

## Estados

- Caso: borrador → publicado ↔ borrador; publicado → acompañamiento → cerrado.
- Acceso: solicitado → autorizado ↔ retirado. Tras selección solo se puede autorizar al abogado seleccionado.
- Propuesta: pendiente → aceptada o no seleccionada. Una propuesta por abogado/caso en esta beta.
- Archivo: cuarentena → limpio / bloqueado / fallido. Fallo técnico admite reintento por API; un archivo bloqueado no.
- Trabajo: en cola → trabajando → terminado; hasta tres intentos antes de fallo. Un worker caído deja una ventana recuperable de diez minutos.

## Operación y límites pendientes

- No existe transacción distribuida entre Storage y PostgreSQL: programar reconciliación de objetos huérfanos y trabajos fallidos antes de escalar. El borrado elimina objetos y después registros; una caída intermedia requiere intervención del operador.
- Los logs evitan texto legal, tokens y cuerpos de respuesta de proveedores; la auditoría guarda actor, acción, destino y evidencia administrativa.
- No hay SLA ni cálculo jurídico de fechas. Los hitos son anotaciones del profesional, no consultas a la Rama Judicial.
- Configurar alertas de disponibilidad, backlog de jobs, uso de IA, almacenamiento y errores. El repositorio incluye CI; no configura por sí solo un servicio externo de monitoreo.
- El plan de retención, eliminación de cuenta y moderación de reseñas aún requiere procesos operativos y herramientas adicionales antes del lanzamiento abierto. La beta permite eliminar borradores y documentos propios y exportar la información accesible del caso.
- El registro público debe mantenerse deshabilitado hasta completar contratos, privacidad y soporte. Revisar jurisdicciones y obligaciones aplicables antes de expandir fuera de Colombia.

## Diseño

Paleta: tinta `#292335`, ciruela `#765399`, lavanda `#f0eaf7`, fondo `#fcfbf9`. Marca tipográfica, sin hoja ni símbolos de justicia como logo. Tipografía de sistema para cuerpo y serif editorial en el énfasis del hero; no descarga fuentes de terceros. Botones y tarjetas con radios suaves. Animaciones breves, sin rotaciones continuas ni carruseles obligatorios; `prefers-reduced-motion` desactiva movimiento. El modal nativo controla foco y Escape; etiquetas, estados vacíos y errores son parte de los flujos.
