# Recorrido de aceptación con servicios configurados

Usa documentos de ensayo sin datos personales. Las siguientes comprobaciones requieren tus servicios reales; no se marcan como realizadas al ejecutar las pruebas unitarias.

1. Abre la portada en escritorio y móvil. Alterna los ejemplos del hero, abre las preguntas y prueba las entradas cliente/abogado. Recorre todo con teclado y movimiento reducido.
2. Crea o invita una cuenta de cliente y dos de abogado. Confirma sus correos; comprueba login, logout, recuperación y cambio de contraseña desde tu dominio.
3. Completa los perfiles. Un abogado pendiente no puede abrir el marketplace ni enviar propuestas llamando directamente a la API.
4. Entra como administrador y revisa la identidad/habilitación de los abogados. Registra evidencia. Solo después deben aparecer como verificados.
5. Cliente: crea un caso con relato, sin archivos. Guarda y edita un resumen. Sigue privado hasta pulsar Compartir y confirmar. Prueba pausa y republicación.
6. Abogado A: encuentra el resumen. No debe obtener descripción, archivos o mensajes antes del acceso. Abogado B debe estar igualmente aislado.
7. Solicita acceso con una nota. Cliente autoriza A. A puede leer y conversar; B no. Verifica el aislamiento con IDs copiados y solicitudes manuales a la API.
8. Carga TXT, DOCX y PDF de prueba. Comprueba preparando → disponible y descarga como adjunto. Prueba un archivo con formato inválido y confirma que se rechaza antes de subirlo. No uses malware real.
9. Carga un PDF sin texto y comprueba que la extracción incompleta se explique sin inventar contenido. Los límites de tamaño y cantidad deben rechazarse también fuera de la interfaz.
10. Si habilitaste OpenAI: autoriza una organización, espera al worker, revisa el resultado, edítalo y publícalo. Comprueba que la IA nunca publique sola y que la ausencia de clave permita seguir manualmente.
11. Autoriza B y recibe dos propuestas con alcances diferentes. Cada abogado ve solo su conversación/propuesta. Acepta una y comprueba que la otra queda no seleccionada y pierde acceso. Intenta aceptar simultáneamente las dos: solo una debe persistir.
12. Profesional seleccionado: confirma el encargo por el medio acordado, registra una novedad y adjunta un comprobante ficticio. Cliente cierra y valora. No debe permitirse una valoración de una cuenta que no contrató.
13. Retira el acceso y comprueba que nuevas descargas fallen. Confirma que suspensión de la verificación bloquea también nuevas lecturas privadas.
14. Exporta JSON y descarga un archivo. Elimina un documento y un borrador propio. Verifica que un usuario ajeno no pueda ejecutar estas acciones.
15. Prueba reinicio del worker, entrega de correos, logs sin datos sensibles y restauración de copias de base de datos **y** objetos antes de invitar clientes reales.

### Reintento de procesamiento fallido

Con el cliente propietario autenticado, el endpoint es `POST /api/documents/<document_id>/retry` con `Authorization: Bearer <access_token>`. Requiere estado `failed`; no reabre archivos bloqueados por malware. El operador puede ayudar desde una sesión autorizada, sin copiar tokens a issues o logs. La interfaz de la beta no incluye un panel operativo de jobs.
