# Estado de conexión de LexMarket

## Supabase

- Organización: LexMarket.
- Proyecto: LexMarket (`fibbbqewmipemsxpjeyc`).
- Región: `us-east-1`.
- API: https://fibbbqewmipemsxpjeyc.supabase.co
- Coste indicado por Supabase al crear el proyecto: USD 0/mes.
- Migraciones aplicadas: `001_initial`, `002_proposals`, `003_file_limit`.
- Comprobación posterior: 12 tablas con RLS habilitado; ningún permiso directo de tablas o funciones del marketplace para `anon` / `authenticated`.
- Bucket `case-files`: privado; máximo 10 MB por archivo.

El aviso informativo «RLS Enabled No Policy» es esperado: este MVP utiliza autorización en el servidor y no permite acceso directo a las tablas desde el navegador. No agregar políticas permisivas para eliminar ese aviso. [Explicación oficial](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Pendiente para que la aplicación esté operativa

- Desplegar web, worker y antivirus en Railway y configurar sus variables.
- Configurar la credencial privada de Supabase exclusivamente en los procesos de servidor; nunca en el repositorio ni en variables `NEXT_PUBLIC_*`.
- Establecer el dominio de Auth, URLs de retorno y correo transaccional.
- Definir la cuenta administradora y comprobar el recorrido de aceptación con cuentas de prueba.
- Si se activa IA, configurar la API y su presupuesto. El marketplace puede operar sin IA.

## Enlaces de revisión

- Código público: https://github.com/Amadeusguitarte/lexmarket
- Vista de diseño: https://lexmarket-review.amadeusart.chatgpt.site

La vista de diseño es estática. La creación del proyecto Supabase no transforma esa vista en la aplicación ni implica que el backend esté desplegado. El estado funcional debe confirmarse mediante `docs/ACCEPTANCE.md`.

