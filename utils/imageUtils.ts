/**
 * Redimensiona e comprime uma imagem (Data URL) para uso seguro em avatares.
 * Mantém a proporção dentro de `maxSize` x `maxSize`, preservando transparência
 * via WebP (ou usando fundo branco no fallback JPEG).
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

      // Tenta WebP primeiro para preservar fundo transparente com alta compressão
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/webp', 0.85);
      if (compressed.startsWith('data:image/webp')) {
        if (compressed.length > maxLength) {
          compressed = canvas.toDataURL('image/webp', 0.65);
        }
        resolve(compressed);
        return;
      }

      // Fallback para JPEG sobre fundo branco (evita fundo preto em PNGs transparentes)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      compressed = canvas.toDataURL('image/jpeg', 0.82);
      if (compressed.length > maxLength) {
        compressed = canvas.toDataURL('image/jpeg', 0.6);
      }

      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
    img.src = rawDataUrl;
  });
};
