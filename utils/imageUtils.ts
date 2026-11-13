/**
 * Redimensiona e comprime uma imagem (Data URL) para uso seguro em avatares.
 * Mantém a proporção dentro de `maxSize` x `maxSize` e exporta em JPEG.
 */
export const compressAvatarDataUrl = (
  rawDataUrl: string,
  maxSize = 256,
  maxLength = 120000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      let compressed = canvas.toDataURL('image/jpeg', 0.82);

      if (compressed.length > maxLength) {
        compressed = canvas.toDataURL('image/jpeg', 0.6);
      }

      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
    img.src = rawDataUrl;
  });
};

