const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.9;
const EXTENSIONS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

export const toSquareImage = async (file: File, maxSide: number): Promise<File> => {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const target = Math.min(side, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, target, target);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY));
    if (!blob) throw new Error("The image could not be encoded");
    return new File([blob], `avatar.${EXTENSIONS[blob.type] ?? "png"}`, { type: blob.type });
};
