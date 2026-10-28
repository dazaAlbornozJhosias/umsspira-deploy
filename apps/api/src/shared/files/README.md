# Contratos y validación de archivos

contracts define la entrada de Multer que necesitan los casos de uso y la forma común de un archivo almacenado. policies valida tamaño, extensión y firma binaria de imágenes y limpia el nombre original para su uso como metadato.

No define un propietario genérico ni un bucket común: perfil y eventos tienen relaciones y permisos diferentes. Cada módulo conserva su almacenamiento y sus consultas autorizadas. Un nombre de archivo o una URL no demuestran propiedad.
