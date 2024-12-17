## El Salon (v2)
El Salón nació como una plataforma para las materias de Proyecto Audiosivual de la carrera de Diseño de Imagen y Sonido FADU, UBA como una manera para el desarrollo de trabajo y devoluciones asincrónicas, mucho antes incluso que esta palabra entre en uso corriente. Esto permitió a la cátedra transitar la pandemia con un sistema que ya estaba probado y conocido por alumnxs y docentxs.

Con el tiempo la plataforma que El Salon usaba, HumHub, envejeció y las necesidades de sus usuarixs cambió. En vez de seguir forzando esa plataforma que se adopte a nuestras necesidades, en 2025 decidimos habitar nuestra propia plataforma de código abierto. Como toda migración hay cosas que se ganan y otras que se pierden, pero este nuevo enfoque nos da agencia sobre las opciones que la plataforma ofrece y cuáles queremos abordar en el futuro.

### Diseño de Información
La estructura de información se mantiene similar: hay usuarios que escriben entradas que van en salas. Incorporamos claridad sobre dónde es que uno está escribiendo, como también darle entidad desde la interfaz a la bitácora. Cada entrada tiene aprecios y comentarios. Pero su disposición cambió en términos de diseño. Una crítica que siempre tuve a HumHub es que los comentarios aparecían como algo menor en relación a las entradas, y si bien es necesario separarlos para entender la navegación, el nuevo Salón pone al mismo nivel de jerarquía las entradas, de sus comentarios.

### Editor
El editor de texto se purgó de botones innecesarios y se da acceso directo a las acciones comunes de formato o de subida de imagenes, o videos embebidos.

### Grupos
También se agregó el concepto de grupos, como una lista de usuarios, con un nombre y descripción; con la posibilidad de crear entradas bajo esta identidad. De esta forma una entrada, como por ejemplo una entrega puede ser compartida por distintos usuarios. Clickear sobre un grupo lleva rápidamente a obtener información sobre sus participantes.

### Archivo
Para las materias es importante separar el contenido entre distintos ciclos lectivos. Como HumHub no tenía una opción de _corte_ nuestra solución fue siempre crear nuevos espacios, pero llevaba a una tarea tediosa y manual de renombrar los viejos para mantener el archivo, crear los nuevos, asignar nombre, imágenes, logos etc. Lo peor esto era que el contenido que decidíamos mantener quedaba perdido, inconsulto por su dificultad de encontrar y la imposibilidad de indexar distintas salas como parte de una sola entidad. En el nuevo Salón todas las entradas históricas pertenecen a la misma sala, o materia. Solamente que a la hora de consultar se hace un corte temporal según si la materia es cuatrimestral o anual. Es decir al ver el feed de una sala, sólo muestra las entradas cuya fecha entra en las del ciclo lectivo actual. Esto también permite generar distintos _cortes de ciclos lectivos_ y acceder fácilmente a las entradas de otros cuatrimestres o años.

### Contenido Destacado
Contenido destacado. Los docentes tienen la opción de destacar contenido para promoverlo al feed principal de El Salón, independientemente de si los demás integrantes siguen al creador de esa entrada o no. El objetivo es que los docentes puedan curar el feed principal y promover diversidad de contenido.

### Contenido Fijado
Esta es una función que la versión anterior ya contaba, pero ocurría muy seguido que el contenido no era desfijado, haciendo que las salas se tapen de contenido importante como distintas fechas de entrega en la parte de arriba y todo el contenido nuevo quede perdido. Para remediar esto los contenidos fijados tienen una opción de vencimiento, similar a la de whatsapp. Al fijar una ventana da la opción de duración a asignarle (24hrs / 7 dias / 30 dias / hasta fin de año). Internamente cada opción llena un campo de fecha de vencimiento de cada fijada y revisa diariamente para remover las que tienen una fecha ya vencida.

### Colaboraciones
El funcionamiento es el mismo como el antes conocido *seguir* pero, al igual que apreciar, la manera de nombrar es también la forma de dictar una relación. Por eso en vez de seguir como verbo pasivo, se implementó la colaboración para entender el intercambio como un trabajo activo.

### Búsqueda
Esta función siempre funcionó de manera incómoda en HumHub, por cuestiones técnicas o de diseño. En el nuevo Salón priorizamos que la búsqueda sea clara y cómoda, por eso permite elegir sobre qué colección busacar: usuarios, entradas o grupos.

### Filtro por Comisiones
Para los docentes navegar por los aportes de una comisión siempre fue confuso. En el nuevo Salón, los alumnxs pueden colaborar no solo en una sala, sino también dentro de una comisión específica.
Esta nueva funcionalidad genera una vista unificada que agrupa automáticamente:

- Todas las entradas individuales de los usuarios de la comisión
- Entradas realizadas de manera grupal por esos integrantes
- Bitácoras de cada integrante

### Etiquetas
Esta función ya existía previamente en HumHub pero al ser de libre aporte, se generaban muchas etiquetas duplicadas por ejemplo trataba *entrega* y *entregas* como dos temas distintos por estar escrito el plural. En esta nueva versión las etiquetas son definidas previamente por el equipo, de una manera que la selección pueda ir mutando y ampliándose, pero guiando la manera en la que nos gustaría agrupar las distinas conversaciones

## Pendientes
Algunas funciones no estarán listas para el lanzamiento de Salón, siendo la más llamativas los resúmenes por mail que tienen una complejidad que tiene que resolverse con mayor dedicación. Es posible que en el futuro se vuelvan a implementar, pero también parece importante entender cuán útiles eran para docentxs y alumnxs. Notificaciones nativas (es decir desde el sistema operativo) tampoco estarán en una primera instancia, pero sí las notificaciones por mail al recibir un comentario o un aprecio. Estas se pueden desactivar desde opciones > configuración de usuario.