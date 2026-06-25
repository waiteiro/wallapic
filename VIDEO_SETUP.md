# Configuración del Sistema de Videos

## 🎬 ¡Nueva Funcionalidad de Videos!

Ahora puedes agregar **videos** a tus entradas además de imágenes. Los videos son aleatorios, temáticos y se reproducen automáticamente en bucle.

## 📋 Configuración

### ✅ ¡Ya está configurado!

El sistema de videos **usa la misma API key de Pexels** que ya tienes configurada para las imágenes. No necesitas hacer nada adicional.

### 🎉 ¡Listo para usar!

Simplemente recarga la página y verás el nuevo botón de video al lado del botón de cambiar imagen.

## 🎮 Cómo Usar

### Botones Nuevos:

1. **📹 Botón de Video/Imagen** (primero a la izquierda)
   - Click para alternar entre modo imagen y modo video
   - El ícono cambia según el modo activo

2. **🔊 Botón de Audio** (aparece en modo video, esquina superior izquierda)
   - Click para activar/desactivar el audio del video
   - Por defecto, los videos están silenciados
   - También puedes hacer click directamente en el video

3. **🔄 Cambiar Video** (mismo botón de cambiar imagen)
   - En modo video, cambia a un video aleatorio
   - Cada video tiene un tema aleatorio diferente

### Modo Video:

- ✅ Videos HD de alta calidad de Pexels
- ✅ Reproducción automática en bucle
- ✅ Sin audio por defecto (activable)
- ✅ Temas aleatorios: naturaleza, espacio, ciudades, etc.
- ✅ Se guarda con la entrada
- ✅ El botón de categorías se deshabilita (videos son aleatorios)

### Guardar Entradas con Video:

Cuando guardas una entrada en modo video:
- Se guarda la referencia al video
- Al volver a abrir la entrada, se muestra el video
- Los créditos del autor del video aparecen abajo

## 🎨 Temas de Videos Disponibles

El sistema selecciona aleatoriamente entre 30+ temas:

- 🌊 **Naturaleza**: océano, bosques, montañas, flores
- 🌅 **Cielos**: amanecer, atardecer, nubes, aurora
- 🌧️ **Clima**: lluvia, nieve, niebla, tormentas
- 🏙️ **Urbano**: ciudades, luces nocturnas
- 🌌 **Espacio**: estrellas, cosmos
- 🔥 **Elementos**: fuego, agua, viento
- 🦋 **Vida**: animales, aves, vida silvestre
- 🎨 **Abstracto**: colores, movimiento, luces

## ⚙️ Características Técnicas

### API de Pexels:
- **Límite gratuito**: 200 solicitudes por hora
- **Calidad**: HD (1280x720 o superior)
- **Orientación**: Videos horizontales optimizados
- **Sin marca de agua**: Videos libres de marca
- **Atribución**: Automática en los créditos

### Especificaciones:
- Formato: MP4
- Reproducción: Loop infinito
- Audio: Muted por defecto
- Autoplay: Activado
- Responsive: Se adapta al tamaño de la pantalla

## 🔧 Solución de Problemas

### "Error al cargar video"
- Verifica que tu API key esté correctamente configurada
- Verifica que hayas recargado la página después de configurar
- Revisa la consola del navegador para más detalles

### Los videos no se reproducen automáticamente
- Es normal en algunos navegadores (política de autoplay)
- El usuario debe interactuar primero (click en cualquier parte)
- El video se reproducirá después de la primera interacción

### El botón de categorías está gris
- Es normal en modo video (los videos son aleatorios)
- Cambia de vuelta a modo imagen para usar categorías

## 📊 Límites y Recomendaciones

- **No abuses del botón "Cambiar video"**: Cada cambio consume una solicitud de API
- **200 solicitudes/hora es suficiente** para uso normal
- Si llegas al límite, espera una hora para continuar
- Los videos guardados no consumen solicitudes adicionales al abrirlos

## 🎯 Próximas Mejoras (Opcional)

Ideas para expandir:
- [ ] Permitir buscar videos por tema específico
- [ ] Agregar más fuentes de video (YouTube, Vimeo)
- [ ] Cache de videos favoritos
- [ ] Velocidad de reproducción ajustable
- [ ] Transiciones entre videos

## 📝 Notas

- Los videos se guardan por referencia URL, no se descargan
- Los videos provienen de Pexels, no se alojan en tu servidor
- Créditos automáticos al fotógrafo/videógrafo de Pexels
- Compatible con el sistema de entradas existente

---

**¿Problemas?** Revisa la consola del navegador (F12) para ver logs detallados.

**¿Sugerencias?** El sistema es completamente modular y extensible.

¡Disfruta creando entradas con videos! 🎬✨
